import { describe, expect, test } from 'vitest';
import { conversationSummarySchema, chatMessageSchema } from '@assistant/shared/chat';
import { toConversationSummary, toMessageDto } from '../../src/db/mappers';

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
});
