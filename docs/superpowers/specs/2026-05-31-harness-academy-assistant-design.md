# Harness Academy Assistant Design

Date: 2026-05-31

Status: draft for user review

Target implementation folder: `assistant/`

## Goal

Build a built-in AI Agent Assistant for Harness Academy. Assistant should behave like a focused developer assistant for harness engineering: answer learner questions, explain unclear academy content, cite local materials, and help users design a harness for a concrete business workflow operated through tools such as Claude Code.

First release uses local project knowledge only. No web search fallback in phase 1.

## Non-Goals For Phase 1

- No external web search.
- No arbitrary shell/file tools exposed to end users.
- No generated repo scaffolding from chat.
- No admin UI for editing indexed documents.
- No multi-tenant auth unless added later.
- No voice/realtime audio.

## Stack

All application code should be TypeScript.

Monorepo tooling:

- `pnpm` workspaces.
- `turbo` for task orchestration.

Backend:

- Node.js runtime.
- Fastify API server.
- OpenAI Agents SDK for TypeScript.
- Zod for request, response, event, and env validation.
- PostgreSQL.
- Drizzle ORM and migrations.
- Docker / Docker Compose.

Frontend:

- React.
- Vite.
- Tailwind CSS.
- TanStack Router.
- TanStack Query.
- Zustand.
- Zod.

## Recommended Repo Shape

```text
assistant/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .env.example
  docker-compose.yml
  apps/
    api/
      package.json
      tsconfig.json
      src/
        server.ts
        app.ts
        config/
          env.ts
        routes/
          health.ts
          chat.ts
          conversations.ts
        agent/
          harnessAssistant.ts
          prompts.ts
          tools.ts
          guardrails.ts
          streaming.ts
          suggestions.ts
        rag/
          sources.ts
          parseMarkdown.ts
          chunk.ts
          embed.ts
          retrieve.ts
          rerank.ts
          citations.ts
        db/
          client.ts
          schema.ts
        observability/
          logger.ts
          trace.ts
        evals/
          goldenQuestions.ts
          runEvals.ts
    web/
      package.json
      tsconfig.json
      vite.config.ts
      src/
        main.tsx
        router.tsx
        app/
        components/chat/
        features/chat/
        stores/
        lib/
        api/
        schemas/
  packages/
    shared/
      package.json
      src/
        chat.ts
        events.ts
        citations.ts
        suggestions.ts
    config/
      package.json
      eslint/
      typescript/
```

`assistant/` stays isolated from current `academy/` static content app. Academy can later link to or embed Assistant once stable.

## Product Behavior

Assistant supports four primary jobs.

1. Explain concepts from Harness Academy.
2. Find relevant lessons, projects, skills, and references.
3. Answer questions about harness-engineering principles using local docs.
4. Help a user design a harness for a concrete business workflow.

Example user prompts:

- `Verification gate khác E2E gate như thế nào?`
- `Bài nào nói về feature list?`
- `Tôi muốn áp dụng harness cho team logistics xử lý shipping exception, bắt đầu từ đâu?`
- `Thiết kế AGENTS.md cho repo automation test như thế nào?`

## Knowledge Sources

Phase 1 indexes only local project files.

Source set:

- `academy/content/lectures/*.md`
- `academy/content/projects/*.md`
- `academy/content/skills/*.md`
- `academy/content/references/*.md`
- `AI-Agent-Harness.md`
- `docs/*.md`
- `templates/automation-test-harness-experimental/README.md`
- `templates/automation-test-harness-experimental/AGENTS.md`
- `templates/automation-test-harness-experimental/CLAUDE.md`
- `templates/automation-test-harness-experimental/Template.md`

Do not index generated browser artifacts under `.playwright-mcp/`.

## RAG Design

### Ingestion

Ingestion runs via a CLI command such as `pnpm --filter @assistant/api ingest`.

Ingestion steps:

1. Enumerate allowed source files from fixed path list.
2. Parse Markdown frontmatter where present.
3. Split by heading boundaries first.
4. Chunk large sections into smaller semantic blocks.
5. Generate embeddings.
6. Store chunk text and metadata in Postgres.

Metadata per chunk:

- `document_id`
- `source_path`
- `content_type` such as `lecture`, `project`, `skill`, `reference`, `core_doc`, `template_doc`
- `slug`
- `title`
- `section_heading`
- `chunk_index`
- `route`
- `token_estimate`
- `checksum`
- `updated_at`

