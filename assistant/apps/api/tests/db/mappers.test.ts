import { describe, expect, test } from 'vitest';
import { conversationSummarySchema, chatMessageSchema } from '@assistant/shared/chat';
import { chatTraceSchema } from '@assistant/shared/traces';
import { toConversationSummary, toMessageDto, toTraceDto, type TraceRow } from '../../src/db/mappers';

describe('toConversationSummary', () => {
  test('maps a row and serializes updatedAt to ISO', () => {
    const s = toConversationSummary({
      id: 'c1',
      title: 'Hỏi về verification gate',
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    });
    expect(s.id).toBe('c1');
    expect(s.title).toBe('Hỏi về verification gate');
    expect(s.updatedAt).toBe('2026-06-01T10:00:00.000Z');
    expect(() => conversationSummarySchema.parse(s)).not.toThrow();
  });
});

describe('toMessageDto', () => {
  const base = {
    id: 'm1',
    conversationId: 'c1',
    content: 'nội dung',
    traceId: null,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
  };

  test('maps an assistant row with citations + suggestions', () => {
    const dto = toMessageDto({
      ...base,
      role: 'assistant',
      citationsJson: [{ title: 'Lecture 08', sourcePath: 'a.md', route: '/lectures/08' }],
      suggestionsJson: [{ label: 'Lecture 08', prompt: 'Giải thích thêm' }],
    });
    expect(dto.role).toBe('assistant');
    expect(dto.citations).toHaveLength(1);
    expect(dto.suggestions).toHaveLength(1);
    expect(dto.createdAt).toBe('2026-06-01T10:00:00.000Z');
    expect(() => chatMessageSchema.parse(dto)).not.toThrow();
  });

  test('defaults null citations/suggestions to empty arrays', () => {
    const dto = toMessageDto({ ...base, role: 'user', citationsJson: null, suggestionsJson: null });
    expect(dto.citations).toEqual([]);
    expect(dto.suggestions).toEqual([]);
    expect(() => chatMessageSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty citations/suggestions for non-array persisted JSON', () => {
    const dto = toMessageDto({
      ...base,
      role: 'assistant',
      citationsJson: { title: 'Lecture 08', sourcePath: 'a.md', route: '/lectures/08' },
      suggestionsJson: { label: 'Lecture 08', prompt: 'Giải thích thêm' },
    });

    expect(dto.citations).toEqual([]);
    expect(dto.suggestions).toEqual([]);
    expect(() => chatMessageSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty citations/suggestions for malformed persisted JSON arrays', () => {
    const dto = toMessageDto({
      ...base,
      role: 'assistant',
      citationsJson: [{ title: 'Lecture 08', route: '/lectures/08' }],
      suggestionsJson: [{ label: 'Lecture 08' }],
    });

    expect(dto.citations).toEqual([]);
    expect(dto.suggestions).toEqual([]);
    expect(() => chatMessageSchema.parse(dto)).not.toThrow();
  });
});

describe('toTraceDto', () => {
  const baseTraceRow: TraceRow = {
    id: 't1',
    conversationId: 'c1',
    messageId: undefined,
    intent: 'qa',
    accessedDocsJson: null,
    toolCallsJson: null,
    llmCallsJson: null,
    citationCount: 1,
    latencyMs: 250,
    status: 'ok',
    errorSummary: undefined,
    regenerated: false,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
  };

  test('maps a trace row with JSON fields and nullable optional fields', () => {
    const dto = toTraceDto({
      ...baseTraceRow,
      accessedDocsJson: ['docs/AI-Agent-Harness.md'],
      toolCallsJson: ['read_doc_section'],
      llmCallsJson: [
        {
          endpoint: 'chat.completions',
          model: 'router-model',
          stream: true,
          status: 'ok',
          latencyMs: 123,
        },
      ],
    });

    expect(dto).toEqual({
      id: 't1',
      messageId: null,
      accessedDocs: ['docs/AI-Agent-Harness.md'],
      toolCalls: ['read_doc_section'],
      llmCalls: [
        {
          endpoint: 'chat.completions',
          model: 'router-model',
          stream: true,
          status: 'ok',
          latencyMs: 123,
        },
      ],
      citationCount: 1,
      latencyMs: 250,
      status: 'ok',
      errorSummary: null,
      regenerated: false,
      createdAt: '2026-06-01T10:00:00.000Z',
    });
    expect(() => chatTraceSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty doc and tool arrays for non-array persisted JSON', () => {
    const dto = toTraceDto({
      ...baseTraceRow,
      accessedDocsJson: { docId: 'docs/AI-Agent-Harness.md' },
      toolCallsJson: 'read_doc_section',
    } as unknown as TraceRow);

    expect(dto.accessedDocs).toEqual([]);
    expect(dto.toolCalls).toEqual([]);
    expect(() => chatTraceSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty doc and tool arrays for malformed string arrays', () => {
    const dto = toTraceDto({
      ...baseTraceRow,
      accessedDocsJson: ['docs/AI-Agent-Harness.md', 404],
      toolCallsJson: ['read_doc_section', null],
    } as unknown as TraceRow);

    expect(dto.accessedDocs).toEqual([]);
    expect(dto.toolCalls).toEqual([]);
    expect(() => chatTraceSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty llmCalls for malformed persisted JSON', () => {
    const dto = toTraceDto({
      ...baseTraceRow,
      llmCallsJson: { endpoint: 'chat.completions', status: 'ok', latencyMs: 12 },
    } as unknown as TraceRow);

    expect(dto.llmCalls).toEqual([]);
    expect(() => chatTraceSchema.parse(dto)).not.toThrow();
  });

  test('falls back to empty llmCalls when persisted calls have the wrong shape', () => {
    const dto = toTraceDto({
      ...baseTraceRow,
      llmCallsJson: [
        {
          endpoint: 'chat.completions',
          status: 'ok',
          prompt: 'persisted prompt content should not cross the boundary',
        },
      ],
    } as unknown as TraceRow);

    expect(dto.llmCalls).toEqual([]);
    expect(() => chatTraceSchema.parse(dto)).not.toThrow();
  });
});
