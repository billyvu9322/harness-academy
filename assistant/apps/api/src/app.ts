import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { initLlm } from './agent/llm';
import { healthRoute } from './routes/health';
import { chatRoute } from './routes/chat';
import { conversationsRoute } from './routes/conversations';

export async function buildApp() {
  initLlm();
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(healthRoute);
  await app.register(chatRoute);
  await app.register(conversationsRoute);

  return app;
}
