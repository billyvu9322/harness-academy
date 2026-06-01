# Assistant Agent Harness — Backend Design & Flow

Date: 2026-06-01

Status: design note (pre-implementation) for `assistant/apps/api`

Scope: backend Agent Harness only. Frontend (`apps/web`) covered by the existing
implementation plan + UI design doc — not repeated here.

Related docs:

- `docs/superpowers/specs/2026-05-31-harness-academy-assistant-design.md` (product + RAG + data model)
- `docs/superpowers/plans/2026-05-31-harness-academy-assistant-implementation.md` (file map + phases)

This note adds the **OpenAI Agents SDK** runtime design that those two docs deferred:
agent topology, orchestration, guardrails, sessions, streaming, tracing, eval, and the
wiring to the custom LLM router.

---

## 0. Goal & Constraints

Build a single-orchestrator agent harness inside [`assistant/apps/api`](../../../assistant/apps/api)
using `@openai/agents` (TypeScript). Phase 1 = local-doc-only access (agentic grep+read,
no vector RAG — see §5), one orchestrator, specialists wired as tools. Built to scale to
handoffs without rework.

Hard constraints from the request:

1. LLM goes through an **OpenAI-compatible router**, not real OpenAI:
   - `BASE_URL = https://9router.nimo.io.vn/v1`
   - `API_KEY` = router key (loaded from env, never committed)
2. Every request must send `defaultHeaders` with
   `User-Agent: AssistantHarnessBot/0.1 personal research`.
3. TypeScript-first, Zod for all schemas, Drizzle/Postgres for state.

> Security: the router API key was shared in plaintext. It lives in `.env` only
> (gitignored), is read via the env schema, and should be rotated after research use.
> Do not log it; do not print it; do not commit it.

---

## 1. LLM Wiring to the Custom Router

The router is OpenAI-compatible but is **not** the real OpenAI backend. Consequences:

- Use the **Chat Completions** API surface, not the Responses API — a third-party
  router is unlikely to implement Responses. Force it with `setOpenAIAPI('chat_completions')`.
- The **OpenAI tracing exporter must be disabled** — it ships spans to
  `platform.openai.com` authenticated with a real OpenAI key, which the router key is not.
  We replace it with our own DB-backed trace via `AgentHooks` (see §8).
- A **single shared `OpenAI` client** is the one place the `User-Agent` header and base URL
  are set; every agent resolves against it (and any future embedding calls would too).

New file `src/agent/llm.ts`:

```ts
import { OpenAI } from 'openai';
import {
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
} from '@openai/agents';
import { env } from '../config/env';

// Shared client: used by every Agent (via the default client). Sole place the header is set.
export const routerClient = new OpenAI({
  baseURL: env.LLM_BASE_URL,            // https://9router.nimo.io.vn/v1
  apiKey: env.LLM_API_KEY,              // sk-... (from .env only)
  defaultHeaders: {
    'User-Agent': 'AssistantHarnessBot/0.1 personal research',
  },
});

// Call once at process boot, before any Agent is constructed/run.
export function initLlm(): void {
  setDefaultOpenAIClient(routerClient); // all Agents resolve against this client
  setOpenAIAPI('chat_completions');     // router is Chat Completions compatible, not Responses
  setTracingDisabled(true);             // no OpenAI trace export; we use AgentHooks -> Postgres
}
```

`initLlm()` is invoked at the top of [`app.ts`](../../../assistant/apps/api/src/app.ts) before
routes register. Agents then only set `model: env.OPENAI_CHAT_MODEL` (a plain string) and the
default client resolves it.

Env schema additions in [`config/env.ts`](../../../assistant/apps/api/src/config/env.ts):

```ts
LLM_BASE_URL: z.string().url().default('https://9router.nimo.io.vn/v1'),
LLM_API_KEY:  z.string().min(1),            // required, no default — fail fast if missing
OPENAI_CHAT_MODEL: z.string().min(1).default('gpt-5.5-mini'),
OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
```

Keep the existing `OPENAI_API_KEY` as a deprecated alias only if other code reads it;
new code uses `LLM_API_KEY`.

> Header caveat: Node's undici sets its own `User-Agent`. The OpenAI SDK `defaultHeaders`
> overrides per-request. Verify with a smoke call (see §11 step 1) — some proxies strip or
> rewrite `User-Agent`. If `9router` rejects an overridden UA, fall back to a custom header
> name agreed with the router operator.

### Embeddings — not used in phase 1

B0 confirmed the router exposes **no embedding model** (`No credentials for provider: openai`).
Phase 1 therefore uses **agentic lexical docs access, not vector RAG** (see §5). `OPENAI_EMBEDDING_MODEL`
stays in the env schema as a reserved knob but is unused; the `document_embeddings` /
`vector(1536)` schema is dormant until a vector layer is added later with a real embedding source.

---

## 2. Agent Topology — How Many Agents

The product spec mandates **phase-1 = one orchestrating agent** (narrow docs access, easier eval/debug).
The full harness vision wants specialists. We reconcile by building the orchestrator now and
wiring specialists as **agents-as-tools** — deterministic, easy to eval, no premature handoff
graph. Phase 2 promotes them to **handoffs** once eval evidence justifies it.

