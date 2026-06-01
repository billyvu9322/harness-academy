import type { FastifyPluginAsync } from 'fastify';
import { chatRequestSchema } from '@assistant/shared/chat';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';
import { assistant } from '../agent/runtime';
import { streamAssistant } from '../agent/streaming';
import { serializeSseEvent } from '../rag/placeholder';
import { env } from '../config/env';
import {
  appendMessage,
  conversationExists,
  createConversation,
  deriveTitle,
  getHistoryTurns,
} from '../db/repo';

/** Resolve the conversation: use the given id if it exists, else create a new one. */
async function resolveConversation(conversationId: string | undefined, message: string): Promise<string> {
  if (conversationId && (await conversationExists(conversationId))) return conversationId;
  return createConversation(deriveTitle(message));
}

export const chatRoute: FastifyPluginAsync = async (app) => {
  // Non-stream answer (B3). Persists the turn and returns the conversation id (B5).
  app.post('/api/chat/message', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }
    const { message, conversationId: reqId } = parsed.data;
    const conversationId = await resolveConversation(reqId, message);

    try {
      const history = await getHistoryTurns(conversationId);
      await appendMessage({ conversationId, role: 'user', content: message });
      const { answer, citations } = await assistant.runMessage(message, {
        userLanguage: 'Vietnamese',
        history,
      });
      await appendMessage({ conversationId, role: 'assistant', content: answer, citations });
      return reply.send({ conversationId, answer, citations });
    } catch (err) {
      request.log.error({ err }, 'assistant runMessage failed');
      return reply.code(422).send({
        error: 'assistant_error',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });

  // Streaming SSE (B4) + persistence (B5). Conversation id returned via X-Conversation-Id header.
  app.post('/api/chat/stream', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }
    const { message, conversationId: reqId } = parsed.data;
    const conversationId = await resolveConversation(reqId, message);
    const history = await getHistoryTurns(conversationId);
    await appendMessage({ conversationId, role: 'user', content: message });

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': env.WEB_ORIGIN,
      'Access-Control-Expose-Headers': 'X-Conversation-Id',
      'X-Conversation-Id': conversationId,
    });

    let answer = '';
    const citations: Citation[] = [];
    const suggestions: Suggestion[] = [];
    try {
      for await (const ev of streamAssistant(message, { userLanguage: 'Vietnamese', history })) {
        if (ev.type === 'message.delta') answer += ev.delta;
        else if (ev.type === 'citation') citations.push(ev.citation);
        else if (ev.type === 'suggestion') suggestions.push(ev.suggestion);
        reply.raw.write(serializeSseEvent(ev));
      }
      await appendMessage({ conversationId, role: 'assistant', content: answer, citations, suggestions });
    } catch (err) {
      request.log.error({ err }, 'stream failed');
      reply.raw.write(serializeSseEvent({ type: 'error', message: 'stream failed' }));
      reply.raw.write(serializeSseEvent({ type: 'done' }));
    } finally {
      reply.raw.end();
    }
  });
};
