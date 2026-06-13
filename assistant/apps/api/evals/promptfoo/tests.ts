import { GOLDEN_QUESTIONS } from '../evals/goldenQuestions';
import { toPromptfooTestCases } from '../evals/promptfooConfig';

export default async function generatePromptfooTests() {
  return toPromptfooTestCases(GOLDEN_QUESTIONS);
}
