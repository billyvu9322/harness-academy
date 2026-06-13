/**
 * B7 eval gate — runs the live assistant against the golden set, grades each answer with an
 * LLM-judge, and exits non-zero if the baseline is not met. NOT part of the vitest suite.
 *
 * Run from assistant/apps/api:
 *   pnpm eval
 *   (== node --env-file=../../.env --import tsx src/evals/runEvals.ts)
 */
import { GOLDEN_QUESTIONS, type GoldenQuestion } from './goldenQuestions';
import type { StreamEvent } from '@assistant/shared/events';
import { buildJudgePrompt, parseJudgeVerdict, type JudgeVerdict } from './judge';
import { aggregate, BASELINE, meetsBaseline, scoreQuestion, type QuestionResult } from './score';
import { buildJsonReport, formatResultLine, type EvalAttemptReportInput } from './reporter';
import { parseRunOptions, printUsage, type RunOptions } from './runOptions';
import { validateStreamEvents } from './streamValidation';

type AssistantRuntime = typeof import('../agent/runtime')['assistant'];
type RouterClient = typeof import('../agent/llm')['routerClient'];
type StreamAssistant = typeof import('../agent/streaming')['streamAssistant'];
type CreateAssistantContext = typeof import('../agent/context')['createAssistantContext'];

