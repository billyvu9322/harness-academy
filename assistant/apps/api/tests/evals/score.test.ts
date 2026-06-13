import { describe, expect, it } from 'vitest';
import type { Citation } from '@assistant/shared/citations';
import type { GoldenQuestion } from '../../evals/evals/goldenQuestions';
import type { JudgeVerdict } from '../../evals/evals/judge';
import { aggregate, BASELINE, meetsBaseline, scoreQuestion } from '../../evals/evals/score';

const cite = (over: Partial<Citation> = {}): Citation => ({
  title: 'Feature list la primitive',
  sourcePath: 'academy/content/lectures/08-feature-list-la-primitive.md',
  route: '/lectures/08-feature-list-la-primitive',
  ...over,
});

const grounded: GoldenQuestion = {
  id: 'q1',
  category: 'grounded-answer',
  question: 'Feature list la gi?',
  language: 'Vietnamese',
  rubric: 'explain feature list',
  expectKeywords: ['feature list', 'primitive'],
  expectDocMatch: 'feature-list-la-primitive',
};

const goodVerdict: JudgeVerdict = { score: 5, pass: true, reason: 'ok', parsed: true };

describe('scoreQuestion', () => {
  it('passes when judge passes, answer is cited and expected doc + keywords match', () => {
    const r = scoreQuestion(
      grounded,
      { answer: 'Feature list la mot primitive nen tang.', citations: [cite()] },
      goodVerdict,
    );
    expect(r.pass).toBe(true);
    expect(r.cited).toBe(true);
    expect(r.expectedDocCited).toBe(true);
    expect(r.keywordHits).toBe(2);
    expect(r.keywordTotal).toBe(2);
  });

  it('fails when the judge fails', () => {
    const r = scoreQuestion(
      grounded,
      { answer: 'Feature list la mot primitive.', citations: [cite()] },
      { score: 2, pass: false, reason: 'weak', parsed: true },
    );
    expect(r.pass).toBe(false);
  });

  it('fails a grounded question with no citations', () => {
    const r = scoreQuestion(
      grounded,
      { answer: 'Feature list la mot primitive.', citations: [] },
      goodVerdict,
    );
    expect(r.cited).toBe(false);
    expect(r.pass).toBe(false);
  });

  it('fails when the expected doc was not cited', () => {
    const r = scoreQuestion(
      grounded,
      {
        answer: 'Feature list la mot primitive.',
        citations: [cite({ sourcePath: 'academy/content/lectures/99-other.md', route: '/lectures/99-other', title: 'Other' })],
      },
      goodVerdict,
    );
    expect(r.expectedDocCited).toBe(false);
    expect(r.pass).toBe(false);
  });

  it('fails when required keyword coverage is missing', () => {
    const r = scoreQuestion(
      { ...grounded, minKeywordHits: 2 },
      { answer: 'Feature list la nen tang.', citations: [cite()] },
      goodVerdict,
    );
    expect(r.keywordHits).toBe(1);
    expect(r.pass).toBe(false);
  });

  it('matches the expected doc against any citation field (route)', () => {
    const r = scoreQuestion(
      grounded,
      { answer: 'feature list primitive', citations: [cite({ sourcePath: 'x', title: 'x' })] },
      goodVerdict,
    );
    expect(r.expectedDocCited).toBe(true);
  });

  it('for an uncertain question, grounding is not required', () => {
    const uncertain: GoldenQuestion = {
      id: 'q2',
      category: 'out-of-corpus',
      question: 'Ty gia USD/VND?',
      language: 'Vietnamese',
      rubric: 'admit not covered',
      expectKeywords: ['khong'],
      expectUncertain: true,
    };
    const r = scoreQuestion(
      uncertain,
      { answer: 'Tai lieu khong de cap ty gia nay.', citations: [] },
      goodVerdict,
    );
    expect(r.cited).toBe(false);
    expect(r.pass).toBe(true);
  });

  it('fails an uncertain question when it fabricates citations', () => {
    const uncertain: GoldenQuestion = {
      id: 'q2',
      category: 'out-of-corpus',
      question: 'Ty gia USD/VND?',
      language: 'Vietnamese',
      rubric: 'admit not covered',
      expectKeywords: ['khong'],
      expectUncertain: true,
      expectNoCitation: true,
    };
    const r = scoreQuestion(
      uncertain,
      { answer: 'Tai lieu khong de cap ty gia nay.', citations: [cite()] },
      goodVerdict,
    );
    expect(r.cited).toBe(true);
    expect(r.pass).toBe(false);
  });

  it('fails when expected tool calls are missing', () => {
    const r = scoreQuestion(
      { ...grounded, expectedToolNames: ['read_doc_section'] },
      { answer: 'Feature list primitive', citations: [cite()], trace: { toolCalls: ['grep_docs'] } },
      goodVerdict,
    );
    expect(r.toolPass).toBe(false);
    expect(r.pass).toBe(false);
  });

  it('fails when forbidden tool calls are present', () => {
    const r = scoreQuestion(
      { ...grounded, forbiddenToolNames: ['harness_blueprint'] },
      { answer: 'Feature list primitive', citations: [cite()], trace: { toolCalls: ['read_doc_section', 'harness_blueprint'] } },
      goodVerdict,
    );
    expect(r.toolPass).toBe(false);
    expect(r.pass).toBe(false);
  });
});

