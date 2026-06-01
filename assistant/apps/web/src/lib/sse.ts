import { streamEventSchema, type StreamEvent } from '@assistant/shared/events';

export function parseSseData(data: string): StreamEvent {
  return streamEventSchema.parse(JSON.parse(data));
}

/**
 * Split a raw SSE buffer into complete events, keeping any trailing partial block as `rest`.
 * Blocks without a `data:` line (e.g. comments) are skipped; malformed JSON is ignored.
 */
export function splitSseBuffer(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
    if (!dataLine) continue;
    try {
      events.push(parseSseData(dataLine.slice(5).trim()));
    } catch {
      // skip malformed / unknown event
    }
  }
  return { events, rest };
}

/** Read a fetch Response body as a stream of typed app events. */
export async function* readSseStream(response: Response): AsyncGenerator<StreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = splitSseBuffer(buffer);
    buffer = rest;
    for (const ev of events) yield ev;
  }
}