### Chunking Rules

Chunking should optimize for answerability, not only token count.

- Prefer heading-scoped chunks.
- Target roughly 600-1000 tokens per chunk.
- Keep lists and examples intact when possible.
- Preserve citation anchors such as file path, heading, and route.
- Merge very small adjacent sections if they only make sense together.

### Retrieval

Retrieval pipeline:

1. Intent classify question.
2. Build retrieval query.
3. Vector search top K chunks.
4. Keyword fallback for exact terms like `AGENTS.md`, `verification gate`, `Playwright MCP`.
5. Optional rerank with lightweight local heuristic.
6. Send final context bundle into agent.

Priority order for reranking:

1. Direct academy lesson/project/skill content.
2. `AI-Agent-Harness.md`.
3. `docs/*.md` synthesis notes.
4. Template docs under `templates/`.

### Citation Rules

Every factual answer should cite local sources.

Citations should include:

- Human-readable title.
- Route if content comes from academy collections.
- Source path for non-routed files.
- Optional section heading.

If local docs are insufficient, assistant must say that internal materials do not cover the topic well enough. It should not invent missing facts in phase 1.

## Backend Architecture

### API Surface

Core endpoints:

- `GET /health`
- `POST /api/chat/stream`
- `POST /api/chat/message` for non-stream fallback or testing
- `GET /api/conversations/:id`
- `GET /api/conversations/:id/messages`
- `POST /api/rag/reindex` reserved for protected future use

Phase 1 can ship with only `/health` and `/api/chat/stream` if needed, but conversation read endpoints are useful for restoring UI state.

### Request Validation

Use Zod for:

- env schema
- chat request
- stream event envelope
- tool input and output schema
- DB-to-API mapping where externalized

### Chat Streaming Contract

Preferred transport: SSE over Fastify.

Server emits typed events from a shared schema package:

- `message.started`
- `message.delta`
- `message.completed`
- `tool.started`
- `tool.completed`
- `retrieval.completed`
- `citation`
- `suggestion`
- `trace`
- `error`
- `done`

The frontend should never parse raw model output for app state. All UI state changes should come from structured events.

### Agent Runtime

Use OpenAI Agents SDK because official docs recommend it when app needs code-first orchestration for agents, tools, handoffs, guardrails, tracing, or sandbox execution.

Agent responsibilities in phase 1:

- answer harness-academy questions
- explain docs in plain Vietnamese while preserving technical terms where useful
- produce structured suggestions for follow-up prompts
- produce harness design guidance for concrete business workflows

Phase 1 should start with a single main agent, not a full multi-agent graph.

Reason:

- local-doc-only RAG is narrow enough for one orchestrating agent
- trace and retrieval quality matter more than handoffs at this stage
- fewer moving parts means easier evals and debugging

Specialist agents can be added later as tools or handoffs for:

- `lesson-guide`
- `harness-designer`
- `document-retriever`

### OpenAI Agent SDK Use

The backend should use these SDK features deliberately.

- `Agent` for main assistant role.
- function tools with typed Zod-backed parameters.
- sessions for conversation continuity.
- streaming run result for token-by-token or item-by-item UI events.
- tracing enabled from first implementation.
- guardrails for input, tool use, and output shape.

SDK guidance from current official materials:

- use Agents SDK when app needs orchestration, tools, handoffs, guardrails, tracing, or sandbox execution
- agent loop handles tool calls and workflow control
- tools should be modular and clearly defined
- tracing should be built-in, not bolted on later

### Local Tools Exposed To Agent

Do not expose broad file system access to chat users.

Expose narrow tools only:

1. `searchLocalDocs`
   - input: `query`, optional `contentTypes`, optional `topK`
   - output: chunk matches with metadata

2. `getDocumentChunk`
   - input: `chunkId`
   - output: exact stored chunk text and metadata

3. `suggestNextLessons`
   - input: current topic or answered route
   - output: recommended academy routes

4. `draftHarnessBlueprint`
   - input: business domain, team size, workflow description, risk notes
   - output: structured harness outline with control plane, execution plane, docs, tools, verification, trace

These tools map directly to product behavior. They should return deterministic structured shapes.

### Guardrails

Guardrails should exist at multiple layers.

Input guardrails:

- request length limit
- empty/whitespace reject
- block obvious attempts to override system rules
- tag unsupported requests for safe refusal or redirect

Retrieval guardrails:

