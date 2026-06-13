import { describe, expect, it } from 'vitest';
import { GOLDEN_QUESTIONS } from '../../src/evals/goldenQuestions';
import { toPromptfooTestCases } from '../../src/evals/promptfooConfig';

describe('toPromptfooTestCases', () => {
  it('maps golden questions into Promptfoo test vars without duplicating question data', () => {
    const tests = toPromptfooTestCases(GOLDEN_QUESTIONS);

    expect(tests).toHaveLength(GOLDEN_QUESTIONS.length);
    expect(tests[0]).toEqual({
      description: GOLDEN_QUESTIONS[0]?.id,
      metadata: {
        category: GOLDEN_QUESTIONS[0]?.category,
      },
      vars: expect.objectContaining({
        id: GOLDEN_QUESTIONS[0]?.id,
        question: GOLDEN_QUESTIONS[0]?.question,
        language: GOLDEN_QUESTIONS[0]?.language,
        expectKeywords: GOLDEN_QUESTIONS[0]?.expectKeywords,
        expectDocMatch: GOLDEN_QUESTIONS[0]?.expectDocMatch,
      }),
    });
  });

  it('preserves out-of-corpus expectations for grounding assertions', () => {
    const tests = toPromptfooTestCases(GOLDEN_QUESTIONS);
    const fxRate = tests.find((test) => test.vars.id === 'out-of-corpus-fx-rate');

    expect(fxRate?.vars.expectUncertain).toBe(true);
    expect(fxRate?.vars.expectNoCitation).toBe(true);
  });
});
