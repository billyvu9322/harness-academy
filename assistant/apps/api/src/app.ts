import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Env } from './config/env';
import { isOriginAllowed, parseAllowedOrigins } from './config/origins';
import { initLlm } from './agent/llm';
import { healthRoute } from './routes/health';
import { chatRoute } from './routes/chat';
import { conversationsRoute } from './routes/conversations';
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { sendError } from './http/errors';

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }
}

export async function buildApp(env: Env) {
  initLlm();
  const app = Fastify({ logger: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Assistant Harness Academy",
        description: "Assistant Harness Academy chat, messages, trace, completion Apis.",
        version: "0.1.0",
      },
      servers: [{ url: `${env.API_BASE_URL !== undefined ? env.API_BASE_URL : 'http://localhost:5001'}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  app.decorate("env", env);

  const allowedOrigins = parseAllowedOrigins(env.WEB_ORIGINS);
  await app.register(cors, {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin ?? undefined, allowedOrigins)),
  });
  
  await app.register(healthRoute);
  await app.register(chatRoute);
  await app.register(conversationsRoute);

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.setErrorHandler((error, _request, reply) => sendError(reply, error));

  return app;
}