| # | Agent | Responsibility | Phase-1 wiring |
|---|-------|----------------|----------------|
| 1 | **HarnessOrchestrator** | Entry point. Triage intent, drive tool loop, compose final grounded answer. | Root `run()` target |
| 2 | **LessonGuide** | Explain academy concepts in Vietnamese, preserve technical terms. | Agent-as-tool → handoff (P2) |
| 3 | **HarnessDesigner** | Produce structured harness blueprint for a business workflow. | Agent-as-tool (`outputType`) → handoff (P2) |
| 4 | **SuggestionWriter** | Generate next-prompt chips. | Agent-as-tool (`outputType`) |

Retrieval is **a tool, not an agent** — it needs no LLM judgment of its own.

So: **1 orchestrator + 3 specialist agents + N function tools**.

```
                          ┌──────────────────────────┐
   user msg ──▶ INPUT ───▶│    HarnessOrchestrator     │──▶ OUTPUT ──▶ SSE stream
              guardrails   │   (triage + compose ans)   │  guardrails
                          └─────────────┬──────────────┘
        agent loop: tool_calls | (later: handoff) | final_output
        ┌───────────────┬─────────────┴──────┬───────────────┐
        ▼               ▼                     ▼               ▼
  list_docs          LessonGuide        HarnessDesigner  SuggestionWriter
  grep_docs           (as tool)          (as tool,        (as tool,
  read_doc_section                        outputType)      outputType)
  draft_blueprint
  (docs + function tools)
```

Why agents-as-tools first, not handoffs:

- Local-doc-only access is narrow enough for one driver.
- Tool calls keep control with the orchestrator → deterministic transcripts → simpler eval.
- Fewer moving parts → cheaper to debug the router integration.

Promotion criterion to handoffs: eval shows the orchestrator mis-routing or the blueprint
flow needing multi-turn autonomy the tool boundary can't express.

---

## 3. Function Tools

`src/agent/tools.ts` — narrow business tools only. **No raw filesystem, no shell** exposed to
end users — docs access is mediated by a hard allowlist (harness safety rule). All tools return
deterministic, Zod-validated shapes.

Docs access is **agentic, not vector-RAG** (decision §5): the router has no embedding model and
the corpus is small (~52K tokens), so the agent investigates the docs on demand via grep + read
over an allowlisted index, the way Claude Code reads a repo.

```ts
import { tool } from '@openai/agents';
import { z } from 'zod';
import { listDocs, grepDocs, readDocSection } from '../docs';

// 1) TOC routing — cheap heading map so the agent can pick where to look.
export const listDocsTool = tool({
  name: 'list_docs',
  description: 'List indexed docs (title, route, content type) and their heading outline.',
  parameters: z.object({
    contentTypes: z
      .array(z.enum(['lecture', 'project', 'skill', 'reference', 'core_doc', 'template_doc']))
      .optional(),
  }),
  execute: async ({ contentTypes }) => listDocs(contentTypes),
});

// 2) Lexical search — ripgrep/regex over allowlisted markdown, returns matches + locations.
export const grepDocsTool = tool({
  name: 'grep_docs',
  description: 'Case-insensitive regex/keyword search over allowlisted markdown. Returns matching lines with docId, heading, and route. Issue several keyword variants (VN + EN) for recall.',
  parameters: z.object({
    pattern: z.string(),
    contentTypes: z
      .array(z.enum(['lecture', 'project', 'skill', 'reference', 'core_doc', 'template_doc']))
      .optional(),
    maxMatches: z.number().int().min(1).max(40).default(20),
  }),
  execute: async ({ pattern, contentTypes, maxMatches }) =>
    grepDocs(pattern, { contentTypes, maxMatches }),
});

// 3) Read — exact text of one doc section (by docId + heading) for grounding + citation.
export const readDocSectionTool = tool({
  name: 'read_doc_section',
  description: 'Return the exact text + metadata of one doc section (citation anchor).',
  parameters: z.object({
    docId: z.string(),
    heading: z.string().optional(), // omit → whole doc (only if small)
  }),
  execute: async ({ docId, heading }) => readDocSection(docId, heading),
});

export const draftHarnessBlueprint = tool({
  name: 'draft_harness_blueprint',
  description: 'Turn business workflow inputs into a structured harness outline.',
  parameters: z.object({
    domain: z.string(),
    teamSize: z.number().int().optional(),
    workflow: z.string(),
    riskNotes: z.string().optional(),
  }),
  execute: async (input) => /* delegate to HarnessDesigner agent-as-tool, return blueprint */,
});
```

`suggestNextLessons` is the SuggestionWriter agent exposed via `.asTool(...)`.

Typical loop: `list_docs` (orient) → `grep_docs` (find candidate sections, several keyword
variants) → `read_doc_section` (pull exact text to ground + cite). Citations are built from the
section metadata returned by `read_doc_section`.

Tool-design rules: modular, single-purpose, structured output, no broad capability.

---

## 4. Guardrails — Three Layers

