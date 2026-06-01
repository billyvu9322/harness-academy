import type { Citation } from '@assistant/shared/citations';
import { checkOutput } from './guardrails';

export interface RunOnceResult {
  answer: string;
  citations: Citation[];
}

export interface RegenerateResult extends RunOnceResult {
  regenerated: boolean;
}

/**
 * In-turn self-correction loop (the tight feedback loop). Runs once; if the output guardrail
 * trips (e.g. a factual answer with no citation), re-runs ONCE with corrective=true. Returns
 * the second result regardless (bounded retry — B6).
 */
export async function runWithRegenerate(
  runOnce: (corrective: boolean) => Promise<RunOnceResult>,
): Promise<RegenerateResult> {
  const first = await runOnce(false);
  const verdict = checkOutput({ answer: first.answer, citationCount: first.citations.length });
  if (!verdict.tripwire) return { ...first, regenerated: false };

  const second = await runOnce(true);
  return { ...second, regenerated: true };
}
