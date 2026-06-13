import Fastify from 'fastify';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { conversationTracesResponseSchema } from '@assistant/shared/traces';
import { conversationsRoute } from '../../src/routes/conversations';
import { conversationExists, getConversationTraces } from '../../src/db/repo';

vi.mock('../../src/db/repo', () => ({
  conversationExists: vi.fn(),
  getConversationTraces: vi.fn(),
  getMessages: vi.fn(),
  listConversations: vi.fn(),
}));

describe('conversationsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns traces for an existing conversation', async () => {
    vi.mocked(conversationExists).mockResolvedValue(true);
    vi.mocked(getConversationTraces).mockResolvedValue([
      {
        id: 'trace-1',
        messageId: 'message-1',
        accessedDocs: ['docs/AI-Agent-Harness.md'],
        toolCalls: ['read_doc_section'],
        llmCalls: [],
        citationCount: 1,
        latencyMs: 250,
        status: 'ok',
        errorSummary: null,
        regenerated: false,
        createdAt: '2026-06-13T10:00:00.000Z',
      },
    ]);

    const app = Fastify();
    await app.register(conversationsRoute);

    const response = await app.inject({
      method: 'GET',
      url: '/api/conversations/conversation-1/traces',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      conversationId: 'conversation-1',
      traces: [
        {
          id: 'trace-1',
          messageId: 'message-1',
          accessedDocs: ['docs/AI-Agent-Harness.md'],
          toolCalls: ['read_doc_section'],
          llmCalls: [],
          citationCount: 1,
          latencyMs: 250,
          status: 'ok',
          errorSummary: null,
          regenerated: false,
          createdAt: '2026-06-13T10:00:00.000Z',
        },
      ],
    });
    expect(() => conversationTracesResponseSchema.parse(JSON.parse(response.body))).not.toThrow();
    expect(getConversationTraces).toHaveBeenCalledWith('conversation-1');

    await app.close();
  });

  test('returns not_found when traces conversation is missing', async () => {
    vi.mocked(conversationExists).mockResolvedValue(false);

    const app = Fastify();
    await app.register(conversationsRoute);

    const response = await app.inject({
      method: 'GET',
      url: '/api/conversations/missing/traces',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ error: 'not_found' });
    expect(getConversationTraces).not.toHaveBeenCalled();

    await app.close();
  });
});