describe('aggregate', () => {
  it('computes pass rate and average score', () => {
    const agg = aggregate([
      { id: 'a', category: 'grounded-answer', judgeScore: 5, judgePass: true, cited: true, expectedDocCited: true, keywordHits: 1, keywordTotal: 1, keywordPass: true, toolPass: true, streamPass: true, pass: true },
      { id: 'b', category: 'grounded-answer', judgeScore: 3, judgePass: false, cited: true, expectedDocCited: true, keywordHits: 0, keywordTotal: 1, keywordPass: false, toolPass: true, streamPass: true, pass: false },
    ]);
    expect(agg.total).toBe(2);
    expect(agg.passed).toBe(1);
    expect(agg.passRate).toBe(0.5);
    expect(agg.avgScore).toBe(4);
    expect(agg.byCategory['grounded-answer']).toEqual({ total: 2, passed: 1, passRate: 0.5 });
  });

  it('is safe on an empty set', () => {
    const agg = aggregate([]);
    expect(agg).toEqual({ total: 0, passed: 0, passRate: 0, avgScore: 0, byCategory: {} });
  });
});

describe('meetsBaseline', () => {
  it('passes when both thresholds are met', () => {
    const v = meetsBaseline({ total: 6, passed: 5, passRate: 0.83, avgScore: 4.2, byCategory: {} });
    expect(v.ok).toBe(true);
    expect(v.reasons).toEqual([]);
  });

  it('fails and reports each unmet threshold', () => {
    const v = meetsBaseline({ total: 6, passed: 2, passRate: 0.33, avgScore: 2.1, byCategory: {} });
    expect(v.ok).toBe(false);
    expect(v.reasons.length).toBe(2);
  });

  it('fails when a category threshold is unmet', () => {
    const v = meetsBaseline(
      {
        total: 2,
        passed: 1,
        passRate: 0.5,
        avgScore: 4,
        byCategory: {
          'out-of-corpus': { total: 1, passed: 0, passRate: 0 },
          'grounded-answer': { total: 1, passed: 1, passRate: 1 },
        },
      },
      { minPassRate: 0.4, minAvgScore: 3.5, categoryMinPassRate: { 'out-of-corpus': 1 } },
    );
    expect(v.ok).toBe(false);
    expect(v.reasons.some((reason) => reason.includes('out-of-corpus'))).toBe(true);
  });

  it('exposes a default baseline', () => {
    expect(BASELINE.minPassRate).toBeGreaterThan(0);
    expect(BASELINE.minAvgScore).toBeGreaterThan(0);
  });
});
