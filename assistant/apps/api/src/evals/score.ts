import type { Citation } from '@assistant/shared/citations';
import type { GoldenQuestion } from './goldenQuestions';
import type { JudgeVerdict } from './judge';

/** The assistant output an eval grades. */
export interface RunOutput {
  answer: string;
  citations: Citation[];
}

export interface QuestionResult {
  id: string;
  judgeScore: number;
  judgePass: boolean;
  /** Answer carried ≥1 provenance citation. */
  cited: boolean;
  /** Expected source doc was among the citations (true when none is required). */
  expectedDocCited: boolean;
  keywordHits: number;
  keywordTotal: number;
  /** Combined verdict: judge + deterministic grounding checks. */
  pass: boolean;
}

function citationMatches(c: Citation, needle: string): boolean {
  const hay = `${c.sourcePath} ${c.route ?? ''} ${c.title}`.toLowerCase();
  return hay.includes(needle.toLowerCase());
}

function countKeywordHits(answer: string, keywords: string[]): number {
  const lower = answer.toLowerCase();
  return keywords.reduce((n, kw) => (lower.includes(kw.toLowerCase()) ? n + 1 : n), 0);
}

/** Combine the LLM-judge verdict with deterministic grounding checks for one question. */
export function scoreQuestion(q: GoldenQuestion, run: RunOutput, verdict: JudgeVerdict): QuestionResult {
  const cited = run.citations.length > 0;
  const expectedDocCited = q.expectDocMatch
    ? run.citations.some((c) => citationMatches(c, q.expectDocMatch!))
    : true;
  const keywordHits = countKeywordHits(run.answer, q.expectKeywords);

  // Out-of-corpus questions must NOT fabricate citations, so grounding is not required;
  // correctness of the refusal is left to the judge. Grounded questions must cite their source.
  const groundingOk = q.expectUncertain ? true : cited && expectedDocCited;

  return {
    id: q.id,
    judgeScore: verdict.score,
    judgePass: verdict.pass,
    cited,
    expectedDocCited,
    keywordHits,
    keywordTotal: q.expectKeywords.length,
    pass: verdict.pass && groundingOk,
  };
}

export interface Aggregate {
  total: number;
  passed: number;
  passRate: number;
  avgScore: number;
}

export function aggregate(results: QuestionResult[]): Aggregate {
  const total = results.length;
  if (total === 0) return { total: 0, passed: 0, passRate: 0, avgScore: 0 };
  const passed = results.filter((r) => r.pass).length;
  const avgScore = results.reduce((s, r) => s + r.judgeScore, 0) / total;
  return { total, passed, passRate: passed / total, avgScore };
}

export interface Baseline {
  minPassRate: number;
  minAvgScore: number;
}

/** Baseline the golden set must clear for `pnpm eval` to succeed. */
export const BASELINE: Baseline = { minPassRate: 0.7, minAvgScore: 3.5 };

export interface BaselineVerdict {
  ok: boolean;
  reasons: string[];
}

export function meetsBaseline(agg: Aggregate, baseline: Baseline = BASELINE): BaselineVerdict {
  const reasons: string[] = [];
  if (agg.passRate < baseline.minPassRate) {
    reasons.push(`pass rate ${(agg.passRate * 100).toFixed(0)}% < ${(baseline.minPassRate * 100).toFixed(0)}%`);
  }
  if (agg.avgScore < baseline.minAvgScore) {
    reasons.push(`avg score ${agg.avgScore.toFixed(2)} < ${baseline.minAvgScore.toFixed(2)}`);
  }
  return { ok: reasons.length === 0, reasons };
}
