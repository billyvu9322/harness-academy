# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First

**`AGENTS.md` is canonical** for this subtree — full architecture, the `POST /api/chat/stream` request-flow layers, the typed SSE event contract, the grounding invariant, and the scope rules. Read it before changing the agent. `README.md` covers setup, env vars, the embeddable-widget build, and production deploy. This file only adds what those two omit and flags where they drift from the code.

Parent repo guidance: `../../CLAUDE.md` (root workspace) and `../../AGENTS.md`.

## Layout (Turborepo, pnpm@10.12.4, Node 22+)

`apps/api` (`@assistant/api`) — Fastify + the agent harness · `apps/web` (`@assistant/web`) — React 18 chat UI + embeddable widget · `packages/shared` (`@assistant/shared`) — Zod contracts, source of truth for any API↔web contract.

Workspace globs: `apps/*` + `packages/*`. `pnpm-workspace.yaml`.

## Commands

Root scripts route through turbo (`build`/`typecheck`/`lint`/`test` all fan out with `dependsOn: ["^..."]`):

- `pnpm install` then `pnpm dev` — turbo `--parallel`: api on `:3001`, web on `:5174`
- `pnpm build` / `pnpm typecheck` / `pnpm lint` — **all three are `tsc --noEmit`**; there is no ESLint and no JS emit (the API runs from TS source via `tsx`)
- `pnpm test` — vitest across packages
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle, forwarded to `@assistant/api`
- `pnpm eval` — live LLM-judge eval; needs `.env`
- `pnpm package:zip` — `sync:corpus` then build `assistant-harness.zip` (secret-free deploy artifact)

Per-app / focused:

- Single test file: `pnpm --filter @assistant/api test -- tests/agent/tools.test.ts` (or `npx vitest run tests/...` from `apps/api/`)
- Watch: `pnpm --filter @assistant/api test:watch`
- Widget: `pnpm --filter @assistant/web build:widget` — Vite lib mode → `dist-widget/assistant-widget.js`, then `scripts/copy-widget.mjs` copies it into `academy/public/`
- Widget dev harness: `pnpm --filter @assistant/web dev:widget` (opens `/widget-dev`)

## Things AGENTS.md / README don't say

- **Tests are NOT co-located** — they live under `apps/api/tests/` mirroring `src/`. `apps/web` and `packages/shared` have **no tests** (their `test` script just echoes). All real tests are api-side.
- **Eval entry is `apps/api/src/evals/runEvals.ts`** (dir is `evals/` plural). Golden-set test: `tests/evals/goldenQuestions.test.ts`.
- **The agent has more layers than the 4-tool list in AGENTS.md.** Beyond `list_docs`/`grep_docs`/`read_doc_section`/`harness_blueprint`, the orchestrator (`agent/harnessAssistant.ts`) also wires:
  - **Skills system** — `agent/skills/loader.ts` loads a skill registry from `SKILLS_ROOT`; `agent/skills/loadSkillTool.ts` exposes a `load_skill` tool. Skill metas are injected into orchestrator construction.
  - **Relevance gate** — `agent/relevance.ts` `classifyInput` / `refusalFor` short-circuits off-corpus questions before the SDK loop.
  - **History compaction** — `agent/compact.ts` `compactIfNeeded` trims multi-turn input upstream of the run.
- **`rag/` is a deliberate stub** (`rag/placeholder.ts` returns `{ enabled: false }`). Retrieval is intentionally out of scope — do not build it out without explicit scope expansion (see AGENTS.md Rules).
- **Postgres port differs by context**: README local `docker run` maps host `5432`; AGENTS.md / `docker compose` maps host **5433**→container 5432. Match whichever your `.env` `DATABASE_URL` targets. pgvector image, but vector search is not used yet (RAG stub).

## Invariants (do not break — from AGENTS.md)

- **Grounding**: citations are provenance-based, derived only from `context.reads` (sections opened via `read_doc_section`). Output guardrail requires ≥1 citation unless the answer states the corpus doesn't cover the question. No web/external knowledge.
- Change a cross-app contract in `packages/shared` **first**, then both sides.
- Transport is typed SSE events (`packages/shared/src/events.ts`) — extend it, don't bypass with raw text.
- No raw filesystem/shell tool reaches the model; docs access is the allowlisted in-memory index only (forged `docId` → not-found, traversal-safe).
- New agent tools: gate appropriately (see `isEnabled` on `harness_blueprint`, gated to `mode === 'harness-design'`), keep output Zod-validated and small.

## Safety

Never read, print, or commit `LLM_API_KEY` or any `.env*` file. The deploy zip and git both exclude them.
