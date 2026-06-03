import { describe, expect, test } from 'vitest';
import type { StreamEvent } from '@assistant/shared/events';
import {
  toAgentEvent,
  reduceAgentEvent,
  toolLabel,
  TEXT_STEP_ID,
  type TimelineStep,
} from './agentEvent';

describe('toolLabel', () => {
  test('maps the four known tools', () => {
    expect(toolLabel('list_docs')).toBe('Listing docs');
    expect(toolLabel('grep_docs')).toBe('Searching docs');
    expect(toolLabel('read_doc_section')).toBe('Reading section');
    expect(toolLabel('harness_blueprint')).toBe('Drafting blueprint');
  });

  test('falls back to the raw tool name for unknown tools', () => {
    expect(toolLabel('mystery_tool')).toBe('mystery_tool');
  });
});

describe('toAgentEvent', () => {
  test('tool.started → tool_start with labelled name, detail and callId as eventId', () => {
    expect(
      toAgentEvent({ type: 'tool.started', tool: 'grep_docs', callId: 'c1', detail: 'pattern' }),
    ).toEqual({ type: 'tool_start', name: 'Searching docs', detail: 'pattern', eventId: 'c1' });
  });

  test('tool.started without detail leaves detail undefined', () => {
    expect(toAgentEvent({ type: 'tool.started', tool: 'list_docs', callId: 'c2' })).toEqual({
      type: 'tool_start',
      name: 'Listing docs',
      detail: undefined,
      eventId: 'c2',
    });
  });

  test("tool.started for load_skill renders as Skill '<name>' loaded with no detail", () => {
    expect(
      toAgentEvent({ type: 'tool.started', tool: 'load_skill', callId: 'c3', detail: 'concept-explainer' }),
    ).toEqual({ type: 'tool_start', name: "Skill 'concept-explainer' loaded", eventId: 'c3' });
  });

  test('tool.started for load_skill without detail falls back to raw name', () => {
    expect(toAgentEvent({ type: 'tool.started', tool: 'load_skill', callId: 'c4' })).toEqual({
      type: 'tool_start',
      name: 'load_skill',
      eventId: 'c4',
    });
  });

  test('tool.completed → tool_done by eventId carrying the summary', () => {
    expect(
      toAgentEvent({ type: 'tool.completed', tool: 'grep_docs', callId: 'c1', summary: '10 matches' }),
    ).toEqual({ type: 'tool_done', eventId: 'c1', result: '10 matches' });
  });

  test('message.delta → text_delta', () => {
    expect(toAgentEvent({ type: 'message.delta', delta: 'Hello' })).toEqual({
      type: 'text_delta',
      delta: 'Hello',
    });
  });

  test('done → done; error → error', () => {
    expect(toAgentEvent({ type: 'done' })).toEqual({ type: 'done' });
    expect(toAgentEvent({ type: 'error', message: 'boom' })).toEqual({
      type: 'error',
      message: 'boom',
    });
  });

  test('message.started → null (one per LLM turn, must not seed the text step)', () => {
    expect(toAgentEvent({ type: 'message.started' })).toBeNull();
  });

  test('other ignored events → null', () => {
    const ignored: StreamEvent[] = [
      { type: 'message.completed' },
      { type: 'retrieval.completed', chunkIds: ['a'] },
      { type: 'citation', citation: { title: 't', sourcePath: 'p.md' } },
      { type: 'assistant_message.related', messageId: 'm1', items: [] },
      { type: 'suggestion', suggestion: { label: 'l', prompt: 'p' } },
    ];
    for (const ev of ignored) {
      expect(toAgentEvent(ev)).toBeNull();
    }
  });
});

