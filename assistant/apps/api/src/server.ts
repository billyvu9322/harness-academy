import { env } from './config/env';
import { buildApp } from './app';

const app = await buildApp(env);

await app.listen({ port: env.PORT, host: '0.0.0.0' });
