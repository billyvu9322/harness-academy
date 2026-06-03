import { describe, expect, test } from 'vitest';
import type { StreamEvent } from '@assistant/shared/events';
import { nextStatus, toolStatusLabel, STATUS_THINKING, STATUS_ANSWERING } from '../../src/lib/agentStatus';

describe('toolStatusLabel', () => {
  test('maps known docs tools to friendly VN labels', () => {
    expect(toolStatusLabel('grep_docs')).toMatch(/tìm/i);
    expect(toolStatusLabel('read_doc_section')).toMatch(/đọc/i);
    expect(toolStatusLabel('list_docs')).toMatch(/danh mục/i);
    expect(toolStatusLabel('harness_blueprint')).toMatch(/khung/i);
  });

  test('falls back to a generic label for an unknown tool', () => {
    expect(toolStatusLabel('mystery_tool')).toContain('mystery_tool');
  });
});

describe('nextStatus', () => {
  const ev = (e: StreamEvent) => e;

  test('message.started → thinking', () => {
    expect(nextStatus(null, ev({ type: 'message.started' }))).toBe(STATUS_THINKING);
  });

  test('tool.started → that tool label', () => {
    expect(nextStatus(STATUS_THINKING, ev({ type: 'tool.started', tool: 'grep_docs', callId: 'c1' }))).toBe(
      toolStatusLabel('grep_docs'),
    );
  });

  test('tool.completed → back to thinking', () => {
    expect(
      nextStatus(toolStatusLabel('grep_docs'), ev({ type: 'tool.completed', tool: 'grep_docs', callId: 'c1' })),
    ).toBe(STATUS_THINKING);
  });

  test('message.delta → answering', () => {
    expect(nextStatus(STATUS_THINKING, ev({ type: 'message.delta', delta: 'x' }))).toBe(STATUS_ANSWERING);
  });

  test('citation keeps the previous status', () => {
    const prev = toolStatusLabel('read_doc_section');
    expect(
      nextStatus(prev, ev({ type: 'citation', citation: { title: 't', sourcePath: 'p.md' } })),
    ).toBe(prev);
  });

  test('done / message.completed / error clear the status', () => {
    expect(nextStatus(STATUS_ANSWERING, ev({ type: 'done' }))).toBeNull();
    expect(nextStatus(STATUS_ANSWERING, ev({ type: 'message.completed' }))).toBeNull();
    expect(nextStatus(STATUS_ANSWERING, ev({ type: 'error', message: 'boom' }))).toBeNull();
  });
});
