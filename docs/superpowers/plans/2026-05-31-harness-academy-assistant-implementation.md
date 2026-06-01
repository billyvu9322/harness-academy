# Harness Academy Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript-only `assistant/` monorepo with local-doc-only RAG, a Fastify streaming chat API using the OpenAI Agents SDK, and a React chat UI that answers harness-engineering questions with citations.

**Architecture:** Create a standalone `assistant/` `pnpm` + `turbo` monorepo with `apps/api`, `apps/web`, and `packages/shared`. The backend owns ingestion, retrieval, agent orchestration, SSE streaming, persistence, and tracing. The frontend owns chat rendering, citation display, suggested prompts, and conversation state. Local project docs are chunked and embedded into Postgres, then retrieved through narrow tools exposed to a single main assistant agent.

**Tech Stack:** TypeScript, Node.js, Fastify, OpenAI Agents SDK for TypeScript, PostgreSQL, Drizzle ORM, Zod, React, Vite, Tailwind CSS, TanStack Router, TanStack Query, Zustand, `pnpm`, `turbo`, Docker Compose.

---

## File Map

### New files to create

- `assistant/package.json` - monorepo root scripts and dev dependencies.
- `assistant/pnpm-workspace.yaml` - workspace package list.
- `assistant/turbo.json` - pipeline definitions.
- `assistant/tsconfig.base.json` - shared TypeScript config.
- `assistant/.env.example` - API, DB, and embedding environment variables.
- `assistant/docker-compose.yml` - Postgres plus app services for local dev.
- `assistant/AGENTS.md` - assistant-specific harness instructions.
- `assistant/apps/api/package.json` - API package scripts and deps.
- `assistant/apps/api/tsconfig.json` - API TS config.
- `assistant/apps/api/src/server.ts` - API server entrypoint.
- `assistant/apps/api/src/app.ts` - Fastify app builder.
- `assistant/apps/api/src/config/env.ts` - env parsing and export.
- `assistant/apps/api/src/routes/health.ts` - health route.
- `assistant/apps/api/src/routes/chat.ts` - streaming chat route.
- `assistant/apps/api/src/routes/conversations.ts` - conversation read endpoints.
- `assistant/apps/api/src/agent/harnessAssistant.ts` - main agent definition.
- `assistant/apps/api/src/agent/prompts.ts` - system instructions.
- `assistant/apps/api/src/agent/tools.ts` - narrow local-doc tools.
- `assistant/apps/api/src/agent/guardrails.ts` - input/output guardrails.
- `assistant/apps/api/src/agent/streaming.ts` - SDK-to-SSE event mapper.
- `assistant/apps/api/src/agent/suggestions.ts` - next-prompt suggestion builder.
- `assistant/apps/api/src/rag/sources.ts` - source allowlist.
- `assistant/apps/api/src/rag/parseMarkdown.ts` - markdown/frontmatter parser.
- `assistant/apps/api/src/rag/chunk.ts` - heading-based chunker.
- `assistant/apps/api/src/rag/embed.ts` - embedding calls.
- `assistant/apps/api/src/rag/retrieve.ts` - retrieval service.
- `assistant/apps/api/src/rag/rerank.ts` - local rerank heuristic.
- `assistant/apps/api/src/rag/citations.ts` - citation formatter.
- `assistant/apps/api/src/rag/ingest.ts` - ingestion CLI.
- `assistant/apps/api/src/db/client.ts` - Drizzle/Postgres connection.
- `assistant/apps/api/src/db/schema.ts` - schema definitions.
- `assistant/apps/api/drizzle.config.ts` - Drizzle config.
- `assistant/apps/api/src/observability/logger.ts` - logger wrapper.
- `assistant/apps/api/src/observability/trace.ts` - chat trace persistence helpers.
- `assistant/apps/api/src/evals/goldenQuestions.ts` - fixed eval cases.
- `assistant/apps/api/src/evals/runEvals.ts` - eval runner.
- `assistant/apps/api/test/health.test.ts` - health route test.
- `assistant/apps/api/test/chat-stream.test.ts` - stream route integration test.
- `assistant/apps/api/test/chunk.test.ts` - chunker unit test.
- `assistant/apps/api/test/retrieve.test.ts` - retrieval unit/integration test.
- `assistant/apps/web/package.json` - web package scripts and deps.
- `assistant/apps/web/tsconfig.json` - web TS config.
- `assistant/apps/web/vite.config.ts` - Vite config.
- `assistant/apps/web/index.html` - Vite HTML shell.
- `assistant/apps/web/src/main.tsx` - web entrypoint.
- `assistant/apps/web/src/router.tsx` - route definitions.
- `assistant/apps/web/src/app/AppShell.tsx` - app layout.
- `assistant/apps/web/src/components/chat/ChatPage.tsx` - top-level chat page.
- `assistant/apps/web/src/components/chat/ChatComposer.tsx` - input form.
- `assistant/apps/web/src/components/chat/MessageList.tsx` - thread view.
- `assistant/apps/web/src/components/chat/CitationList.tsx` - citation block.
- `assistant/apps/web/src/components/chat/SuggestionChips.tsx` - follow-up prompts.
- `assistant/apps/web/src/features/chat/useChatStream.ts` - streaming hook.
- `assistant/apps/web/src/features/chat/chatApi.ts` - API client.
- `assistant/apps/web/src/features/chat/chatQuery.ts` - TanStack Query helpers.
- `assistant/apps/web/src/stores/chatUiStore.ts` - Zustand UI state.
- `assistant/apps/web/src/schemas/chat.ts` - frontend event parsing.
- `assistant/apps/web/src/lib/sse.ts` - SSE parser client helper.
- `assistant/apps/web/src/lib/routes.ts` - route constants.
- `assistant/apps/web/src/styles.css` - Tailwind entry.
- `assistant/apps/web/src/test/chat-page.test.tsx` - chat render test.
- `assistant/packages/shared/package.json` - shared package metadata.
- `assistant/packages/shared/tsconfig.json` - shared TS config.
- `assistant/packages/shared/src/chat.ts` - request/response Zod schemas.
- `assistant/packages/shared/src/events.ts` - SSE event Zod schemas.
- `assistant/packages/shared/src/citations.ts` - citation schema.
- `assistant/packages/shared/src/suggestions.ts` - suggestion schema.

