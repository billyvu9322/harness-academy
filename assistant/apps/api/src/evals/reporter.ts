import type { Citation } from '@assistant/shared/citations';
import type { EvalTransport } from './goldenQuestions';
import { BASELINE, aggregate, type Baseline, type BaselineVerdict, type QuestionResult } from './score';

export interface EvalAttemptReportInput {
  result: QuestionResult;
  runIndex: number;
  transport?: EvalTransport;
  durationMs: number;
  answer: string;
  citations: Citation[];
  judgeReason: string;
  error?: string;
}

export interface JsonReportInput {
  results: EvalAttemptReportInput[];
  durationMs: number;
  baselineVerdict: BaselineVerdict;
  baseline?: Baseline;
}

function excerpt(answer: string): string {
  const compact = answer.replace(/\s+/g, ' ').trim();
  return compact.length > 160 ? `${compact.slice(0, 160)}...` : compact;
}

export function buildJsonReport(input: JsonReportInput) {
  const summary = aggregate(input.results.map((item) => item.result));
  return {
    summary: {
      ...summary,
      failed: summary.total - summary.passed,
      errors: input.results.filter((item) => item.error).length,
      durationMs: input.durationMs,
      baseline: input.baseline ?? BASELINE,
      baselineOk: input.baselineVerdict.ok,
      baselineReasons: input.baselineVerdict.reasons,
    },
    results: input.results.map((item) => ({
      id: item.result.id,
      category: item.result.category,
      runIndex: item.runIndex,
      transport: item.transport ?? 'message',
      pass: item.result.pass,
      judgeScore: item.result.judgeScore,
      judgePass: item.result.judgePass,
      judgeReason: item.judgeReason,
      cited: item.result.cited,
      expectedDocCited: item.result.expectedDocCited,
      keywordHits: item.result.keywordHits,
      keywordTotal: item.result.keywordTotal,
      keywordPass: item.result.keywordPass,
      toolPass: item.result.toolPass,
      streamPass: item.result.streamPass,
      durationMs: item.durationMs,
      error: item.error,
      answerExcerpt: excerpt(item.answer),
      citations: item.citations.map((citation) => ({
        title: citation.title,
        sourcePath: citation.sourcePath,
        route: citation.route,
      })),
    })),
  };
}

export function formatResultLine(item: EvalAttemptReportInput): string {
  const mark = item.result.pass ? '✅' : '❌';
  const grounding = item.result.cited
    ? `cited${item.result.expectedDocCited ? '' : ' (wrong doc)'}`
    : 'no-cite';
  const keywords = `kw ${item.result.keywordHits}/${item.result.keywordTotal}${item.result.keywordPass ? '' : ' fail'}`;
  return `${mark} ${item.result.id.padEnd(26)} run=${item.runIndex} judge=${item.result.judgeScore}/5 ${item.result.judgePass ? 'pass' : 'fail'} | ${grounding} | ${keywords}`;
}
