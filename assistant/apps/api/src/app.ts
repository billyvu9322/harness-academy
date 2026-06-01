import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { isOriginAllowed, parseAllowedOrigins } from './config/origins';
import { initLlm } from './agent/llm';
import { healthRoute } from './routes/health';
import { chatRoute } from './routes/chat';
import { conversationsRoute } from './routes/conversations';

export async function buildApp() {
  initLlm();
  const app = Fastify({ logger: true });

  const allowedOrigins = parseAllowedOrigins(env.WEB_ORIGINS, env.WEB_ORIGIN);
  await app.register(cors, {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin ?? undefined, allowedOrigins)),
  });
  await app.register(healthRoute);
  await app.register(chatRoute);
  await app.register(conversationsRoute);

  return app;
}
