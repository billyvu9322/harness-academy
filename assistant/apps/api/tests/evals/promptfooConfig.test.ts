import { describe, expect, it } from 'vitest';
import { GOLDEN_QUESTIONS } from '../../evals/evals/goldenQuestions';
import { toPromptfooTestCases } from '../../evals/evals/promptfooConfig';

describe('toPromptfooTestCases', () => {
  it('maps golden questions into Promptfoo test vars without duplicating question data', () => {
    const tests = toPromptfooTestCases(GOLDEN_QUESTIONS);

    expect(tests).toHaveLength(GOLDEN_QUESTIONS.length);
    expect(tests[0]).toEqual({
      description: GOLDEN_QUESTIONS[0]?.id,
      metadata: {
        category: GOLDEN_QUESTIONS[0]?.category,
        expectedBehavior: GOLDEN_QUESTIONS[0]?.expectedBehavior,
        id: GOLDEN_QUESTIONS[0]?.id,
        language: GOLDEN_QUESTIONS[0]?.language,
        mode: GOLDEN_QUESTIONS[0]?.mode,
        expectKeywords: GOLDEN_QUESTIONS[0]?.expectKeywords,
        minKeywordHits: GOLDEN_QUESTIONS[0]?.minKeywordHits,
        expectDocMatch: GOLDEN_QUESTIONS[0]?.expectDocMatch,
        expectCitation: GOLDEN_QUESTIONS[0]?.expectCitation,
        expectNoCitation: GOLDEN_QUESTIONS[0]?.expectNoCitation,
        expectUncertain: GOLDEN_QUESTIONS[0]?.expectUncertain,
        expectedToolNames: GOLDEN_QUESTIONS[0]?.expectedToolNames,
        forbiddenToolNames: GOLDEN_QUESTIONS[0]?.forbiddenToolNames,
      },
      vars: expect.objectContaining({
        question: GOLDEN_QUESTIONS[0]?.question,
      }),
    });
  });

  it('preserves out-of-corpus expectations for grounding assertions', () => {
    const tests = toPromptfooTestCases(GOLDEN_QUESTIONS);
    const fxRate = tests.find((test) => test.metadata.id === 'out-of-corpus-fx-rate');

    expect(fxRate?.metadata.expectedBehavior).toBe('refusal');
    expect(fxRate?.metadata.expectUncertain).toBe(true);
    expect(fxRate?.metadata.expectNoCitation).toBe(true);
    expect(fxRate?.metadata.forbiddenToolNames).toEqual(['grep_docs', 'read_doc_section']);
  });
});
