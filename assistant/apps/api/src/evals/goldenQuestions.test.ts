import { describe, expect, it } from 'vitest';
import { GOLDEN_QUESTIONS, findGolden } from './goldenQuestions';

describe('GOLDEN_QUESTIONS', () => {
  it('has a meaningful baseline set', () => {
    expect(GOLDEN_QUESTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('has unique ids', () => {
    const ids = GOLDEN_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question has a non-empty question, rubric and valid language', () => {
    for (const q of GOLDEN_QUESTIONS) {
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.rubric.trim().length).toBeGreaterThan(0);
      expect(['Vietnamese', 'English']).toContain(q.language);
    }
  });

  it('grounded (non-uncertain) questions declare expected keywords', () => {
    for (const q of GOLDEN_QUESTIONS) {
      if (!q.expectUncertain) expect(q.expectKeywords.length).toBeGreaterThan(0);
    }
  });

  it('includes at least one out-of-corpus (uncertain) question', () => {
    expect(GOLDEN_QUESTIONS.some((q) => q.expectUncertain)).toBe(true);
  });

  it('findGolden resolves by id and returns undefined otherwise', () => {
    expect(findGolden(GOLDEN_QUESTIONS[0].id)?.id).toBe(GOLDEN_QUESTIONS[0].id);
    expect(findGolden('does-not-exist')).toBeUndefined();
  });
});