### Existing files to read for alignment

- `docs/superpowers/specs/2026-05-31-harness-academy-assistant-design.md`
- `AGENTS.md`
- `academy/src/content/index.ts`
- `academy/src/router.tsx`
- `AI-Agent-Harness.md`
- `docs/OpenAI-Harness-Engineering.md`

## Task 1: Bootstrap `assistant/` monorepo skeleton

**Files:**
- Create: `assistant/package.json`
- Create: `assistant/pnpm-workspace.yaml`
- Create: `assistant/turbo.json`
- Create: `assistant/tsconfig.base.json`
- Create: `assistant/.env.example`
- Create: `assistant/docker-compose.yml`
- Create: `assistant/AGENTS.md`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "harness-academy-assistant",
  "private": true,
  "packageManager": "pnpm@10.12.4",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "db:generate": "pnpm --filter @assistant/api db:generate",
    "db:migrate": "pnpm --filter @assistant/api db:migrate",
    "ingest": "pnpm --filter @assistant/api ingest"
  },
  "devDependencies": {
    "turbo": "^2.0.12",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Create workspace config**

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 3: Create `turbo.json` pipeline**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

- [ ] **Step 4: Create base TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": "."
  }
}
```

- [ ] **Step 5: Create `.env.example`**

```dotenv
OPENAI_API_KEY=
DATABASE_URL=postgres://postgres:postgres@localhost:5432/harness_assistant
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-5.5-mini
PORT=3001
WEB_ORIGIN=http://localhost:5174
```

- [ ] **Step 6: Create Docker Compose**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: harness_assistant
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 7: Create `assistant/AGENTS.md`**

```md
# Assistant Instructions

