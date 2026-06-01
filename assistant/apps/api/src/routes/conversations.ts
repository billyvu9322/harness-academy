import type { FastifyPluginAsync } from 'fastify';

export const conversationsRoute: FastifyPluginAsync = async (app) => {
  app.get('/api/conversations', async (_request, reply) => {
    return reply.code(501).send({
      status: 'not_implemented',
      summary: 'Conversation API scaffold exists but persistence is not implemented yet.',
    });
  });

  app.get('/api/conversations/:conversationId', async (_request, reply) => {
    return reply.code(501).send({
      status: 'not_implemented',
      summary: 'Conversation detail scaffold exists but persistence is not implemented yet.',
    });
  });
};
