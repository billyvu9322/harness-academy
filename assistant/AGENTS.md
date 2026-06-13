# Assistant Instructions

Harness Academy Assistant — a single-orchestrator agent harness that answers
harness-engineering questions **only from the local doc corpus**, grounded with
provenance citations, over a custom OpenAI-compatible LLM router.

## Scope

- `apps/api/` — Fastify API + the agent harness (orchestrator, docs tools, guardrails,
  streaming, persistence, observability, eval).
- `apps/web/` — React chat UI (SSE stream client, markdown render, timeline, citations,
  suggestion chips, feedback, conversation restore).
- `packages/shared/` — cross-app TypeScript + Zod contracts (source of truth).

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev` (turbo `--parallel`)
- Build / Typecheck / Lint / Test: `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test`
- Migrations: `pnpm db:generate` · `pnpm db:migrate`
- Eval (live, LLM-judge): `pnpm eval`
- Postgres: `docker compose up -d` (pgvector image, host port **5433** → container 5432)
- API env: server reads `assistant/.env`; run scripts with `node --env-file=../../.env`.
  `.env` holds `LLM_API_KEY` (router key) — never read, log, or commit it.

---

## Architecture & Request Flow

A user chat request travels through these layers to produce the agent's response.
File references are relative to `assistant/`.

```
[ apps/web ]  composer → useChatStream → chatApi (POST /api/chat/stream, SSE)
      │  renders: Markdown body · AgentTimeline · RelatedLinks · SuggestionChips · MessageFeedback
      ▼  (typed SSE events, packages/shared/src/events.ts)
[ apps/api route ]  routes/chat.ts  — validate · resolve conversation · load history
      │             · persist user msg · reply.hijack() + SSE · persist assistant msg · trace
      ▼
[ agent ]  streaming.ts streamAssistant  (stream)  |  harnessAssistant.runMessage (non-stream)
      │    input guardrail → buildAgentInput(history) → run(orchestrator, {context, stream})
      │    → map SDK events → buildCitations(context.reads) → buildSuggestions → done
      ▼
[ Agents SDK orchestrator ]  @openai/agents Agent loop (tool_calls ↔ final_output)
      │    tools: list_docs · grep_docs · read_doc_section · harness_blueprint(gated)
      ▼
[ docs layer ]  runtime.getIndex → buildDocIndex (allowlist) ; search.grep/read ; keywords expand
      ▼
[ LLM router ]  agent/llm.ts single OpenAI client → API Url (Chat Completions)

  cross-cutting:  db/ (Postgres: conversations·messages·chat_traces·user_feedback)
                  observability/trace.ts (per-turn summary)
