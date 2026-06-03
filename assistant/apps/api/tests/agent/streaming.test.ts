import { describe, expect, test } from 'vitest';
import { streamEventSchema } from '@assistant/shared/events';
import type { Citation } from '@assistant/shared/citations';
import { mapStreamEvent, buildSuggestions } from '../../src/agent/streaming';

describe('mapStreamEvent', () => {
  test('maps a raw output_text_delta to message.delta', () => {
    const out = mapStreamEvent({ type: 'raw_model_stream_event', data: { type: 'output_text_delta', delta: 'Hello' } });
    expect(out).toEqual({ type: 'message.delta', delta: 'Hello' });
  });

  test('maps response_started to message.started', () => {
    const out = mapStreamEvent({ type: 'raw_model_stream_event', data: { type: 'response_started' } });
    expect(out).toEqual({ type: 'message.started' });
  });

  test('maps a tool_called item to tool.started with callId + detail from args', () => {
    const out = mapStreamEvent({
      type: 'run_item_stream_event',
      name: 'tool_called',
      item: { rawItem: { name: 'grep_docs', callId: 'call_1', arguments: '{"pattern":"verification gate"}' } },
    });
    expect(out).toEqual({ type: 'tool.started', tool: 'grep_docs', callId: 'call_1', detail: 'verification gate' });
  });

  test('builds read_doc_section detail from docId + heading', () => {
    const out = mapStreamEvent({
      type: 'run_item_stream_event',
      name: 'tool_called',
      item: { rawItem: { name: 'read_doc_section', callId: 'c2', arguments: '{"docId":"a/b.md","heading":"Intro"}' } },
    });
    expect(out).toMatchObject({ type: 'tool.started', tool: 'read_doc_section', callId: 'c2', detail: 'a/b.md · Intro' });
  });

  test('maps a tool_output item to tool.completed with callId + summary', () => {
    const out = mapStreamEvent({
      type: 'run_item_stream_event',
      name: 'tool_output',
      item: { rawItem: { name: 'grep_docs', callId: 'call_1' }, output: [{ a: 1 }, { a: 2 }, { a: 3 }] },
    });
    expect(out).toEqual({ type: 'tool.completed', tool: 'grep_docs', callId: 'call_1', summary: '3 matches' });
  });

  test('summarizes a read_doc_section not-found output', () => {
    const out = mapStreamEvent({
      type: 'run_item_stream_event',
      name: 'tool_output',
      item: { rawItem: { name: 'read_doc_section', callId: 'c2' }, output: { found: false } },
    });
    expect(out).toMatchObject({ type: 'tool.completed', tool: 'read_doc_section', callId: 'c2', summary: 'not found' });
  });

  test('tool.started callId falls back to the tool name when missing', () => {
    const out = mapStreamEvent({ type: 'run_item_stream_event', name: 'tool_called', item: { rawItem: { name: 'list_docs' } } });
    expect(out).toMatchObject({ type: 'tool.started', tool: 'list_docs', callId: 'list_docs' });
  });

  test('maps message_output_created to message.completed', () => {
    const out = mapStreamEvent({ type: 'run_item_stream_event', name: 'message_output_created', item: {} });
    expect(out).toEqual({ type: 'message.completed' });
  });

  test('ignores unmapped raw events (returns null)', () => {
    expect(mapStreamEvent({ type: 'raw_model_stream_event', data: { type: 'model' } })).toBeNull();
    expect(mapStreamEvent({ type: 'agent_updated_stream_event' })).toBeNull();
  });

  test('every mapped event validates against the shared schema', () => {
    const samples = [
      { type: 'raw_model_stream_event', data: { type: 'output_text_delta', delta: 'x' } },
      { type: 'run_item_stream_event', name: 'tool_called', item: { rawItem: { name: 'list_docs', callId: 'c', arguments: '{}' } } },
      { type: 'run_item_stream_event', name: 'tool_output', item: { rawItem: { name: 'list_docs', callId: 'c' }, output: [] } },
      { type: 'run_item_stream_event', name: 'message_output_created', item: {} },
    ];
    for (const s of samples) {
      const mapped = mapStreamEvent(s);
      expect(mapped).not.toBeNull();
      expect(() => streamEventSchema.parse(mapped)).not.toThrow();
    }
  });
});

describe('buildSuggestions', () => {
  const cite = (title: string, route?: string): Citation => ({ title, sourcePath: `${title}.md`, ...(route ? { route } : {}) });

  test('produces a suggestion per distinct cited doc, capped at 3', () => {
    const s = buildSuggestions([
      cite('Lecture 08', '/lectures/08'),
      cite('Lecture 09', '/lectures/09'),
      cite('Lecture 10', '/lectures/10'),
      cite('Lecture 11', '/lectures/11'),
    ]);
    expect(s).toHaveLength(3);
    expect(s[0]!.label).toContain('Lecture 08');
    expect(s[0]!.prompt.length).toBeGreaterThan(0);
  });

  test('dedupes by title', () => {
    const s = buildSuggestions([cite('Lecture 08'), cite('Lecture 08')]);
    expect(s).toHaveLength(1);
  });

  test('returns empty for no citations', () => {
    expect(buildSuggestions([])).toEqual([]);
  });
});
