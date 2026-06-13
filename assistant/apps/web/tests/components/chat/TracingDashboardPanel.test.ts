import type { ChatTrace } from '@assistant/shared/traces';
import { describe, expect, it } from 'vitest';
import { orderTracesByCreatedAtDesc } from '../../../src/components/chat/TracingDashboardPanel';

function trace(id: string, createdAt: string): ChatTrace {
  return {
    id,
    messageId: null,
    accessedDocs: [],
    toolCalls: [],
    llmCalls: [],
    citationCount: 0,
    latencyMs: 1,
    status: 'ok',
    errorSummary: null,
    regenerated: false,
    createdAt,
  };
}

describe('orderTracesByCreatedAtDesc', () => {
  it('returns newest traces first without mutating input', () => {
    const traces = [
      trace('old', '2026-06-13T08:00:00.000Z'),
      trace('new', '2026-06-13T10:00:00.000Z'),
      trace('middle', '2026-06-13T09:00:00.000Z'),
    ];

    expect(orderTracesByCreatedAtDesc(traces).map((item) => item.id)).toEqual([
      'new',
      'middle',
      'old',
    ]);
    expect(traces.map((item) => item.id)).toEqual(['old', 'new', 'middle']);
  });
});
