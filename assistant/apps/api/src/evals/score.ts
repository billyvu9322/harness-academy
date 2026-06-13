import type { Citation } from '@assistant/shared/citations';
import type { EvalCategory, GoldenQuestion } from './goldenQuestions';
import type { JudgeVerdict } from './judge';

/** The assistant output an eval grades. */
export interface RunOutput {
  answer: string;
  citations: Citation[];
  trace?: EvalTrace;
  streamOk?: boolean;
}

export interface EvalTrace {
  toolCalls: string[];
  readDocIds?: string[];
  loadedSkills?: string[];
  citationCount?: number;
}

export interface QuestionResult {
  id: string;
  category: EvalCategory;
  judgeScore: number;
  judgePass: boolean;
  /** Answer carried ≥1 provenance citation. */
  cited: boolean;
  /** Expected source doc was among the citations (true when none is required). */
  expectedDocCited: boolean;
  keywordHits: number;
  keywordTotal: number;
  keywordPass: boolean;
  toolPass: boolean;
  streamPass: boolean;
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
  const minKeywordHits = q.minKeywordHits ?? Math.min(1, q.expectKeywords.length);
  const keywordPass = q.expectKeywords.length === 0 || keywordHits >= minKeywordHits;
  const toolCalls = run.trace?.toolCalls ?? [];
  const expectedTools = q.expectedToolNames ?? [];
  const forbiddenTools = q.forbiddenToolNames ?? [];
  const expectedToolsOk = expectedTools.every((name) => toolCalls.includes(name));
  const forbiddenToolsOk = forbiddenTools.every((name) => !toolCalls.includes(name));
  const toolPass = expectedToolsOk && forbiddenToolsOk;
  const streamPass = run.streamOk ?? true;

  // Out-of-corpus questions must NOT fabricate citations, so grounding is not required;
  // correctness of the refusal is left to the judge. Grounded questions must cite their source.
  const noCitationExpected = q.expectUncertain || q.expectNoCitation;
  const citationRequired = q.expectCitation ?? !noCitationExpected;
  const groundingOk = noCitationExpected ? !cited : (!citationRequired || cited) && expectedDocCited;

  return {
    id: q.id,
    category: q.category,
    judgeScore: verdict.score,
    judgePass: verdict.pass,
    cited,
    expectedDocCited,
    keywordHits,
    keywordTotal: q.expectKeywords.length,
    keywordPass,
    toolPass,
    streamPass,
    pass: verdict.pass && groundingOk && keywordPass && toolPass && streamPass,
  };
}

export interface Aggregate {
  total: number;
  passed: number;
  passRate: number;
  avgScore: number;
  byCategory: Partial<Record<EvalCategory, { total: number; passed: number; passRate: number }>>;
}

export function aggregate(results: QuestionResult[]): Aggregate {
  const total = results.length;
  if (total === 0) return { total: 0, passed: 0, passRate: 0, avgScore: 0, byCategory: {} };
  const passed = results.filter((r) => r.pass).length;
  const avgScore = results.reduce((s, r) => s + r.judgeScore, 0) / total;
  const byCategory: Aggregate['byCategory'] = {};
  for (const result of results) {
    const current = byCategory[result.category] ?? { total: 0, passed: 0, passRate: 0 };
    const nextTotal = current.total + 1;
    const nextPassed = current.passed + (result.pass ? 1 : 0);
    byCategory[result.category] = {
      total: nextTotal,
      passed: nextPassed,
      passRate: nextPassed / nextTotal,
    };
  }
  return { total, passed, passRate: passed / total, avgScore, byCategory };
}

export interface Baseline {
  minPassRate: number;
  minAvgScore: number;
  categoryMinPassRate?: Partial<Record<EvalCategory, number>>;
}

/** Baseline the golden set must clear for `pnpm eval` to succeed. */
export const BASELINE: Baseline = {
  minPassRate: 0.7,
  minAvgScore: 3.5,
  categoryMinPassRate: {
    'out-of-corpus': 1,
  },
};

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
  const byCategory = agg.byCategory ?? {};
  for (const [category, minPassRate] of Object.entries(baseline.categoryMinPassRate ?? {})) {
    const stats = byCategory[category as EvalCategory];
    if (!stats || stats.total === 0) continue;
    if (stats.passRate < minPassRate) {
      reasons.push(`${category} pass rate ${(stats.passRate * 100).toFixed(0)}% < ${(minPassRate * 100).toFixed(0)}%`);
    }
  }
  return { ok: reasons.length === 0, reasons };
}
