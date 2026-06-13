import type { GoldenQuestion } from './goldenQuestions';

export interface PromptfooTestCase {
  description: string;
  metadata: {
    category: GoldenQuestion['category'];
  };
  vars: Record<string, unknown>;
}

export function toPromptfooTestCases(questions: GoldenQuestion[]): PromptfooTestCase[] {
  return questions.map((question) => ({
    description: question.id,
    metadata: {
      category: question.category,
    },
    vars: {
      id: question.id,
      category: question.category,
      question: question.question,
      language: question.language,
      mode: question.mode,
      transport: question.transport,
      expectKeywords: question.expectKeywords,
      minKeywordHits: question.minKeywordHits,
      expectDocMatch: question.expectDocMatch,
      expectCitation: question.expectCitation,
      expectNoCitation: question.expectNoCitation,
      expectUncertain: question.expectUncertain,
      expectedToolNames: question.expectedToolNames,
      forbiddenToolNames: question.forbiddenToolNames,
    },
  }));
}
