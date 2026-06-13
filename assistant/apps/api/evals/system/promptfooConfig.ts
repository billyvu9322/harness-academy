import type { GoldenQuestion } from './goldenQuestions';

export interface PromptfooTestCase {
  description: string;
  metadata: {
    category: GoldenQuestion['category'];
    expectedBehavior?: GoldenQuestion['expectedBehavior'];
    id: GoldenQuestion['id'];
    language: GoldenQuestion['language'];
    mode?: GoldenQuestion['mode'];
    expectKeywords?: GoldenQuestion['expectKeywords'];
    minKeywordHits?: GoldenQuestion['minKeywordHits'];
    expectDocMatch?: GoldenQuestion['expectDocMatch'];
    expectCitation?: GoldenQuestion['expectCitation'];
    expectNoCitation?: GoldenQuestion['expectNoCitation'];
    expectUncertain?: GoldenQuestion['expectUncertain'];
    expectedToolNames?: GoldenQuestion['expectedToolNames'];
    forbiddenToolNames?: GoldenQuestion['forbiddenToolNames'];
  };
  vars: Record<string, unknown>;
}

export function toPromptfooTestCases(questions: GoldenQuestion[]): PromptfooTestCase[] {
  return questions.map((question) => ({
    description: question.id,
    metadata: {
      category: question.category,
      expectedBehavior: question.expectedBehavior,
      id: question.id,
      language: question.language,
      mode: question.mode,
      expectKeywords: question.expectKeywords,
      minKeywordHits: question.minKeywordHits,
      expectDocMatch: question.expectDocMatch,
      expectCitation: question.expectCitation,
      expectNoCitation: question.expectNoCitation,
      expectUncertain: question.expectUncertain,
      expectedToolNames: question.expectedToolNames,
      forbiddenToolNames: question.forbiddenToolNames,
    },
    vars: {
      question: question.question,
    },
  }));
}
