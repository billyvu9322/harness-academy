import type { FastifyPluginAsync } from 'fastify';
import { conversationExists, getConversationTraces, getMessages, listConversations } from '../db/repo';

export const conversationsRoute: FastifyPluginAsync = async (app) => {
  app.get('/api/conversations', async (_request, reply) => {
    return reply.send({ conversations: await listConversations() });
  });

  app.get<{ Params: { conversationId: string } }>(
    '/api/conversations/:conversationId/messages',
    async (request, reply) => {
      const { conversationId } = request.params;
      if (!(await conversationExists(conversationId))) {
        return reply.code(404).send({ error: 'not_found' });
      }
      return reply.send({ conversationId, messages: await getMessages(conversationId) });
    },
  );

  app.get<{ Params: { conversationId: string } }>(
    '/api/conversations/:conversationId/traces',
    async (request, reply) => {
      const { conversationId } = request.params;
      if (!(await conversationExists(conversationId))) {
        return reply.code(404).send({ error: 'not_found' });
      }
      return reply.send({ conversationId, traces: await getConversationTraces(conversationId) });
    },
  );

  app.get<{ Params: { conversationId: string } }>(
    '/api/conversations/:conversationId',
    async (request, reply) => {
      const { conversationId } = request.params;
      if (!(await conversationExists(conversationId))) {
        return reply.code(404).send({ error: 'not_found' });
      }
      return reply.send({ conversationId, messages: await getMessages(conversationId) });
    },
  );
};
