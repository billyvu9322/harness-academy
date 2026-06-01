import { describe, expect, test } from 'vitest';
import { streamEventSchema } from '@assistant/shared/events';
import type { Citation } from '@assistant/shared/citations';
import { mapStreamEvent, buildSuggestions } from './streaming';

describe('mapStreamEvent', () => {
  test('maps a raw output_text_delta to message.delta', () => {
    const out = mapStreamEvent({ type: 'raw_model_stream_event', data: { type: 'output_text_delta', delta: 'Hello' } });
    expect(out).toEqual({ type: 'message.delta', delta: 'Hello' });
  });

  test('maps response_started to message.started', () => {
    const out = mapStreamEvent({ type: 'raw_model_stream_event', data: { type: 'response_started' } });
    expect(out).toEqual({ type: 'message.started' });
  });

  test('maps a tool_called item to tool.started with the tool name', () => {
    const out = mapStreamEvent({ type: 'run_item_stream_event', name: 'tool_called', item: { rawItem: { name: 'grep_docs' } } });
    expect(out).toEqual({ type: 'tool.started', tool: 'grep_docs' });
  });

  test('maps a tool_output item to tool.completed', () => {
    const out = mapStreamEvent({ type: 'run_item_stream_event', name: 'tool_output', item: { rawItem: { name: 'read_doc_section' } } });
    expect(out).toEqual({ type: 'tool.completed', tool: 'read_doc_section' });
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
      { type: 'run_item_stream_event', name: 'tool_called', item: { rawItem: { name: 'list_docs' } } },
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
