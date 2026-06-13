import type { StreamEvent } from '@assistant/shared/events';

export interface StreamValidationOptions {
  requireCitation?: boolean;
}

export interface StreamValidation {
  ok: boolean;
  reasons: string[];
  citationCount: number;
  doneCount: number;
}

export function validateStreamEvents(
  events: StreamEvent[],
  options: StreamValidationOptions = {},
): StreamValidation {
  const reasons: string[] = [];
  const doneCount = events.filter((event) => event.type === 'done').length;
  const citationCount = events.filter((event) => event.type === 'citation').length;
  const firstSuggestion = events.findIndex((event) => event.type === 'suggestion');
  let lastCitation = -1;
  events.forEach((event, index) => {
    if (event.type === 'citation') lastCitation = index;
  });
  const firstDone = events.findIndex((event) => event.type === 'done');
  const firstError = events.findIndex((event) => event.type === 'error');

  if (doneCount !== 1) reasons.push(`done count ${doneCount} != 1`);
  if (options.requireCitation && citationCount === 0) reasons.push('required citation missing');
  if (firstSuggestion !== -1 && lastCitation > firstSuggestion) reasons.push('citation emitted after suggestion');
  if (firstDone !== -1 && events.findIndex((event, index) => index > firstDone && event.type !== 'done') !== -1) {
    reasons.push('event emitted after done');
  }
  if (firstError !== -1 && firstDone !== -1 && firstError > firstDone) reasons.push('error emitted after done');

  return { ok: reasons.length === 0, reasons, citationCount, doneCount };
}