`src/agent/guardrails.ts`. Two SDK-level guardrail sets + one tool-internal layer.

### Input guardrails (`inputGuardrails`, tripwire → `InputGuardrailTripwireTriggered`)

- Length cap (Zod `chatRequestSchema` already enforces `max(4000)`) and empty/whitespace reject.
- Prompt-injection / system-override detection: cheap regex pass (e.g. "ignore previous
  instructions", "system:") + a small LLM classifier for the ambiguous cases.
- Off-topic / unsupported classifier: tag for safe redirect ("internal materials don't
  cover this") instead of hallucinating.

### Tool & docs-access guardrails (enforced inside tool `execute`, not as SDK guardrails)

- **Source allowlist**: `grep_docs` / `read_doc_section` operate ONLY over the fixed source set
  (`academy/content/**`, `AI-Agent-Harness.md`, `docs/*.md`, the four template docs). No raw path
  input reaches the filesystem — tools take a `docId` resolved against the in-memory `DocIndex`,
  never an arbitrary path (blocks path traversal). Never index `.playwright-mcp/`.
- **Sanitize returned text**: strip instruction-like lines from section content before
  passing it to the model as authority — defends against prompt-injection-via-docs.
- **Result size cap**: bound `maxMatches` and total returned section bytes per call so a single
  tool call can't flood the context.

### Output guardrails (`outputGuardrails`, tripwire → `OutputGuardrailTripwireTriggered`)

- Factual answer grounded in local docs ⇒ **at least one citation**, else trip.
- Low retrieval confidence ⇒ require explicit uncertainty phrasing.
- **Forbid external-source claims** (phase 1 bans web fallback).
- Suggestions list length capped; final answer validated against the Zod `outputType` shape.

---

## 5. Docs Access — Agentic (No Embeddings)

**Decision (2026-06-01):** phase 1 uses **agentic lexical retrieval**, not vector RAG.

Why:

- The `9router` LLM endpoint has **no embedding model** (B0 finding, §14). Vector RAG would
  need a separate embedding credential or a local model — extra moving parts.
- The corpus is small — **~52K tokens** total (16 lectures + projects + skills + references +
  `docs/*.md` + `AI-Agent-Harness.md` + four template docs). Easily within `cx/gpt-5.5` context.
- Agentic grep+read matches the harness philosophy: the agent investigates docs through narrow
  tools, the way Claude Code reads a repo. No embeddings, no pgvector, no ingest-time cost.

### Index build (boot-time, in-memory)

```
sources allowlist (docs/sources.ts)
  -> parseMarkdown (frontmatter + heading tree)
  -> build DocIndex: per doc { docId, title, route, contentType, sourcePath,
                               sections: [{ heading, text, lineRange }] }
  -> hold in memory; optionally persist `document_sources` for routing/citation only
```

No chunking-for-embeddings, no `document_embeddings`, no vector column in phase 1. The
`DocIndex` is cheap to rebuild on boot (corpus is small) and on a `reindex` call.

### Per-turn access (inside the agent loop, via tools)

```
agent issues, as needed:
  list_docs        -> TOC: titles + heading outlines (orient / route)
  grep_docs        -> regex/keyword over allowlisted markdown (several VN+EN variants)
  read_doc_section -> exact section text + metadata (ground + citation anchor)
```

Retrieval is **in-loop**, not a fixed pre-step: the orchestrator decides what to grep/read and
can iterate. `maxTurns` bounds it. Priority ordering (academy lesson/project/skill >
`AI-Agent-Harness.md` > `docs/*.md` > template docs) is encoded in `grep_docs` result ranking
and in the orchestrator instructions.

### Trade-off vs vector RAG

Weaker recall when a Vietnamese query shares no keywords with the source text. Mitigations:
`list_docs` TOC so the agent sees topics by title; instruct the agent to grep multiple keyword
variants (VN + EN technical terms — see §16 cross-lingual); fall back to reading a whole small
doc when grep misses. If eval shows recall gaps, add a vector layer later (the index already
carries section text — only an embedding source + column would be added).

---

## 6. Sessions (Multi-Turn Memory)

SDK `MemorySession` is in-memory only — lost on restart. Wrap it with a Postgres-backed
store so conversations are durable.

`src/agent/session.ts`:

- On turn start: load prior `messages` rows for `conversationId`, seed a `MemorySession`.
- On turn end: persist user + assistant turn, plus `citations_json`, `suggestions_json`,
  and `trace_id` (per the `messages` table in the data model).

Pattern: **Sessions + custom SessionStore**. `conversationId` is the session key.

---

## 7. Streaming — SDK Events → Typed SSE

The frontend never parses raw model output. The backend maps SDK run-stream items to the
shared typed event union in
[`shared/src/events.ts`](../../../assistant/packages/shared/src/events.ts).

`src/agent/streaming.ts`:

```ts
const stream = await run(orchestrator, input, { stream: true, maxTurns: 8 });
for await (const ev of stream) {
  // text delta       -> { type: 'message.delta', delta }
  // tool start/end   -> { type: 'tool.started' | 'tool.completed', ... }   (schema addition)
  //   (grep_docs / read_doc_section surface here as tool events)
  // citation         -> { type: 'citation', citation }
  // suggestion       -> { type: 'suggestion', suggestion }
}
// after loop: { type: 'done' } + persist
```

Transport: **SSE over Fastify**. Fill [`routes/chat.ts`](../../../assistant/apps/api/src/routes/chat.ts)
(currently a 501 stub): set `Content-Type: text/event-stream`, write each event via
`serializeSseEvent(...)` from
[`rag/placeholder.ts`](../../../assistant/apps/api/src/rag/placeholder.ts) (already implemented),
`reply.raw.write(...)`, flush, and end on `done`.

Schema additions needed in `shared/events.ts`: `message.completed`, `tool.started`,
`tool.completed`, `trace`. Existing variants (`message.started`, `message.delta`,
`retrieval.completed`, `citation`, `assistant_message.related`, `suggestion`, `error`,
`done`) stay.

---

## 8. Observability / Tracing

The OpenAI trace exporter is disabled (§1) because the router isn't OpenAI's backend.
Replace it with **`AgentHooks`** writing to the `chat_traces` table.

`src/observability/trace.ts` — hook lifecycle:

- `onStart`: record start time, intent class.
- `onToolStart` / `onToolEnd`: accumulate `tool_calls_json`, capture which docs/sections were
  grepped and read (docIds + headings).
- `onEnd`: write the row — `intent`, `accessed_docs_json` (docId + heading list),
  `tool_calls_json`, `latency_ms`, `status`, `error_summary`, `citation_count`.

Pattern: **HarnessHooks (centralized observability)**. Dev mode may additionally attach
`BatchTraceProcessor(new ConsoleSpanExporter())` for live span inspection — that processor
does not call OpenAI, so it is safe with the router.

Every chat turn leaves a trace summary: intent, docs/sections accessed, tools called, duration,
error, citation count.

---

## 9. Eval

`src/evals/goldenQuestions.ts` + `runEvals.ts`. Run the orchestrator over a small golden
Vietnamese-question suite. Per case assert:

- answer grounded in local docs,
- citation count > 0,
- no unsupported external claim,
- useful next suggestions.

Grounding + usefulness scored by an **LLM-judge agent** (also via the router); citation count
and external-claim checks are deterministic. Command: `pnpm --filter @assistant/api eval`.

Seed cases (from spec): `Feature list là gì?`, `Bài nào nói về orchestrator và sub-agent?`,
`Verification gate khác E2E test như thế nào?`, `Thiết kế harness cho team QA automation
dựa trên local docs.`

---

## 10. Error Handling

Wrap every `run()` in try/catch and branch per SDK error class:

| Error | Handling |
|-------|----------|
| `MaxTurnsExceededError` | emit `error` SSE "agent hit turn limit", trace status=error |
| `InputGuardrailTripwireTriggered` | emit safe-refusal/redirect message |
| `OutputGuardrailTripwireTriggered` | regenerate once, else refuse with uncertainty notice |
| `ModelRefusalError` | surface refusal cleanly |
| `ModelBehaviorError` | log router/model anomaly, generic error to user |
| unknown | rethrow after persisting trace |

The stream always terminates with a `done` (or `error`) event so the UI never hangs.

---

## 11. End-to-End Turn Flow

```
POST /api/chat/stream { conversationId, message, mode }
  └─ Fastify Zod-validate (chatRequestSchema)
  └─ load/create conversation + MemorySession (Postgres)
  └─ INPUT GUARDRAILS (length / injection / off-topic)
  └─ DocIndex ready in memory (built at boot)
  └─ run(HarnessOrchestrator, msg, { stream: true, maxTurns: 8 })
        loop: docs access IN-LOOP — list_docs / grep_docs / read_doc_section
              | tool_calls (draft_blueprint)
              | agent-as-tool (LessonGuide / HarnessDesigner / SuggestionWriter)
              | final_output
  └─ map SDK events ─▶ SSE (delta / tool / citation / suggestion)
  └─ OUTPUT GUARDRAILS (citations / uncertainty / no-external)
  └─ persist message + citations + suggestions + chat_trace
  └─ emit done
```

---

## 12. Build Order (maps to the scaffold)

1. ✅ DONE — deps `@openai/agents openai` (+ forced **zod v4** workspace-wide); smoke test
   confirmed `cx/gpt-5.5` chat + `User-Agent` header. Embedding gap found → agentic docs (§5).
2. ✅ DONE — [`config/env.ts`](../../../assistant/apps/api/src/config/env.ts) `LLM_BASE_URL`,
   `LLM_API_KEY`, `OPENAI_CHAT_MODEL=cx/gpt-5.5`.
3. ✅ DONE — `agent/llm.ts` router client + `initLlm()` (§1). (Still TODO: call from
   [`app.ts`](../../../assistant/apps/api/src/app.ts).)
4. `docs/` module — `sources.ts` allowlist, `parseMarkdown.ts` (frontmatter + heading tree),
   `index.ts` (`DocIndex` build + `listDocs` / `grepDocs` / `readDocSection`), `citations.ts`.
   **No embed / chunk-for-vector / pgvector.**
5. `agent/tools.ts` (list_docs / grep_docs / read_doc_section / draft_blueprint),
   `agent/prompts.ts`, `agent/guardrails.ts`.
6. `agent/harnessAssistant.ts` — orchestrator + 3 specialists.
7. `agent/session.ts`, `agent/streaming.ts`, `observability/trace.ts` (hooks).
8. Fill [`routes/chat.ts`](../../../assistant/apps/api/src/routes/chat.ts) +
   [`routes/conversations.ts`](../../../assistant/apps/api/src/routes/conversations.ts).
9. Extend [`shared/events.ts`](../../../assistant/packages/shared/src/events.ts)
   (`tool.*`, `message.completed`, `trace`).
10. `evals/` + tests (parseMarkdown, grepDocs, route validation, stream round-trip).

Smallest verifiable first slice (steps 1–3) is done — router connectivity + `User-Agent`
proven before any agent graph exists.

---

## 13. Patterns Summary

| Concern | OpenAI Agents SDK pattern |
|---------|---------------------------|
| Topology | Agents-as-tools (P1) → Triage + Handoffs (P2) |
| Docs access | Agentic lexical (list_docs / grep_docs / read_doc_section) — **no embeddings/vector RAG** in P1 |
| Tools | `tool()` + Zod params, deterministic structured output |
| Guardrails | `inputGuardrails` / `outputGuardrails` tripwire + tool-internal allowlist |
| Memory | `MemorySession` + custom Postgres SessionStore |
| Streaming | `run(..., { stream: true })` → typed SSE adapter |
| Structured output | `outputType` (Zod) on HarnessDesigner / SuggestionWriter |
| Observability | `AgentHooks` → `chat_traces` (OpenAI exporter OFF) |
| Eval | golden set + LLM-judge agent |
| Custom LLM | `setDefaultOpenAIClient` + `setOpenAIAPI('chat_completions')` + `setTracingDisabled` + `defaultHeaders` |

---

## 14. Open Questions

Resolved by the B0 smoke test (2026-06-01):

- ✅ `9router` accepts the overridden `User-Agent` — chat completion succeeded through the
  Agents SDK client with the header set.
- ✅ Model ids are `cx/`-prefixed (34 models via `GET /v1/models`, all gpt-5.x / codex chat).
  Default chat model = **`cx/gpt-5.5`** (router echoes back `gpt-5.5`). No `-mini` general chat;
  `cx/gpt-5-codex-mini` exists if a cheaper tier is wanted.
- ❌ **Router exposes NO embedding model** — `embeddings.create` returns
  `400 No credentials for provider: openai`. Resolved by switching phase 1 to agentic lexical
  docs access (no embeddings). See "Embedding source decision — RESOLVED" below + §5.

Still open:

- Does the router support streaming chat completions? If not, fall back to non-stream
  `run()` and synthesize `message.delta` chunks server-side, or use `/api/chat/message`.
  (Resolve at B4.)
- Rate limits / quota on the router for eval batch runs (B7).

### Embedding source decision — RESOLVED (2026-06-01)

The router generates text but not embeddings. Rather than add an embedding credential or a
local model, phase 1 **drops vector RAG** and uses **agentic lexical docs access** (§5):
`list_docs` + `grep_docs` + `read_doc_section` over an allowlisted in-memory `DocIndex`.
Justified by the small corpus (~52K tokens) and the harness philosophy (agent investigates docs
like Claude Code reads a repo). No embedding source needed; B1 is unblocked.

A vector layer remains a clean later add (the `DocIndex` already holds section text — only an
embedding source + the dormant `document_embeddings` column would be wired) if eval shows recall
gaps on free-form Vietnamese queries.

---

## 15. Implementation Phases (Backend + UI Integration)

Backend is currently 501 stubs; `apps/web` is scaffolded but not wired to a real stream.
Each phase ships a runnable verification gate — no big-bang. The non-stream `message`
route is built before the `stream` route on purpose: easier to debug the agent + guardrails
without SSE noise.

This list refines the system-wide phases in
`2026-05-31-harness-academy-assistant-implementation.md`: B0–B2 expand its Phase 3,
B3–B6 its Phase 4, B7 its Phase 7, B8 is new.

### Backend phases

| P | Name | Deliverables (files) | Gate (proof) |
|---|------|----------------------|--------------|
| **B0** ✅ | Router proof | deps `@openai/agents openai` (forced **zod v4** workspace-wide — SDK peer); `config/env.ts` `LLM_BASE_URL`/`LLM_API_KEY`; `agent/llm.ts` `initLlm()`; `agent/smoke.ts` | DONE — chat replies `ROUTER_OK` via SDK + `User-Agent` accepted. Router has no embeddings → switched to agentic docs (§5) |
| **B1** ✅ | Docs index (no embeddings) | `docs/sources.ts` allowlist, `docs/parseMarkdown.ts` (frontmatter + heading tree), `docs/index.ts` (`buildDocIndex`/`listDocs`); vitest added | DONE — TDD, 17 tests green, typecheck clean. Real repo indexes **34 docs** (lecture 16 / project 1 / skill 6 / reference 3 / core_doc 4 / template_doc 4); `listDocs` returns titles + heading outlines + routes |
| **B2** ✅ | Docs access tools | `docs/search.ts` (`grepDocs`/`readDocSection`), `docs/citations.ts` (`toCitation`); `agent/tools.ts` `createDocsTools` (`list_docs`/`grep_docs`/`read_doc_section`) | DONE — TDD, **36 tests** green, typecheck clean. Real-repo grep: VN queries (`verification gate`, `feature list`, `orchestrator`) return correct ranked sections; `read_doc_section` exact text + valid `Citation`; forged docId → `{found:false}` (path-traversal safe). Fixed a CRLF frontmatter-parse bug found via real-repo smoke. |
| **B3** ✅ | Agent core (non-stream) | `agent/prompts.ts`, `guardrails.ts` (checkInput/checkOutput), `context.ts`, `harnessAssistant.ts` (orchestrator + docs tools + guardrails), `runtime.ts` (index singleton), `POST /api/chat/message`; `docs/citations.ts` `buildCitations` | DONE — TDD, **55 tests** green. Live golden Q (`Verification gate khác E2E?`) → grounded VN answer + **6 provenance citations** w/ routes; output guardrail enforces ≥1 citation (counts only sections actually `read_doc_section`-ed). **Specialists (LessonGuide/HarnessDesigner/SuggestionWriter) deferred** — orchestrator + docs tools meet the gate; specialists land with suggestions/streaming (B4) and handoffs (P2). |
| **B4** ✅ | Streaming SSE | `agent/streaming.ts` (`mapStreamEvent` + `buildSuggestions` + `streamAssistant`); filled `routes/chat.ts` SSE (`reply.hijack`); extended `shared/events.ts` (`tool.started`/`tool.completed`/`message.completed`) | DONE — TDD, **65 tests** green. Live SSE (`Feature list là gì?`): HTTP 200 text/event-stream, 211 `message.delta`, 7 `tool.started`/`tool.completed`, 4 `citation`, 1 `suggestion`, `done`. Suggestions deterministic from cited docs (SuggestionWriter-agent still deferred). |
| **B5** ✅ | Persistence + sessions | `db/schema.ts` (conversations/messages; `document_*`/pgvector dropped — agentic), `db/mappers.ts`, `db/repo.ts`, `agent/history.ts` (multi-turn input); persist in `routes/chat.ts`, fill `routes/conversations.ts`; drizzle migration; docker pg on **5433** | DONE — TDD pure pieces (**71 tests**); live: 2-turn convo persists, follow-up uses history, `GET /api/conversations/:id/messages` restores `[user,assistant,user,assistant]`, list shows derived title. conversationId via response body (/message) + `X-Conversation-Id` header (/stream). |
| **B6** ✅ | Observability + feedback loops | `chat_traces`+`user_feedback` tables; `observability/trace.ts` `buildTraceSummary`; `agent/regenerate.ts` `runWithRegenerate` (app-level grounding, SDK output-tripwire removed); context tracks `toolCalls`; `POST /api/messages/:id/feedback`; traces persisted in both chat routes | DONE — TDD (**77 tests**: regenerate loop + trace summary pure). Live: turn → `chat_traces` row (status/cites=5/tools=8/docs=2/latency/regenerated); feedback up recorded, bad vote→400. Regenerate-once: corrective prompt re-run when answer ungrounded (unit-proven). Note: ~28s/turn (8 tool calls on cx/gpt-5.5). |
| **B7** ✅ | Eval | `evals/goldenQuestions.ts` (6 golden Qs + integrity tests), `judge.ts` (`buildJudgePrompt`/`parseJudgeVerdict`), `score.ts` (`scoreQuestion`/`aggregate`/`meetsBaseline`, BASELINE pass≥70% & avg≥3.5), `runEvals.ts` live runner; `pnpm eval` (api + root) | DONE — TDD pure pieces (**24 new tests**, 101 total green, typecheck clean). Live `pnpm eval` vs `cx/gpt-5.5`: **6/6 passed (100%), avg judge 4.83/5**, gate exit 0. Judge calibrated after first run mis-graded good cited answers as "fabrication risk" for extra on-topic detail (judge has no corpus access) → rubric reframed as *minimum* coverage, fabrication defined narrowly. Out-of-corpus FX-rate Q correctly refused (no-cite, judge 5/5). |
| **B9** ✅ | Enriched stream events (timeline) | `shared/events.ts` `tool.started` (+`callId`,`detail?`) & `tool.completed` (+`callId`,`summary?`); `streaming.ts` `buildToolDetail`/`buildToolSummary`/`safeParseArgs` + enriched `mapStreamEvent` (reads `rawItem.callId`+`arguments`, `item.output`) | DONE — TDD (**125 tests**, typecheck clean). Live stream: 6 started / 6 done, **all callId-matched 1:1**; detail = grep pattern (bilingual-expanded) / `docId · heading` / contentTypes; summary = "30 docs" / "10 matches" / "section: …". Payloads small (counts only, no full output). |
| **B8** ✅ | Language / cross-lingual | `docs/keywords.ts` `expandQuery` (VN↔EN term groups), `search.ts` `grepDocsMulti` (OR-match, ranked) wired into `grep_docs`; `agent/blueprint.ts` `buildHarnessBlueprint` + `harness_blueprint` tool gated via `isEnabled` (mode); `context.AssistantMode` (`qa`/`harness-design`) threaded through `RunMessageOptions`→context→prompt; mode-aware `maxTurns` (qa 8 / design 16); `verify-b8.ts` | DONE — TDD (**21 new tests, 122 total green**, typecheck clean). Live `verify-b8`: (1) VN query "cổng xác minh" → EN "verification gate" source, 4 cites, VN answer ✅; (2a) qa mode never calls `harness_blueprint` (isEnabled off) ✅; (2b) harness-design mode invokes blueprint then grounds **23 cites** across the 7 primitive sections ✅. Fix mid-run: design mode blew the 8-turn budget → made `maxTurns` mode-aware. `userLanguage` instruction already wired since B3. |

### UI integration phases (each depends on a backend phase)

| UI | Name | Files | Depends | Gate |
|----|------|-------|---------|------|
| **U1** ✅ | Wire real SSE | `lib/sse.ts` (`splitSseBuffer`/`readSseStream`), `features/chat/useChatStream.tsx` (real stream, conversationId via `X-Conversation-Id`), `ChatPage` renders `SuggestionChips` | B4 | DONE — vitest added (web), splitter TDD (4 tests). Live browser (Playwright): `Feature list là gì?` streams answer live + Related citations + Next-prompt chip + feedback row. NOTE: RelatedLinks shows 7× same doc title (per-section citations) → dedup by doc in **U2**. |
| **U2** ✅ | Citations + related | `lib/citations.ts` (`dedupeCitationsByDoc`/`academyHref`), `components/chat/RelatedLinks.tsx` (per-doc clickable pills); `VITE_ACADEMY_BASE_URL` | B4 | DONE — TDD (6 helper tests, 10 web total). Live: per-section citations deduped to 3 distinct docs, each an `<a>` → academy route (`localhost:5173/lectures/09-victory-som`, etc.). Fixes the U1 7×-repeat nit. |
| **U3** ✅ | Suggestion chips | `components/chat/SuggestionChips.tsx`, wired in `ChatPage` + `useChatStream` (collects `suggestion` events) | B3/B4 | DONE — `useChatStream` collects `suggestion` events → `setSuggestions`; `ChatPage` renders `SuggestionChips` (shown when present & not loading); `onSelect` = `submit(prompt)` → new turn. Empty list → null. Typecheck + build clean. |
| **U4** ✅ | Status / tool indicators | `lib/agentStatus.ts` (`toolStatusLabel`/`nextStatus`, `STATUS_THINKING`/`STATUS_ANSWERING`), `components/chat/AssistantToolStatus.tsx` (inline `role="status"`); wired `useChatStream`→`Turn.status`→`MessageThread`→`AssistantMessage` | B4 | DONE — TDD (**8 status-reducer tests**, 18 web total green; typecheck + vite build clean). Status off the same SSE stream: `message.started`→"Đang xử lý…", `tool.started`→friendly VN label per tool (grep/read/list/blueprint), `tool.completed`→thinking, first `message.delta`→"Đang soạn câu trả lời…", `done`/`error`/`completed`→cleared; empty bubble suppressed while only status shows. **Naming:** plan said `AssistantStatusBar.tsx` but that name is the static footer brand → implemented as `AssistantToolStatus.tsx` to avoid collision. Live browser check not run this pass (needs api+pg+router up); logic + render path verified by unit tests + build. |
| **U5** ✅ | Conversation restore | `features/chat/restore.ts` (`messagesToTurns` pure map), `chatApi.getConversationMessages`, `chatQuery.conversationMessagesQuery`; `useChatStream` persists `X-Conversation-Id` → `localStorage['harness.conversationId']` + restore-on-mount effect | B5 | DONE — sub-agent + TDD (6 mapping tests). On mount, stored id → GET `/api/conversations/:id/messages` → `messagesToTurns` seeds `turns` (empty-turns guard, 404 clears stored id, never crashes); restored assistant turns carry `serverMessageId` so feedback works. Typecheck + build clean. |
| **U6** ✅ | Feedback thumbs | `chatApi.postFeedback`, `useChatStream.vote` + capture `assistant_message.related.messageId` → `Turn.serverMessageId`; `MessageThread`/`AssistantMessage` thread real id; `ChatPage` `onVote={vote}`; **`routes/chat.ts` now emits `assistant_message.related {messageId, items}` after persisting the assistant row** | B6 | DONE — sub-agent + TDD (2 api-shape tests). **Live-verify caught a gap:** the web captured `assistant_message.related` but the stream route never emitted it → feedback row never appeared. Fixed: route writes the event with the persisted `messageId` after the run (client drains it past `done`). Live (Playwright): thumb-up → `POST /api/messages/4d678d2d…/feedback` → **200 OK**; feedback row renders only with a real server id; on restore (U5), `messagesToTurns` sets `serverMessageId` from the DB so older turns also get feedback. |
| **U7** ✅ | Agent timeline | `features/chat/agentEvent.ts` (`toAgentEvent` adapter + `reduceAgentEvent` + `TimelineStep`), `components/chat/AgentTimeline.tsx`; wired through `useChatStream`→`Turn.timeline`→`AssistantMessage` | B9 | DONE — sub-agent + TDD (**18 reducer/adapter tests**). Live steps off the SSE stream: each grep/read = a step (friendly label + `detail`/`summary`), **start↔done paired strictly by `callId`** (repeated `grep_docs` closes the right step — explicitly tested), single "Generating response" step from the first delta (`message.started` ignored), `done` collapses to "Done in Ns · k steps" (expandable). Supersedes the U4 single-line status when steps exist. **All UI green: 44 web tests, typecheck + vite build clean.** |

### Critical path

```
B0 → B1 → B2 → B3 ─┬─→ B4 → U1 → U2 / U3 / U4
                   │         ↓
                   └→ B5 → U5
                       ↓
                   B6 → U6

B7, B8 run in parallel after B3
  (B8 improves B2 grep recall; B7 needs B3 answers)
```

Milestones:

- **First end-to-end demo** = B0 → B4 + U1 (streamed answer in the real UI).
- **First correct demo** = + B2 / B3 (answer is grounded and cited).
- Persistence, feedback, eval, and language harden after the demo path works.

> Feedback loops + guardrails shipped in **B6** (`runWithRegenerate`, `chat_traces`, feedback
> endpoint). Language / cross-lingual + `isEnabled` mode-gating shipped in **B8** (`expandQuery`,
> `grepDocsMulti`, `harness_blueprint` gated by mode). §16 below specifies the agent-timeline UX.

---

## 16. Agent Timeline (Streaming UX)

Goal: while the agent works, show the user *what it is doing* (searching docs, reading a
section, drafting) as a live step list — not just a spinner. Built on the existing SSE stream.

### Current emitted events (baseline)

`message.started` (once per LLM turn), `message.delta`, `message.completed`, `tool.started {tool}`,
`tool.completed {tool}`, `citation` (batched after run), `suggestion`, `done`, `error`.
The tool events carry **only the tool name** — no args, no result, no correlation id.

### Gaps vs a useful timeline

- No `callId` → can't reliably pair start↔done when the same tool (e.g. `grep_docs`) runs
  several times in one turn. Matching by name closes the wrong step.
- No `detail` → a step reads "grep_docs" instead of "Searching: verification gate".
- `message.started` fires once **per LLM turn** (each tool round) → mapping it to a "generating"
  step spawns several spurious steps.
- No reasoning/thinking events — the router uses Chat Completions, which doesn't stream
  reasoning. `thinking_*` is therefore **deferred** (add only if a reasoning-capable model lands).

### B9 — enrich the event contract (backend)

```ts
// shared/events.ts
{ type: 'tool.started',   tool: string, callId: string, detail?: string }
{ type: 'tool.completed', tool: string, callId: string, summary?: string }
```

`streaming.ts` `mapStreamEvent`:
- `tool_called` item → read `callId` + `arguments`; build `detail` (grep `pattern`, or
  `docId · heading`, or blueprint `workflow`).
- `tool_output` item → same `callId`; build a **small** `summary` (e.g. "12 matches",
  "section: Verification gate"). Never dump full tool output (size/token blowup).
- Verify the SDK item exposes `callId` (probe like earlier phases) before relying on it.

### U7 — timeline UI (frontend)

- `features/chat/agentEvent.ts`: `toAgentEvent(StreamEvent): AgentEvent | null` adapter +
  the provided `reduceAgentEvent`. Mapping:
  - `tool.started`→`tool_start {name: label(tool), detail, eventId: callId}`,
    `tool.completed`→`tool_done {eventId: callId, result: summary}`.
  - `message.delta`→ derive `text_start` on the **first** delta only, then `text_delta`.
    Ignore `message.started` for the timeline (avoids duplicate "Generating" steps).
  - `done`/`error` pass through.
  - tool→label map: `list_docs`→"Listing docs", `grep_docs`→"Searching docs",
    `read_doc_section`→"Reading section", `harness_blueprint`→"Drafting blueprint".
- `components/chat/AgentTimeline.tsx`: render `TimelineStep[]` while streaming; collapse to a
  one-line "Done in Ns · k steps" summary (expandable) after `done`.
- Place inside `AssistantMessage` above the answer body.

### Reducer notes (provided `reduceAgentEvent`)

The reducer is sound once events carry `callId`/`detail`. Required for correctness:
- **`eventId` (callId) is mandatory** — without it `tool_done` matches by label and closes the
  wrong step when a tool repeats. B9 supplies it.
- Feed `text_start` from the first `text_delta`, not from `message.started`.
- `thinking_*`, `kind: 'stage'`, and `parentId` are unused by phase-1 backend (flat tool list);
  they stay in the type for a later "group grep+read under a Researching stage" enhancement.