async function judgeAnswer(
  q: GoldenQuestion,
  answer: string,
  routerClient: RouterClient,
  judgeModel: string,
): Promise<JudgeVerdict> {
  const { system, user } = buildJudgePrompt({
    question: q.question,
    rubric: q.rubric,
    answer,
    language: q.language,
  });
  const completion = await routerClient.chat.completions.create({
    model: judgeModel,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return parseJudgeVerdict(completion.choices[0]?.message?.content ?? '');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function filterCases(options: RunOptions): GoldenQuestion[] {
  return GOLDEN_QUESTIONS.filter((q) => {
    if (options.id && q.id !== options.id) return false;
    if (options.category && q.category !== options.category) return false;
    return true;
  });
}

function errorResult(q: GoldenQuestion): QuestionResult {
  return {
    id: q.id,
    category: q.category,
    judgeScore: 0,
    judgePass: false,
    cited: false,
    expectedDocCited: false,
    keywordHits: 0,
    keywordTotal: q.expectKeywords.length,
    keywordPass: false,
    toolPass: false,
    streamPass: false,
    pass: false,
  };
}

function contextTrace(context: ReturnType<CreateAssistantContext>) {
  return {
    toolCalls: context.toolCalls,
    readDocIds: [...new Set(context.reads.map((read) => read.docId))],
    loadedSkills: context.loadedSkills,
    citationCount: context.reads.length,
  };
}

async function runOne(
  q: GoldenQuestion,
  runIndex: number,
  assistant: AssistantRuntime,
  routerClient: RouterClient,
  judgeModel: string,
  timeoutMs: number,
  transport: 'message' | 'stream',
  streamAssistant: StreamAssistant,
  createAssistantContext: CreateAssistantContext,
): Promise<EvalAttemptReportInput> {
  const startedAt = Date.now();
  try {
    const run = transport === 'stream'
      ? await withTimeout(
          (async () => {
            const context = createAssistantContext({ userLanguage: q.language, mode: q.mode });
            const events: StreamEvent[] = [];
            let answer = '';
            for await (const event of streamAssistant(q.question, { userLanguage: q.language, context })) {
              events.push(event);
              if (event.type === 'message.delta') answer += event.delta;
            }
            const validation = validateStreamEvents(events, { requireCitation: !q.expectUncertain && !q.expectNoCitation });
            const citations = events.flatMap((event) => (event.type === 'citation' ? [event.citation] : []));
            return { answer, citations, context, streamOk: validation.ok, streamReason: validation.reasons.join('; ') };
          })(),
          timeoutMs,
        )
      : await withTimeout(
          assistant.runMessage(q.question, { userLanguage: q.language, mode: q.mode }),
          timeoutMs,
        );
    const verdict = await withTimeout(judgeAnswer(q, run.answer, routerClient, judgeModel), timeoutMs);
    const streamOk = 'streamOk' in run ? run.streamOk : true;
    const result = scoreQuestion(
      q,
      {
        answer: run.answer,
        citations: run.citations,
        trace: contextTrace(run.context),
        streamOk,
      },
      verdict,
    );
    return {
      result,
      runIndex,
      transport,
      durationMs: Date.now() - startedAt,
      answer: run.answer,
      citations: run.citations,
      judgeReason: streamOk ? verdict.reason : ('streamReason' in run ? run.streamReason : verdict.reason),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      result: errorResult(q),
      runIndex,
      transport,
      durationMs: Date.now() - startedAt,
      answer: '',
      citations: [],
      judgeReason: message,
      error: message,
    };
  }
}

async function main(): Promise<void> {
  let options: RunOptions;
  try {
    options = parseRunOptions(process.argv.slice(2));
  } catch (err) {
    if (err instanceof Error && err.message === 'help') {
      printUsage();
      process.exit(0);
    }
    console.error(err instanceof Error ? err.message : err);
    printUsage();
    process.exit(1);
  }

  if (options.model) process.env.OPENAI_CHAT_MODEL = options.model;
  if (options.judgeModel) process.env.EVAL_JUDGE_MODEL = options.judgeModel;

  const [{ assistant }, { routerClient }, { env }, { streamAssistant }, { createAssistantContext }] = await Promise.all([
    import('../agent/runtime'),
    import('../agent/llm'),
    import('../config/env'),
    import('../agent/streaming'),
    import('../agent/context'),
  ]);

  const judgeModel = env.EVAL_JUDGE_MODEL ?? env.OPENAI_CHAT_MODEL;
  const cases = filterCases(options);
  if (cases.length === 0) {
    const message = 'No eval cases match the selected filters.';
    if (options.json) {
      console.log(JSON.stringify({ summary: { total: 0, passed: 0, failed: 0, errors: 1 }, results: [], error: message }, null, 2));
    } else {
      console.error(message);
    }
    process.exit(1);
  }

  if (!options.json) {
    console.log(`Running ${cases.length} golden question(s) x ${options.runs} run(s)`);
    console.log(`assistant model: ${env.OPENAI_CHAT_MODEL}`);
    console.log(`judge model: ${judgeModel}\n`);
  }

  const attempts: EvalAttemptReportInput[] = [];
  const startedAt = Date.now();

  for (let runIndex = 1; runIndex <= options.runs; runIndex++) {
    for (const q of cases) {
      const transport = options.transport ?? q.transport ?? 'message';
      const attempt = await runOne(
        q,
        runIndex,
        assistant,
        routerClient,
        judgeModel,
        options.timeout,
        transport,
        streamAssistant,
        createAssistantContext,
      );
      attempts.push(attempt);
      if (!options.json) {
        console.log(formatResultLine(attempt));
        if (!attempt.result.pass) console.log(`    ↳ ${(attempt.error ?? attempt.judgeReason) || '(no reason)'}`);
      }
    }
  }

  const results = attempts.map((attempt) => attempt.result);
  const agg = aggregate(results);
  const verdict = meetsBaseline(agg);
  const durationMs = Date.now() - startedAt;

  if (options.json) {
    console.log(JSON.stringify(buildJsonReport({ results: attempts, durationMs, baselineVerdict: verdict }), null, 2));
  } else {
    console.log(
      `\nSummary: ${agg.passed}/${agg.total} passed (${(agg.passRate * 100).toFixed(0)}%), ` +
        `avg judge score ${agg.avgScore.toFixed(2)}/5`,
    );
    console.log(`Baseline: pass≥${(BASELINE.minPassRate * 100).toFixed(0)}%, avg≥${BASELINE.minAvgScore}`);

    if (verdict.ok) {
      console.log('GATE: baseline met ✅');
    } else {
      console.log(`GATE: baseline NOT met ❌ — ${verdict.reasons.join('; ')}`);
    }
  }

  if (!verdict.ok || attempts.some((attempt) => attempt.error)) process.exit(1);
}

main().catch((err) => {
  console.error('eval run FAILED:', err?.message ?? err);
  process.exit(1);
});
