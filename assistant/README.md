# Harness Academy Assistant

Single-orchestrator agent harness that answers harness-engineering questions **only from the
local doc corpus**, grounded with provenance citations, over a custom OpenAI-compatible LLM
router. Turborepo monorepo: `apps/api` (Fastify + agent), `apps/web` (React chat UI + embeddable
widget), `packages/shared` (Zod contracts).

Architecture & request flow: see [AGENTS.md](./AGENTS.md).

## Streaming request flow

```text
[ apps/web ]
  Chat composer
    -> useChatStream.tsx
    -> chatApi.ts
    -> POST /api/chat/stream
    -> SSE reducer (lib/sse.ts + agentEvent.ts)

         |
         v

[ apps/api/src/routes/chat.ts ]
  validate chatRequestSchema
    -> resolveConversation()
    -> getHistoryTurns()
    -> appendMessage(user)
    -> createAssistantContext()
    -> streamAssistant(message, { history, context })
    -> appendMessage(assistant)
    -> insertTrace(buildTraceSummary(...))

         |
         v

[ apps/api/src/agent/streaming.ts ]
  checkInput(message)
    -> buildAgentInput(history, message)
    -> run(assistant.orchestrator, input, { context, stream: true, maxTurns: 8 })
    -> mapStreamEvent(...) -> SSE events
    -> buildCitations(context.reads)
    -> buildSuggestions(citations)
    -> done

         |
         v

[ apps/api/src/agent/harnessAssistant.ts ]
  Agent<AssistantContext>("HarnessOrchestrator")
    -> system prompt from prompts.ts
    -> input guardrail from guardrails.ts
    -> tools:
       - list_docs
       - grep_docs
       - read_doc_section
       - harness_blueprint (mode-gated)

         |
         v

[ apps/api/src/agent/tools.ts ]
  list_docs
    -> TOC only: docId, title, route, contentType, headings
  grep_docs
    -> expandQuery(pattern) -> grepDocsMulti(...)
  read_doc_section
    -> exact section text
    -> records section into context.reads for citation provenance

         |
         v

[ apps/api/src/agent/runtime.ts + apps/api/src/docs/* ]
  getIndex()
    -> buildDocIndex(DOCS_ROOT) once
    -> keep parsed allowlisted corpus in memory
  search.ts
    -> ranked grep over parsed sections
    -> exact section lookup by docId + heading

         |
         v

[ apps/api/src/agent/llm.ts ]
  routerClient
    -> OpenAI-compatible router (Chat Completions)
    -> used by @openai/agents orchestrator
```

Notes:

- `list_docs` does **not** return full markdown bodies. It returns TOC metadata plus heading outlines.
- Full text enters model context only through `read_doc_section`, and only for sections the agent explicitly opens.
- Citations are derived from `context.reads`, so only actually-read sections can be cited.

---

## Prerequisites

- Node.js 22+
- pnpm 10.12.4 (`corepack enable`)
- Docker (Postgres + production image)
- A reachable Postgres 16/17 instance

---

## 1. Setup

```bash
pnpm install
cp .env.example .env      # then fill in the values (see table below)
```

### Environment variables

| Var | Required | Default | Used by | Purpose |
|-----|----------|---------|---------|---------|
| `LLM_API_KEY` | ✅ | — | api | Router API key |
| `LLM_BASE_URL` | | `` | api | OpenAI-compatible router base URL |
| `OPENAI_CHAT_MODEL` | | `` | api | Chat model id |
| `DATABASE_URL` | ✅ | `postgres://postgres:postgres@localhost:5432/harness_assistant` | api | Postgres connection |
| `DOCS_ROOT` | | repo root | api | Where the indexable corpus lives (set to `/app/corpus` in the image) |
| `PORT` | | `3001` (local) / `5001` (compose) | api | HTTP port |
| `WEB_ORIGINS` | ✅ (prod) | `http://localhost:5173,http://localhost:5174` | api | CORS allowlist (comma-separated). The academy site origin must be listed |
| `VITE_API_BASE_URL` | | `http://localhost:3001` | web | API URL baked into the standalone web app |
| `VITE_ACADEMY_BASE_URL` | | `http://localhost:5173` | web | Academy base for citation links |

