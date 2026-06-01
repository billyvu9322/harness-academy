import type { FastifyPluginAsync } from 'fastify';

export const chatRoute: FastifyPluginAsync = async (app) => {
  app.post('/api/chat/stream', async (_request, reply) => {
    return reply.code(501).send({
      status: 'not_implemented',
      summary: 'Chat API scaffold exists but runtime is not implemented yet.',
    });
  });
};