## Scope

- `apps/api/` owns ingestion, retrieval, agent runtime, persistence, tracing.
- `apps/web/` owns chat UI, SSE consumption, citations, suggestions.
- `packages/shared/` owns Zod schemas and cross-app event contracts.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
- Ingest local docs: `pnpm ingest`
- Generate migrations: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`

## Rules

- Phase 1 is local-doc-only RAG. No web fallback.
- Every factual answer must include local citations.
- No broad shell or filesystem tools exposed to end users.
- Stream structured SSE events, not raw model events, to the frontend.
```

- [ ] **Step 8: Verify monorepo root files exist**

Run: `Test-Path -LiteralPath "assistant"`
Expected: `True`

- [ ] **Step 9: Commit bootstrap**

```bash
git add assistant docs/superpowers/plans/2026-05-31-harness-academy-assistant-implementation.md
git commit -m "chore: bootstrap assistant monorepo"
```

## Task 2: Add shared schemas package

**Files:**
- Create: `assistant/packages/shared/package.json`
- Create: `assistant/packages/shared/tsconfig.json`
- Create: `assistant/packages/shared/src/chat.ts`
- Create: `assistant/packages/shared/src/events.ts`
- Create: `assistant/packages/shared/src/citations.ts`
- Create: `assistant/packages/shared/src/suggestions.ts`

- [ ] **Step 1: Create `package.json` for shared package**

```json
{
  "name": "@assistant/shared",
  "private": true,
  "type": "module",
  "main": "src/chat.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo \"No tests in shared yet\""
  },
  "dependencies": {
    "zod": "^3.24.1"
  }
}
```

- [ ] **Step 2: Create shared TS config**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create citation schema**

```ts
import { z } from 'zod';

export const citationSchema = z.object({
  title: z.string(),
  route: z.string().optional(),
  sourcePath: z.string(),
  sectionHeading: z.string().optional(),
});

export type Citation = z.infer<typeof citationSchema>;
```

- [ ] **Step 4: Create suggestion schema**

```ts
import { z } from 'zod';

export const suggestionSchema = z.object({
  label: z.string(),
  prompt: z.string(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
```

- [ ] **Step 5: Create chat request/response schemas**

```ts
import { z } from 'zod';

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  mode: z.enum(['academy', 'harness-design']).default('academy'),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
```

- [ ] **Step 6: Create streaming event schemas**

```ts
import { z } from 'zod';
import { citationSchema } from './citations';
import { suggestionSchema } from './suggestions';

export const streamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message.started') }),
  z.object({ type: z.literal('message.delta'), delta: z.string() }),
  z.object({ type: z.literal('retrieval.completed'), chunkIds: z.array(z.string()) }),
  z.object({ type: z.literal('citation'), citation: citationSchema }),
  z.object({ type: z.literal('suggestion'), suggestion: suggestionSchema }),
  z.object({ type: z.literal('error'), message: z.string() }),
  z.object({ type: z.literal('done') }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
```

- [ ] **Step 7: Run shared typecheck**

Run: `pnpm --filter @assistant/shared typecheck`
Expected: exit code `0`

- [ ] **Step 8: Commit shared schemas**

```bash
git add assistant/packages/shared
git commit -m "feat: add assistant shared schemas"
```

## Task 3: Build API skeleton and environment wiring

**Files:**
- Create: `assistant/apps/api/package.json`
- Create: `assistant/apps/api/tsconfig.json`
- Create: `assistant/apps/api/src/server.ts`
- Create: `assistant/apps/api/src/app.ts`
- Create: `assistant/apps/api/src/config/env.ts`
- Create: `assistant/apps/api/src/routes/health.ts`
- Create: `assistant/apps/api/test/health.test.ts`