> The `.env` file holds secrets and is gitignored / excluded from the deploy zip. On the VM,
> create it from `.env.example`.

---

## 2. Local development

Start Postgres (local), run migrations, then the dev servers:

```bash
# Postgres for local dev (maps host 5432 → container 5432; matches .env.example)
docker run -d --name harness-pg -p 5432:5432 \
  -e POSTGRES_USER={USER} -e POSTGRES_PASSWORD={PASSWORD} \
  -e POSTGRES_DB=harness_assistant pgvector/pgvector:pg17

pnpm db:migrate            # apply Drizzle migrations
pnpm dev                   # turbo --parallel: api (:3001) + web (:5174)
```

Other commands:

```bash
pnpm typecheck             # tsc across all packages
pnpm test                  # vitest (api + web)
pnpm lint                  # typecheck-only lint
pnpm eval                  # live LLM-judge eval against the golden set (needs .env)
pnpm db:generate           # generate a new Drizzle migration after schema changes
```

---

## 3. Build the embeddable widget (for the academy site)

The chat ships to the academy site as a **single self-contained JS file** (Shadow DOM,
React + chat + Tailwind bundled, ~133 KB gz). It is built from `apps/web`, **separately from the
API** — the API image does not contain it.

```bash
pnpm --filter @assistant/web build:widget
# → apps/web/dist-widget/assistant-widget.js
# → copied to academy/public/assistant-widget.js
```

The academy site lazy-loads `/assistant-widget.js` on "Ask Assistant" and points it at the API
via the `VITE_ASSISTANT_API_URL` env baked into the **academy** build. Re-run `build:widget`
whenever the chat changes, then build/deploy the academy site as usual.

---

## 4. Production deploy (API)

The API deploys as a Docker image. It runs from TypeScript source via `tsx` (the monorepo is
typecheck-only, no JS emit) and bundles the docs corpus into the image.

### 4.1 Package the deploy zip (local)

```bash
pnpm package:zip
# runs sync:corpus (copies repo-root corpus → assistant/corpus/) then zips →
# assistant-harness.zip   (excludes node_modules, dist, and .env secrets)
```

### 4.2 On the VM

```bash
rm -r assistant-harness
unzip assistant-harness.zip -d assistant-harness && cd assistant-harness
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production run --rm app pnpm --filter @assistant/api db:migrate  
docker compose logs -f app
```

### 4.3 Deploy notes

- **Postgres** is expected to already run on the VM host. Point `DATABASE_URL` at it through
  `host.docker.internal` (resolved by `extra_hosts` in the compose file), e.g.
  `postgres://user:pass@host.docker.internal:5432/harness_assistant`. Create the
  `harness_assistant` database first.
- **CORS**: set `WEB_ORIGINS` (comma-separated) to include the **browser origin of the academy
  site**, otherwise the embedded widget's requests are blocked by the browser.
- **Corpus**: bundled into the image at `/app/corpus` (via `pnpm sync:corpus`, which runs inside
  `package:zip`). `DOCS_ROOT=/app/corpus` is set in the image. Re-package to refresh content.
- **Port**: `PORT` (compose default `5001`) maps host→container 1:1.
- The image is API-only; the chat UI is the academy-embedded widget (Section 3), hosted with the
  academy site.

---

## Project layout

```
assistant/
├─ apps/api/            Fastify API + agent harness (orchestrator, docs tools, guardrails, SSE)
├─ apps/web/            React chat UI + src/widget/ (embeddable widget build)
├─ packages/shared/     Zod contracts shared by api + web
├─ scripts/
│  ├─ sync-corpus.mjs   Copies the repo-root docs corpus into assistant/corpus/ for bundling
│  └─ package-deploy.mjs Builds assistant-harness.zip (secret-free)
├─ Dockerfile           API image (tsx runtime, bundled corpus)
├─ docker-compose.yml   Production deploy (app only; external host Postgres)
└─ corpus/              Generated by sync:corpus (gitignored)
```
