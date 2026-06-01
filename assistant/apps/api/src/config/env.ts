import { resolve } from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  // Repo root that holds the indexable docs. Defaults to 3 levels up from apps/api.
  DOCS_ROOT: z.string().min(1).default(resolve(process.cwd(), '..', '..', '..')),
  // LLM router (OpenAI-compatible). Key loaded from .env only — never committed.
  LLM_BASE_URL: z.string().url().default('https://9router.nimo.io.vn/v1'),
  LLM_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/harness_assistant'),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
  OPENAI_CHAT_MODEL: z.string().min(1).default('cx/gpt-5.5'),
  PORT: z.coerce.number().default(3001),
  // Allowed CORS origins (comma-separated) — the standalone web app and/or the academy site
  // that embeds the assistant widget. Defaults to the local dev origins.
  WEB_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