- ignore files outside explicit allowlist
- sanitize embedded prompt-like text from retrieved docs before using it as authority
- cap total retrieved context size

Output guardrails:

- require at least one citation for factual answers grounded in local docs
- require explicit uncertainty if retrieval confidence is low
- forbid claims about external sources in phase 1
- require structured suggestions list length cap

## Conversation State

Use Postgres for durable state.

Tables needed in phase 1:

- `conversations`
- `messages`
- `document_sources`
- `document_chunks`
- `document_embeddings`
- `chat_traces`

Possible future tables:

- `eval_runs`
- `user_feedback`
- `saved_blueprints`

Conversation state should store:

- user message
- assistant message
- emitted citations
- suggestions
- retrieval trace summary
- latency and token usage summary if available

## Frontend Architecture

### Core UX

Chat UI should feel like a focused learning copilot, not a generic chatbot.

Main regions:

- conversation thread
- citations panel or expandable citation blocks
- suggested next prompts
- source route links back into academy content
- loading and tool-status indicators

### State Split

Use TanStack Query for server state.

- conversations
- message history
- streaming lifecycle metadata

Use Zustand for client UI state.

- active conversation id
- draft input
- citation drawer open/closed
- streaming status
- selected source preview

### Route Strategy

Add assistant as a dedicated surface, not mixed into existing lesson pages initially.

Suggested routes once integrated into academy later:

- `/assistant`
- `/assistant/:conversationId`

In phase 1 the `assistant/web` app can run standalone and academy can deep-link into it.

### Streaming UI Behavior

UI responsibilities:

1. send message
2. open SSE stream
3. append `message.delta` text progressively
4. show retrieval/tool indicators
5. attach citations as they arrive
6. mark answer complete on `done`
7. recover gracefully on disconnect or retryable error

The frontend should render a clear difference between:

- final answer text
- source citations
- suggested next actions
- system/tool status messages

## Harness Applied To Assistant Itself

Assistant should be built using harness principles, not only talk about them.

### Instruction Subsystem

Add `assistant/AGENTS.md` with:

- repo shape
- exact commands
- data source allowlist
- definition of done
- eval commands
- tracing expectations

### Tool Subsystem

Use narrow business tools only. No generic filesystem or shell tools for user-facing runtime.

### Environment Subsystem

Pin Node version, `pnpm` version if needed, workspace commands, Docker services, env schema, and migration workflow.

### State Subsystem

Persist conversations, retrieval traces, eval outcomes, and generated harness blueprints.

### Feedback Subsystem

Require API tests, retrieval tests, citation tests, and golden question evals.

### Observability

Every chat turn should leave a trace summary:

- intent class
- retrieved chunk ids
- tools called
- duration
- error if any
- citation count

## Chat Flow

```text
User sends question
  -> Fastify validates request
  -> Load or create conversation state
  -> Intent classification
  -> Retrieve local context
  -> Run OpenAI Agent SDK agent with narrow tools
  -> Stream structured events to frontend
  -> Persist answer, citations, trace summary
  -> Suggest next prompts
```

Detailed flow:

1. User types a question in web chat.
2. Web sends request with `conversationId`, `message`, and optional `mode`.
3. API validates and stores inbound message.
4. API classifies intent into one of:
   - academy explanation
   - source lookup
   - harness design request
   - unsupported or ambiguous
5. Retrieval service builds query and fetches candidate chunks.
6. Agent runs with instructions plus bounded context bundle.
7. Agent may call only narrow local tools.
8. Backend maps streamed run events to SSE events.
9. UI renders text, citations, and suggestions incrementally.
10. Backend stores final answer and trace summary.

## Harness-Design Support Flow

One important product behavior is helping a user design a harness for a business workflow.

Example prompt:

`Tôi muốn build harness cho team legal review contract bằng Claude Code.`

Expected assistant behavior:

1. Ask for missing inputs if question is underspecified.
2. Identify workflow type, risk, approval needs, and proof expectations.
3. Return a structured blueprint:
   - goal
   - human role
   - agent role
   - control plane docs
   - execution plane tools
   - risk lanes
   - validation ladder
   - trace schema
   - starter `AGENTS.md` sections
4. Cite lessons/docs that justify each recommendation.

This makes the assistant not only a Q&A bot, but a harness design copilot.

## Data Model

Core entities:

- `Conversation`
- `Message`
- `DocumentSource`
- `DocumentChunk`
- `DocumentEmbedding`
- `ChatTrace`

Suggested shape:

### conversations