describe('reduceAgentEvent', () => {
  test('tool_start appends a running tool step', () => {
    const steps = reduceAgentEvent([], {
      type: 'tool_start',
      name: 'Searching docs',
      detail: 'pat',
      eventId: 'c1',
    });
    expect(steps).toEqual([
      { id: 'c1', kind: 'tool', label: 'Searching docs', detail: 'pat', status: 'running' },
    ]);
  });

  test('returns a new array, never mutating the input', () => {
    const input: TimelineStep[] = [];
    const out = reduceAgentEvent(input, { type: 'tool_start', name: 'Listing docs', eventId: 'c1' });
    expect(out).not.toBe(input);
    expect(input).toHaveLength(0);
  });

  test('tool_done marks the matching step done by eventId and attaches result', () => {
    let steps = reduceAgentEvent([], {
      type: 'tool_start',
      name: 'Reading section',
      eventId: 'c9',
    });
    steps = reduceAgentEvent(steps, { type: 'tool_done', eventId: 'c9', result: 'section: X' });
    expect(steps).toEqual([
      { id: 'c9', kind: 'tool', label: 'Reading section', detail: undefined, status: 'done', result: 'section: X' },
    ]);
  });

  test('two grep_docs with different callIds close the correct steps', () => {
    let steps: TimelineStep[] = [];
    steps = reduceAgentEvent(steps, { type: 'tool_start', name: 'Searching docs', eventId: 'A', detail: 'first' });
    steps = reduceAgentEvent(steps, { type: 'tool_start', name: 'Searching docs', eventId: 'B', detail: 'second' });
    // Close the SECOND one first — name-matching would wrongly close A.
    steps = reduceAgentEvent(steps, { type: 'tool_done', eventId: 'B', result: '2 matches' });
    expect(steps[0]).toMatchObject({ id: 'A', status: 'running' });
    expect(steps[1]).toMatchObject({ id: 'B', status: 'done', result: '2 matches' });
    // Now close the first.
    steps = reduceAgentEvent(steps, { type: 'tool_done', eventId: 'A', result: '5 matches' });
    expect(steps[0]).toMatchObject({ id: 'A', status: 'done', result: '5 matches' });
    expect(steps[1]).toMatchObject({ id: 'B', status: 'done', result: '2 matches' });
  });

  test('first text_delta adds exactly one Generating response step; further deltas add none', () => {
    let steps: TimelineStep[] = [];
    steps = reduceAgentEvent(steps, { type: 'text_delta', delta: 'a' });
    expect(steps).toEqual([
      { id: TEXT_STEP_ID, kind: 'text', label: 'Generating response', status: 'running' },
    ]);
    steps = reduceAgentEvent(steps, { type: 'text_delta', delta: 'b' });
    steps = reduceAgentEvent(steps, { type: 'text_delta', delta: 'c' });
    expect(steps.filter((s) => s.kind === 'text')).toHaveLength(1);
  });

  test('text_delta after a tool step keeps the tool step and appends the single text step', () => {
    let steps: TimelineStep[] = [];
    steps = reduceAgentEvent(steps, { type: 'tool_start', name: 'Searching docs', eventId: 'c1' });
    steps = reduceAgentEvent(steps, { type: 'text_delta', delta: 'x' });
    expect(steps).toHaveLength(2);
    expect(steps[1]).toMatchObject({ id: TEXT_STEP_ID, kind: 'text', status: 'running' });
  });

  test('done marks any still-running steps (tool and text) as done', () => {
    let steps: TimelineStep[] = [];
    steps = reduceAgentEvent(steps, { type: 'tool_start', name: 'Searching docs', eventId: 'c1' });
    steps = reduceAgentEvent(steps, { type: 'text_delta', delta: 'x' });
    steps = reduceAgentEvent(steps, { type: 'done' });
    expect(steps.every((s) => s.status === 'done')).toBe(true);
  });

  test('error does not crash and marks running steps done', () => {
    let steps: TimelineStep[] = [];
    steps = reduceAgentEvent(steps, { type: 'tool_start', name: 'Searching docs', eventId: 'c1' });
    steps = reduceAgentEvent(steps, { type: 'error', message: 'boom' });
    expect(steps[0]?.status).toBe('done');
  });

  test('a tool_done with no matching eventId is ignored gracefully', () => {
    const steps = reduceAgentEvent([], { type: 'tool_done', eventId: 'ghost', result: 'x' });
    expect(steps).toEqual([]);
  });
});
