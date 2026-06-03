import { describe, expect, test } from 'vitest';
import type { AssistantContext } from '../../src/agent/context';
import type { DocSection } from '../../src/docs/search';
import { buildTraceSummary } from '../../src/observability/trace';

function section(docId: string, heading: string | null): DocSection {
  return { docId, title: docId, contentType: 'lecture', sourcePath: `${docId}`, heading, text: 'x' };
}

const ctx: AssistantContext = {
  reads: [section('a.md', 'H1'), section('a.md', 'H2'), section('b.md', 'H1')],
  toolCalls: ['list_docs', 'grep_docs', 'read_doc_section', 'read_doc_section'],
  loadedSkills: [],
  mode: 'qa',
};

describe('buildTraceSummary', () => {
  test('summarizes accessed docs (unique), tool calls, and citation count', () => {
    const t = buildTraceSummary({ context: ctx, latencyMs: 1234, status: 'ok', regenerated: false });
    expect(t.accessedDocs).toEqual(['a.md', 'b.md']); // unique docIds
    expect(t.toolCalls).toEqual(['list_docs', 'grep_docs', 'read_doc_section', 'read_doc_section']);
    expect(t.citationCount).toBe(3); // 3 distinct doc+heading sections
    expect(t.latencyMs).toBe(1234);
    expect(t.status).toBe('ok');
    expect(t.regenerated).toBe(false);
  });

  test('carries error status + summary', () => {
    const t = buildTraceSummary({
      context: { reads: [], toolCalls: [] },
      latencyMs: 10,
      status: 'error',
      error: 'boom',
      regenerated: false,
    });
    expect(t.status).toBe('error');
    expect(t.errorSummary).toBe('boom');
    expect(t.citationCount).toBe(0);
    expect(t.accessedDocs).toEqual([]);
  });
});