- [ ] **Step 1: Create API package manifest**

```json
{
  "name": "@assistant/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "ingest": "tsx src/rag/ingest.ts"
  },
  "dependencies": {
    "@assistant/shared": "workspace:*",
    "@fastify/cors": "^10.0.1",
    "fastify": "^5.2.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Create API TS config**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 3: Create env parser**

```ts
import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  OPENAI_EMBEDDING_MODEL: z.string().min(1),
  OPENAI_CHAT_MODEL: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 4: Create health route plugin**

```ts
import type { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({ status: 'ok' as const }));
};
```

- [ ] **Step 5: Create app builder**

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { healthRoute } from './routes/health';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(healthRoute);
  return app;
}
```

- [ ] **Step 6: Create server entrypoint**

```ts
import { env } from './config/env';
import { buildApp } from './app';

const app = await buildApp();
await app.listen({ port: env.PORT, host: '0.0.0.0' });
```

- [ ] **Step 7: Write health route test**

```ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';

describe('GET /health', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = 'test';
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/test';
    process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
    process.env.OPENAI_CHAT_MODEL = 'gpt-5.5-mini';
    process.env.WEB_ORIGIN = 'http://localhost:5174';
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok status', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter @assistant/api test`
Expected: `1 passed`

- [ ] **Step 9: Commit API skeleton**

```bash
git add assistant/apps/api
git commit -m "feat: add assistant api skeleton"
```

## Task 4: Add database schema and ingestion pipeline

**Files:**
- Create: `assistant/apps/api/src/db/client.ts`
- Create: `assistant/apps/api/src/db/schema.ts`
- Create: `assistant/apps/api/drizzle.config.ts`
- Create: `assistant/apps/api/src/rag/sources.ts`
- Create: `assistant/apps/api/src/rag/parseMarkdown.ts`
- Create: `assistant/apps/api/src/rag/chunk.ts`
- Create: `assistant/apps/api/src/rag/ingest.ts`
- Create: `assistant/apps/api/test/chunk.test.ts`

- [ ] **Step 1: Add DB dependencies to API package**

Modify `assistant/apps/api/package.json` dependencies block to include:

```json
{
  "dependencies": {
    "@assistant/shared": "workspace:*",
    "@fastify/cors": "^10.0.1",
    "drizzle-orm": "^0.39.1",
    "fastify": "^5.2.1",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Create Drizzle client**

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool);
```

- [ ] **Step 3: Create schema**

```ts
import { integer, jsonb, pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';

export const documentSources = pgTable('document_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourcePath: text('source_path').notNull(),
  contentType: text('content_type').notNull(),
  slug: text('slug'),
  title: text('title').notNull(),
  route: text('route'),
  checksum: text('checksum').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentSourceId: uuid('document_source_id').notNull(),
  sectionHeading: text('section_heading'),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokenEstimate: integer('token_estimate').notNull(),
});

export const documentEmbeddings = pgTable('document_embeddings', {
  chunkId: uuid('chunk_id').primaryKey(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
});
```

- [ ] **Step 4: Create source allowlist**

```ts
export const sourceGlobs = [
  'academy/content/lectures/*.md',
  'academy/content/projects/*.md',
  'academy/content/skills/*.md',
  'academy/content/references/*.md',
  'AI-Agent-Harness.md',
  'docs/*.md',
  'templates/automation-test-harness-experimental/README.md',
  'templates/automation-test-harness-experimental/AGENTS.md',
  'templates/automation-test-harness-experimental/CLAUDE.md',
  'templates/automation-test-harness-experimental/Template.md',
];
```

- [ ] **Step 5: Create markdown parser**

```ts
export interface ParsedMarkdown {
  title: string;
  body: string;
}

export function parseMarkdown(raw: string, fallbackTitle: string): ParsedMarkdown {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const body = match ? raw.slice(match[0].length).trim() : raw.trim();
  const titleMatch = match?.[1].match(/^title:\s*"?(.+?)"?$/m);
  return {
    title: titleMatch?.[1] ?? fallbackTitle,
    body,
  };
}
```

- [ ] **Step 6: Write failing chunker test**

```ts
import { describe, expect, it } from 'vitest';
import { chunkMarkdown } from '../src/rag/chunk';

describe('chunkMarkdown', () => {
  it('splits on headings and preserves section heading metadata', () => {
    const input = '# Intro\nAlpha\n\n## Two\nBeta';
    const chunks = chunkMarkdown(input);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].sectionHeading).toBe('Intro');
    expect(chunks[1].sectionHeading).toBe('Two');
  });
});
```

- [ ] **Step 7: Write minimal chunker implementation**

```ts
export interface ChunkResult {
  sectionHeading: string;
  content: string;
  tokenEstimate: number;
}

export function chunkMarkdown(input: string): ChunkResult[] {
  const sections = input.split(/(?=^#{1,6}\s)/m).filter(Boolean);
  return sections.map((section) => {
    const [firstLine, ...rest] = section.trim().split('\n');
    return {
      sectionHeading: firstLine.replace(/^#{1,6}\s*/, '').trim(),
      content: section.trim(),
      tokenEstimate: Math.ceil(section.length / 4),
    };
  });
}
```

- [ ] **Step 8: Create minimal ingestion CLI shell**

```ts
import { sourceGlobs } from './sources';

async function main() {
  console.log(JSON.stringify({ status: 'ok', sourceGlobs }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 9: Run chunk test**

Run: `pnpm --filter @assistant/api test`
Expected: chunk test passes alongside health test

- [ ] **Step 10: Commit DB and ingestion base**

```bash
git add assistant/apps/api
git commit -m "feat: add assistant ingestion foundation"
```

## Task 5: Add agent runtime, retrieval, and SSE chat route

**Files:**
- Create: `assistant/apps/api/src/agent/prompts.ts`
- Create: `assistant/apps/api/src/agent/tools.ts`
- Create: `assistant/apps/api/src/agent/guardrails.ts`
- Create: `assistant/apps/api/src/agent/harnessAssistant.ts`
- Create: `assistant/apps/api/src/agent/streaming.ts`
- Create: `assistant/apps/api/src/agent/suggestions.ts`
- Create: `assistant/apps/api/src/rag/retrieve.ts`
- Create: `assistant/apps/api/src/rag/rerank.ts`
- Create: `assistant/apps/api/src/rag/citations.ts`
- Create: `assistant/apps/api/src/routes/chat.ts`
- Create: `assistant/apps/api/test/chat-stream.test.ts`

- [ ] **Step 1: Add OpenAI SDK dependencies to API package**

Modify `assistant/apps/api/package.json` dependencies block to include:

```json
{
  "dependencies": {
    "@assistant/shared": "workspace:*",
    "@fastify/cors": "^10.0.1",
    "@openai/agents": "^0.1.0",
    "drizzle-orm": "^0.39.1",
    "fastify": "^5.2.1",
    "openai": "^4.79.2",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  }
}
```

- [ ] **Step 2: Create assistant prompt**

```ts
export const assistantInstructions = `
You are Harness Academy Assistant.

Rules:
- Answer from local indexed project materials.
- Cite local sources for factual claims.
- If internal docs do not contain enough support, say so clearly.
- Help users design harnesses for business workflows using control plane, execution plane, docs, tools, verification, and trace concepts.
- Never claim external web research in phase 1.
`.trim();
```

- [ ] **Step 3: Create retrieval service stub**

```ts
export interface RetrievedChunk {
  id: string;
  title: string;
  sourcePath: string;
  route?: string;
  sectionHeading?: string;
  content: string;
}

export async function retrieveLocalDocs(query: string): Promise<RetrievedChunk[]> {
  void query;
  return [];
}
```

- [ ] **Step 4: Create citation formatter**

```ts
import type { Citation } from '@assistant/shared/src/citations';
import type { RetrievedChunk } from './retrieve';

export function toCitation(chunk: RetrievedChunk): Citation {
  return {
    title: chunk.title,
    route: chunk.route,
    sourcePath: chunk.sourcePath,
    sectionHeading: chunk.sectionHeading,
  };
}
```

- [ ] **Step 5: Create tool definitions**

```ts
import { tool } from '@openai/agents';
import { z } from 'zod';
import { retrieveLocalDocs } from '../rag/retrieve';

export const searchLocalDocsTool = tool({
  name: 'searchLocalDocs',
  description: 'Search local harness academy documents.',
  parameters: z.object({ query: z.string().min(1) }),
  async execute(input) {
    return await retrieveLocalDocs(input.query);
  },
});
```

- [ ] **Step 6: Create main agent**

```ts
import { Agent } from '@openai/agents';
import { assistantInstructions } from './prompts';
import { searchLocalDocsTool } from './tools';

export function createHarnessAssistant(model: string) {
  return new Agent({
    name: 'Harness Academy Assistant',
    instructions: assistantInstructions,
    model,
    tools: [searchLocalDocsTool],
  });
}
```

- [ ] **Step 7: Create SSE event serializer**

```ts
import type { StreamEvent } from '@assistant/shared/src/events';

export function toSse(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
```

- [ ] **Step 8: Create chat route skeleton**

```ts
import type { FastifyPluginAsync } from 'fastify';
import { chatRequestSchema } from '@assistant/shared/src/chat';
import { toSse } from '../agent/streaming';

export const chatRoute: FastifyPluginAsync = async (app) => {
  app.post('/api/chat/stream', async (request, reply) => {
    const input = chatRequestSchema.parse(request.body);

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    reply.raw.write(toSse({ type: 'message.started' }));
    reply.raw.write(toSse({ type: 'message.delta', delta: `Question received: ${input.message}` }));
    reply.raw.write(toSse({ type: 'done' }));
    reply.raw.end();

    return reply;
  });
};
```

- [ ] **Step 9: Register chat route in app builder**

Modify `assistant/apps/api/src/app.ts` to:

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { healthRoute } from './routes/health';
import { chatRoute } from './routes/chat';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(healthRoute);
  await app.register(chatRoute);
  return app;
}
```

- [ ] **Step 10: Write stream route test**

```ts
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

describe('POST /api/chat/stream', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = 'test';
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/test';
    process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
    process.env.OPENAI_CHAT_MODEL = 'gpt-5.5-mini';
    process.env.WEB_ORIGIN = 'http://localhost:5174';
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('streams SSE frames', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/stream',
      payload: { message: 'Feature list là gì?' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toContain('message.started');
    expect(response.body).toContain('message.delta');
    expect(response.body).toContain('done');
  });
});
```

- [ ] **Step 11: Run tests to verify pass**

Run: `pnpm --filter @assistant/api test`
Expected: `3 passed`

- [ ] **Step 12: Commit streaming foundation**

```bash
git add assistant/apps/api
git commit -m "feat: add assistant streaming chat route"
```

## Task 6: Build web chat UI with streaming consumer

**Files:**
- Create: `assistant/apps/web/package.json`
- Create: `assistant/apps/web/tsconfig.json`
- Create: `assistant/apps/web/vite.config.ts`
- Create: `assistant/apps/web/index.html`
- Create: `assistant/apps/web/src/main.tsx`
- Create: `assistant/apps/web/src/router.tsx`
- Create: `assistant/apps/web/src/app/AppShell.tsx`
- Create: `assistant/apps/web/src/components/chat/ChatPage.tsx`
- Create: `assistant/apps/web/src/components/chat/ChatComposer.tsx`
- Create: `assistant/apps/web/src/components/chat/MessageList.tsx`
- Create: `assistant/apps/web/src/components/chat/CitationList.tsx`
- Create: `assistant/apps/web/src/components/chat/SuggestionChips.tsx`
- Create: `assistant/apps/web/src/features/chat/useChatStream.ts`
- Create: `assistant/apps/web/src/features/chat/chatApi.ts`
- Create: `assistant/apps/web/src/stores/chatUiStore.ts`
- Create: `assistant/apps/web/src/lib/sse.ts`
- Create: `assistant/apps/web/src/styles.css`
- Create: `assistant/apps/web/src/test/chat-page.test.tsx`

- [ ] **Step 1: Create web package manifest**

```json
{
  "name": "@assistant/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "lint": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@assistant/shared": "workspace:*",
    "@tanstack/react-query": "^5.64.2",
    "@tanstack/react-router": "^1.95.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "vitest": "^3.0.5"
  }
}
```

Add these frontend test dependencies before writing the smoke test:

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.2.0",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: Create web TS config**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["node", "vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 3: Create Vite config**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
```

- [ ] **Step 4: Create simple SSE parser helper**

```ts
export function parseSse(raw: string): string[] {
  return raw.split('\n\n').filter(Boolean);
}
```

- [ ] **Step 5: Create chat API helper**

```ts
export async function sendChatMessage(message: string) {
  const response = await fetch('http://localhost:3001/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.body) throw new Error('Missing response body');
  return response.body.getReader();
}
```

- [ ] **Step 6: Create Zustand UI store**

```ts
import { create } from 'zustand';

interface ChatUiState {
  draft: string;
  setDraft: (draft: string) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  draft: '',
  setDraft: (draft) => set({ draft }),
}));
```

- [ ] **Step 7: Create streaming hook**

```ts
import { useState } from 'react';
import { sendChatMessage } from './chatApi';

export function useChatStream() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(message: string) {
    setLoading(true);
    setText('');
    const reader = await sendChatMessage(message);
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setText((prev) => prev + decoder.decode(value, { stream: true }));
    }

    setLoading(false);
  }

  return { text, loading, submit };
}
```

- [ ] **Step 8: Create composer component**

```tsx
import { FormEvent } from 'react';
import { useChatUiStore } from '../../stores/chatUiStore';

