/**
 * B7 eval gate — runs the live assistant against the golden set, grades each answer with an
 * LLM-judge, and exits non-zero if the baseline is not met. NOT part of the vitest suite.
 *
 * Run from assistant/apps/api:
 *   pnpm eval
 *   (== node --env-file=../../.env --import tsx src/evals/runEvals.ts)
 */
import { assistant } from '../agent/runtime';
import { routerClient } from '../agent/llm';
import { env } from '../config/env';
import { GOLDEN_QUESTIONS, type GoldenQuestion } from './goldenQuestions';
import { buildJudgePrompt, parseJudgeVerdict, type JudgeVerdict } from './judge';
import { aggregate, BASELINE, meetsBaseline, scoreQuestion, type QuestionResult } from './score';

async function judgeAnswer(q: GoldenQuestion, answer: string): Promise<JudgeVerdict> {
  const { system, user } = buildJudgePrompt({
    question: q.question,
    rubric: q.rubric,
    answer,
    language: q.language,
  });
  const completion = await routerClient.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return parseJudgeVerdict(completion.choices[0]?.message?.content ?? '');
}

function fmt(r: QuestionResult): string {
  const mark = r.pass ? '✅' : '❌';
  const grounding = r.cited ? `cited${r.expectedDocCited ? '' : ' (wrong doc)'}` : 'no-cite';
  return `${mark} ${r.id.padEnd(26)} judge=${r.judgeScore}/5 ${r.judgePass ? 'pass' : 'fail'} | ${grounding} | kw ${r.keywordHits}/${r.keywordTotal}`;
}

async function main(): Promise<void> {
  console.log(`Running ${GOLDEN_QUESTIONS.length} golden questions against ${env.OPENAI_CHAT_MODEL}\n`);
  const results: QuestionResult[] = [];

  for (const q of GOLDEN_QUESTIONS) {
    const { answer, citations } = await assistant.runMessage(q.question, { userLanguage: q.language });
    const verdict = await judgeAnswer(q, answer);
    const result = scoreQuestion(q, { answer, citations }, verdict);
    results.push(result);
    console.log(fmt(result));
    if (!result.pass) console.log(`    ↳ ${verdict.reason || '(no reason)'}`);
  }

  const agg = aggregate(results);
  const verdict = meetsBaseline(agg);
  console.log(
    `\nSummary: ${agg.passed}/${agg.total} passed (${(agg.passRate * 100).toFixed(0)}%), ` +
      `avg judge score ${agg.avgScore.toFixed(2)}/5`,
  );
  console.log(`Baseline: pass≥${(BASELINE.minPassRate * 100).toFixed(0)}%, avg≥${BASELINE.minAvgScore}`);

  if (verdict.ok) {
    console.log('GATE: baseline met ✅');
  } else {
    console.log(`GATE: baseline NOT met ❌ — ${verdict.reasons.join('; ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('eval run FAILED:', err?.message ?? err);
  process.exit(1);
});
