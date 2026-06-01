import { describe, expect, test } from 'vitest';
import { splitSseBuffer } from './sse';

const ev = (o: unknown) => `event: x\ndata: ${JSON.stringify(o)}\n\n`;

describe('splitSseBuffer', () => {
  test('parses complete events and returns no remainder', () => {
    const buf = ev({ type: 'message.delta', delta: 'Hi' }) + ev({ type: 'done' });
    const { events, rest } = splitSseBuffer(buf);
    expect(events).toEqual([{ type: 'message.delta', delta: 'Hi' }, { type: 'done' }]);
    expect(rest).toBe('');
  });

  test('keeps a trailing partial event as remainder', () => {
    const buf = ev({ type: 'message.delta', delta: 'A' }) + 'event: x\ndata: {"type":"mess';
    const { events, rest } = splitSseBuffer(buf);
    expect(events).toEqual([{ type: 'message.delta', delta: 'A' }]);
    expect(rest).toContain('{"type":"mess');
  });

  test('ignores blocks without a data line', () => {
    const { events } = splitSseBuffer(': comment\n\n' + ev({ type: 'done' }));
    expect(events).toEqual([{ type: 'done' }]);
  });

  test('returns empty when buffer has no complete event', () => {
    const { events, rest } = splitSseBuffer('data: {"type":"do');
    expect(events).toEqual([]);
    expect(rest).toBe('data: {"type":"do');
  });
});