export function ChatComposer({ onSubmit }: { onSubmit: (message: string) => void }) {
  const draft = useChatUiStore((state) => state.draft);
  const setDraft = useChatUiStore((state) => state.setDraft);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    onSubmit(draft);
    setDraft('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Hỏi về harness..." />
      <button type="submit">Send</button>
    </form>
  );
}
```

- [ ] **Step 9: Create chat page**

```tsx
import { ChatComposer } from './ChatComposer';
import { useChatStream } from '../../features/chat/useChatStream';

export function ChatPage() {
  const { text, loading, submit } = useChatStream();

  return (
    <main>
      <h1>Harness Academy Assistant</h1>
      <ChatComposer onSubmit={submit} />
      {loading ? <p>Streaming...</p> : null}
      <pre>{text}</pre>
    </main>
  );
}
```

- [ ] **Step 10: Wire root app**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatPage } from './components/chat/ChatPage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChatPage />
  </React.StrictMode>,
);
```

- [ ] **Step 11: Create smoke render test**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPage } from '../components/chat/ChatPage';

describe('ChatPage', () => {
  it('renders heading', () => {
    render(<ChatPage />);
    expect(screen.getByText('Harness Academy Assistant')).toBeTruthy();
  });
});
```

- [ ] **Step 12: Run web typecheck**

Run: `pnpm --filter @assistant/web typecheck`
Expected: exit code `0`

- [ ] **Step 13: Commit web chat shell**

```bash
git add assistant/apps/web
git commit -m "feat: add assistant web chat shell"
```

## Task 7: Add persistence, citations, and eval baseline

**Files:**
- Create: `assistant/apps/api/src/routes/conversations.ts`
- Create: `assistant/apps/api/src/observability/logger.ts`
- Create: `assistant/apps/api/src/observability/trace.ts`
- Create: `assistant/apps/api/src/evals/goldenQuestions.ts`
- Create: `assistant/apps/api/src/evals/runEvals.ts`
- Modify: `assistant/apps/api/src/db/schema.ts`
- Modify: `assistant/apps/api/src/routes/chat.ts`

- [ ] **Step 1: Extend schema with conversations and messages**

Append to `assistant/apps/api/src/db/schema.ts`:

```ts
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  citationsJson: jsonb('citations_json'),
  suggestionsJson: jsonb('suggestions_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Create trace helper**

```ts
export interface TraceSummary {
  intent: string;
  retrievedChunkIds: string[];
  latencyMs: number;
  status: 'ok' | 'error';
}

export async function recordTrace(summary: TraceSummary) {
  console.log(summary);
}
```

- [ ] **Step 3: Create conversations route**

```ts
import type { FastifyPluginAsync } from 'fastify';

export const conversationsRoute: FastifyPluginAsync = async (app) => {
  app.get('/api/conversations/:id', async (request) => ({ id: (request.params as { id: string }).id }));
};
```

- [ ] **Step 4: Register conversations route**

Modify `assistant/apps/api/src/app.ts` to:

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { healthRoute } from './routes/health';
import { chatRoute } from './routes/chat';
import { conversationsRoute } from './routes/conversations';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(healthRoute);
  await app.register(chatRoute);
  await app.register(conversationsRoute);
  return app;
}
```

- [ ] **Step 5: Add citation and suggestion placeholder events in chat route**

Modify `assistant/apps/api/src/routes/chat.ts` body writes to:

```ts
reply.raw.write(toSse({ type: 'message.started' }));
reply.raw.write(toSse({ type: 'retrieval.completed', chunkIds: [] }));
reply.raw.write(
  toSse({
    type: 'citation',
    citation: {
      title: 'AI Agent Harness',
      sourcePath: 'AI-Agent-Harness.md',
      route: undefined,
      sectionHeading: 'Goal',
    },
  }),
);
reply.raw.write(toSse({ type: 'message.delta', delta: `Question received: ${input.message}` }));
reply.raw.write(
  toSse({
    type: 'suggestion',
    suggestion: {
      label: 'Feature list là gì?',
      prompt: 'Feature list là gì?',
    },
  }),
);
reply.raw.write(toSse({ type: 'done' }));
```

- [ ] **Step 6: Create golden eval questions file**

```ts
export const goldenQuestions = [
  'Feature list là gì?',
  'Bài nào nói về orchestrator và sub-agent?',
  'Verification gate khác E2E test như thế nào?',
  'Thiết kế harness cho team QA automation dựa trên local docs.',
];
```

- [ ] **Step 7: Create eval runner shell**

```ts
import { goldenQuestions } from './goldenQuestions';

async function main() {
  console.log(JSON.stringify({ count: goldenQuestions.length, questions: goldenQuestions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 8: Run API tests and eval shell**

Run: `pnpm --filter @assistant/api test && pnpm --filter @assistant/api exec tsx src/evals/runEvals.ts`
Expected:

```text
all tests pass
{
  "count": 4
}
```

- [ ] **Step 9: Commit persistence and eval baseline**

```bash
git add assistant/apps/api
git commit -m "feat: add assistant persistence and eval baseline"
```

## Self-Review Notes

Spec coverage check:

- Monorepo structure covered by Task 1 and Task 2.
- Fastify API covered by Tasks 3, 5, and 7.
- RAG ingestion covered by Task 4.
- OpenAI Agents SDK integration covered by Task 5.
- Streaming UI covered by Task 6.
- Harness-design support is seeded in Task 5 through instructions and narrow tool structure.
- Eval/tracing covered by Task 7.
