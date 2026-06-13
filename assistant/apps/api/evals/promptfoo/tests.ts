import { GOLDEN_QUESTIONS } from '../../src/evals/goldenQuestions';
import { toPromptfooTestCases } from '../../src/evals/promptfooConfig';

export default async function generatePromptfooTests() {
  return toPromptfooTestCases(GOLDEN_QUESTIONS);
}
