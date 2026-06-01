import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional().default(''),
  DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/harness_assistant'),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
  OPENAI_CHAT_MODEL: z.string().min(1).default('gpt-5.5-mini'),
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.string().url().default('http://localhost:5174'),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
