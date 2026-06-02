import { resolve } from "node:path";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export function resolveEnvRootDir(fromDir: string) {
  let currentDir = path.resolve(fromDir);

  while (true) {
    const workspaceFile = path.join(currentDir, "pnpm-workspace.yaml");

    if (fs.existsSync(workspaceFile)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return path.resolve(fromDir);
    }

    currentDir = parentDir;
  }
}

function loadEnvFiles(fromDir: string) {
  const rootDir = resolveEnvRootDir(fromDir);
  const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();
  process.env.NODE_ENV = nodeEnv;

  for (const file of [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    ".env.local",
    ".env",
    ".env.production",
  ]) {
    dotenv.config({ path: path.join(rootDir, file), override: false });
  }

  if (process.env.NODE_ENV === "development" && process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      "@postgres:",
      "@localhost:",
    );
  }
}

loadEnvFiles(process.cwd());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Repo root that holds the indexable docs. Defaults to 3 levels up from apps/api.
  DOCS_ROOT: z
    .string()
    .min(1)
    .default(resolve(process.cwd(), "..", "..", "..")),
  // LLM router (OpenAI-compatible). Key loaded from .env only — never committed.
  LLM_BASE_URL: z.url().default("https://9router.nimo.io.vn/v1"),
  LLM_API_KEY: z.string().min(1),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://postgres:postgres@localhost:5432/harness_assistant"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().min(1).default("cx/gpt-5.5"),
  PORT: z.coerce.number().default(3001),
  // Allowed CORS origins (comma-separated) — the standalone web app and/or the academy site
  // that embeds the assistant widget. Defaults to the local dev origins.
  WEB_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174"),
  // Optional public API URL used by Swagger/OpenAPI outside local dev.
  API_BASE_URL: z.string().optional(),
});

export type Env = ReturnType<typeof parseEnv>;

export function parseEnv(
  input: NodeJS.ProcessEnv | Record<string, string | undefined>,
) {
  const env = envSchema.parse(input);
  const appUrl = env.API_BASE_URL?.replace(/\/$/, "");

  return {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DOCS_ROOT: env.DOCS_ROOT,
    LLM_BASE_URL: env.LLM_BASE_URL,
    LLM_API_KEY: env.LLM_API_KEY,
    DATABASE_URL: env.DATABASE_URL,
    OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL,
    OPENAI_CHAT_MODEL: env.OPENAI_CHAT_MODEL,
    WEB_ORIGINS: env.WEB_ORIGINS,
    API_BASE_URL: appUrl,
  };
}

export const env = parseEnv(process.env);