- `id`
- `title`
- `created_at`
- `updated_at`

### messages

- `id`
- `conversation_id`
- `role`
- `content`
- `citations_json`
- `suggestions_json`
- `trace_id`
- `created_at`

### document_sources

- `id`
- `source_path`
- `content_type`
- `slug`
- `title`
- `route`
- `checksum`
- `updated_at`

### document_chunks

- `id`
- `document_source_id`
- `section_heading`
- `chunk_index`
- `content`
- `token_estimate`

### document_embeddings

- `chunk_id`
- `embedding`

### chat_traces

- `id`
- `conversation_id`
- `message_id`
- `intent`
- `retrieved_chunk_ids_json`
- `tool_calls_json`
- `latency_ms`
- `status`
- `error_summary`
- `created_at`

## Verification Strategy

### Unit Tests

- markdown parser
- chunker
- citation formatter
- intent classifier heuristics if deterministic
- event mappers for streaming

### Integration Tests

- Fastify route validation
- DB persistence for conversations/messages
- ingestion pipeline into Postgres
- retrieval returns expected chunk set for known queries

### End-to-End Tests

- chat message round-trip with mocked model or test agent fixture
- streaming UI consumes SSE correctly
- citations render and link to source routes

### Eval Set

Maintain a small golden-question suite.

Examples:

- `Feature list là gì?`
- `Bài nào nói về orchestrator và sub-agent?`
- `Verification gate khác E2E test như thế nào?`
- `Thiết kế harness cho team QA automation dựa trên local docs.`

Each eval checks:

- answer grounded in local docs
- correct citation count
- no unsupported external claim
- useful next suggestions

## Delivery Phases

### Phase 1: Spec and harness contract

- write design doc
- define event schema
- define retrieval source map
- define golden questions

### Phase 2: Monorepo and backend skeleton

- `pnpm` workspace
- `turbo` pipeline
- Fastify app
- env schema
- health route
- chat stream route shell

### Phase 3: RAG ingestion and retrieval

- markdown parsing
- chunking
- embeddings
- Postgres storage
- retrieval API and tests

### Phase 4: Agent runtime and streaming

- assistant prompt
- local tools
- structured SSE event adapter
- tracing
- conversation persistence

### Phase 5: Frontend chat UI

- standalone assistant web app
- streaming message renderer
- citations and source linking
- conversation restore
- suggested prompts

### Phase 6: Harness-design copilot behavior

- question scaffolding for business workflow input
- blueprint output schema
- citations back to academy content

### Phase 7: Verification and hardening

- golden Q&A evals
- retrieval quality tests
- citation tests
- API integration tests
- basic E2E tests

## Risks And Mitigations

### Risk: retrieval quality weak on Vietnamese phrasing

Mitigation:

- keep chunk titles and headings in metadata
- add keyword fallback
- add evals using real Vietnamese queries

### Risk: agent hallucinates beyond local docs

Mitigation:

- phase 1 bans web fallback
- output guardrail requires citations or explicit uncertainty

### Risk: streaming UI complexity leaks model event details into UI code

Mitigation:

- create typed server event adapter in backend
- frontend only consumes stable app-level events

### Risk: academy and assistant drift apart

Mitigation:

- ingestion points directly to `academy/content/**`
- reindex command included in dev workflow

### Risk: overbuilding multi-agent too early

Mitigation:

- single-agent phase 1
- add specialist agents only after eval evidence shows need

## Open Questions Deferred To Implementation Plan

- embedding model choice and storage type for Postgres vector support
- exact SSE vs chunked fetch transport decision
- whether to expose `assistant/web` under separate port or reverse proxy through academy shell first
- auth strategy if assistant becomes public-facing later

## Recommendation Summary

- Use `assistant/` as a standalone `pnpm` + `turbo` TypeScript monorepo.
- Start with one main agent plus narrow local-doc tools.
- Use local-doc-only RAG in phase 1.
- Stream structured SSE events from Fastify to React UI.
- Persist conversations and traces in Postgres.
- Apply harness principles to the assistant itself from day one.

## Success Criteria

Phase 1 is successful when all are true:

1. User can ask a harness question in chat and receive a streamed answer.
2. Answer cites correct local academy/docs/template sources.
3. Assistant can suggest the next relevant lesson or project.
4. Assistant can output a structured harness blueprint for a business workflow.
5. Golden eval questions pass at an acceptable baseline.
6. Every chat turn has a trace summary for debugging and improvement.