```

### Step-by-step (`POST /api/chat/stream`)

1. **UI** — `apps/web/src/features/chat/useChatStream.tsx` `submit()` posts via
   `features/chat/chatApi.ts` → `POST /api/chat/stream`. It reads the SSE body with
   `lib/sse.ts` and reduces events into UI state.
2. **Route** — `apps/api/src/routes/chat.ts`:
   - validate body with `chatRequestSchema` (`packages/shared/src/chat.ts`);
   - `resolveConversation()` create-or-reuse → `conversationId` (returned as the
     `X-Conversation-Id` response header);
   - `getHistoryTurns()` loads prior turns (`agent/history.ts` + `db/repo.ts`);
   - persist the user message (`appendMessage`);
   - `reply.hijack()`, write `text/event-stream` headers, then for-await
     `streamAssistant(...)` writing each event via `serializeSseEvent`;
   - after the stream: persist the assistant message → `messageId`, then emit
     `assistant_message.related {messageId, items}` (so the client can target feedback);
   - `insertTrace()` writes a `chat_traces` row.
3. **Agent** — `apps/api/src/agent/streaming.ts` `streamAssistant`:
   - `initLlm()` (wire SDK to the router, once);
   - `checkInput()` guardrail — reject empty / too-long / prompt-injection → `error` + `done`;
   - `buildAgentInput(history, message)` builds the multi-turn input;
   - `run(assistant.orchestrator, input, { context, stream: true })` — the Agents-SDK
     streamed run;
   - `mapStreamEvent()` converts SDK events → typed app events (`message.delta`,
     `tool.started`/`tool.completed` with `callId`+`detail`/`summary`);
   - on completion: `buildCitations(context.reads)` → emit `citation` events, then
     `buildSuggestions()` → `suggestion` events, then `done`.
4. **Orchestrator** — `apps/api/src/agent/harnessAssistant.ts` builds one
   `Agent<AssistantContext>` ("HarnessOrchestrator") with the docs tools, the input
   guardrail, and a system prompt (`agent/prompts.ts`) that enforces grounding +
   reply language. The SDK loop alternates tool calls and final output.
5. **Tools** — `apps/api/src/agent/tools.ts`:
   - `list_docs` — TOC (titles + heading outline);
   - `grep_docs` — expands the query into VN+EN variants (`docs/keywords.ts`) then
     `grepDocsMulti` (ranked OR-match);
   - `read_doc_section` — exact section text; **records the read into `context.reads`**
     (this is the citation provenance — only sections actually read are cited);
   - `harness_blueprint` — primitive scaffold, `isEnabled`-gated to `mode === 'harness-design'`.
6. **Docs index** — `apps/api/src/docs/`: `runtime.ts` lazily builds an in-memory index
   (`buildDocIndex`) from the allowlist (`sources.ts`) parsed by `parseMarkdown.ts`;
   `search.ts` does grep/read; `citations.ts` maps read sections → `Citation`.
   No raw filesystem/shell is exposed — a forged `docId` returns not-found (traversal-safe).
7. **LLM router** — `apps/api/src/agent/llm.ts`: a single `OpenAI` client points at the
   router (`LLM_BASE_URL`), forces Chat Completions, disables OpenAI tracing, sets the
   required `User-Agent`. Every agent resolves against it.

### The non-stream path (`POST /api/chat/message`)

Same route file uses `harnessAssistant.runMessage` instead of `streamAssistant`. It adds
two things streaming does not: an **output-grounding regenerate-once** loop
(`agent/regenerate.ts` — re-run with a corrective prompt if the answer is ungrounded) and
**mode-aware `maxTurns`** (qa 8 / harness-design 16). Streaming currently runs in `qa`
mode with a fixed turn budget.

### SSE event contract (`packages/shared/src/events.ts`)

Typical order on the wire:
`message.delta`×N → `tool.started`/`tool.completed` (paired by `callId`) → `citation`×N →
`suggestion`×N → `done` → `assistant_message.related`. `error` precedes `done` on failure.
The web reducers: `lib/agentStatus.ts` (single-line status, U4) and
`features/chat/agentEvent.ts` (`toAgentEvent`/`reduceAgentEvent` → live timeline, U7).

### Persistence & observability

`apps/api/src/db/` (Drizzle + Postgres): `conversations`, `messages`
(content + `citations_json` + `suggestions_json`), `chat_traces`, `user_feedback`.
`POST /api/messages/:id/feedback` stores a thumb vote. `observability/trace.ts`
`buildTraceSummary` derives a per-turn trace (intent, accessed docs, tool calls, citation
count, latency, status, regenerated) persisted per turn.

### Embeddable academy widget

The chat ships as a one-file widget the academy site embeds (Wix-docs style "Ask Assistant").
Build: `pnpm --filter @assistant/web build:widget` (Vite library mode, `vite.widget.config.ts`)
→ single `dist-widget/assistant-widget.js` (React + chat + Tailwind CSS bundled, ~133 KB gz),
then `scripts/copy-widget.mjs` copies it to `academy/public/`. Entry `src/widget/index.tsx`
registers a `<harness-assistant>` custom element that mounts the reused `ChatPage` into a
**Shadow DOM** (Tailwind CSS injected in-shadow; fonts injected into the document head).
Config via attributes: `api-base-url`, `academy-route`, `academy-title`. The academy header's
`AskAssistantButton` lazy-loads the script and toggles the element's `open` attribute.
Cross-origin: the SSE route (hijacked) and `@fastify/cors` both honor the `WEB_ORIGINS`
allowlist (`config/origins.ts`) — the academy origin must be listed.

### Key invariant — grounding

Citations are **provenance-based**: derived from `context.reads` (sections the agent
actually opened via `read_doc_section`), never from text the model claims. The output
guardrail (`agent/guardrails.ts` `checkOutput`) requires ≥1 citation unless the answer
explicitly states the corpus does not cover the question.

---

## Rules

- **Grounding is non-negotiable.** Answers come only from the local corpus via the docs
  tools; citations must trace to `context.reads`. Do not add web/external knowledge.
- `packages/shared` stays the single source of truth for any API↔web contract; change the
  Zod schema there first, then both sides.
- Transport is **typed SSE events**, not raw text — extend `events.ts`, don't bypass it.
- No raw filesystem / shell tools reach the model; docs access goes through the allowlisted
  index only.
- Never read, print, or commit `LLM_API_KEY` / `.env`.
- When adding a new agent tool, gate it appropriately (see `isEnabled` on `harness_blueprint`)
  and keep its output Zod-validated and small (no full tool dumps over SSE).
