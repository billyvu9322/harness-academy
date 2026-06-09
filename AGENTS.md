# Agent Instructions

## Read First

- Root `AGENTS.md` is canonical workspace guide. `CLAUDE.md` adds corrections and subtree notes; use both.
- Main seminar artifact: `docs/AI-Agent-Harness.md`. Keep it framework-agnostic unless user explicitly asks for vendor-specific material.
- Sourced research notes: `docs/OpenAI-Harness-Engineering.md`, `docs/Harness-Template-Flow.md`, `docs/Awesome-Harness-Engineering-Flow.md`. Preserve source URLs and snapshot dates.

## Repo Shape

- Root has `package.json` and `pnpm-lock.yaml`, but no root scripts, CI, or app entrypoint. Do not invent root `build`, `test`, or `dev` commands.
- Run commands from subtree owning manifest/config.
- Main runnable subtrees:
  - `academy/` — Vite + React site for academy content.
  - `assistant/` — pnpm workspace / Turborepo (`apps/api`, `apps/web`, `packages/shared`).
  - `templates/automation-test-harness-experimental/` — Playwright sample harness. Treat local `AGENTS.md` there as authoritative inside subtree.

## Academy

- Work from `academy/`.
- Commands: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm lint`.
- `pnpm lint` is only `tsc --noEmit`; no ESLint configured.
- Content loader: `academy/src/content/index.ts` uses raw `import.meta.glob` over `academy/content/{lectures,projects,skills,references}`.
- New content needs frontmatter at least: `title`, `description`, `order`, `duration`, `tags`.
- New content section also needs manual route wiring in `academy/src/router.tsx`; markdown alone not enough.
- If sidebar misses new content, restart dev server.

## Assistant

- Work from `assistant/`.
- Install/toolchain: Node 22+, `pnpm@10.12.4`.
- Workspace packages from `pnpm-workspace.yaml`: `apps/*`, `packages/*`.
- Root scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm eval`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm sync:corpus`, `pnpm package:zip`.
- `turbo run dev --parallel` starts both API and web. Build/lint/typecheck/test all flow through Turbo.
- `packages/shared` is source of truth for API/web contracts. Change shared Zod schema first, then api/web consumers.
- `apps/web` tests are placeholder only: `test` prints `No tests in web scaffold yet`.
- `packages/shared` tests are placeholder only: `test` prints `No tests in shared yet`.
- API eval command reads env explicitly: `node --env-file=../../.env --import tsx src/evals/runEvals.ts`.
- API scripts outside server startup expect `assistant/.env`; do not move env assumptions casually.

## Assistant Architecture

- `assistant/apps/api` = Fastify API + agent harness.
- `assistant/apps/web` = React chat UI + embeddable widget.
- `assistant/packages/shared` = shared contracts.
- Request flow worth preserving when editing:
  - web posts SSE chat request
  - `apps/api/src/routes/chat.ts` validates, loads history, persists messages, streams events
  - `apps/api/src/agent/streaming.ts` runs orchestrator and maps SDK events to typed SSE
  - docs access goes through allowlisted docs tools only
- Grounding invariant: citations come from sections actually read via docs tools (`context.reads`), not model claims.
- Do not add raw filesystem/shell access to model-facing tools.

## Assistant Ops

- Local dev flow from `assistant/README.md`: start Postgres, run `pnpm db:migrate`, then `pnpm dev`.
- Local Postgres example in README maps host `5432 -> 5432` with container name `harness-pg`.
- Production compose in `assistant/docker-compose.yml` is API-only; expects Postgres already running on VM host via `host.docker.internal`.
- `pnpm package:zip` first runs `sync-corpus`; deploy zip depends on generated `assistant/corpus/`.
- `assistant/scripts/sync-corpus.mjs` copies repo-root corpus inputs, including `templates/automation-test-harness-experimental/*`. If those paths move, update sync script and docs allowlist together.
- Widget build is separate from API deploy: `pnpm --filter @assistant/web build:widget` outputs `apps/web/dist-widget/assistant-widget.js` and copies it into `academy/public/`.

## Template Harness

- Real path is `templates/automation-test-harness-experimental/`, not `samples/`.
- Commands: `npm test`, `npm run test:auth`, `npm run report`, `npm run harness:intake`, `npm run harness:trace`.
- Focused Playwright run: `npx playwright test <test-file> --trace=on`.
- Base URL: `E2E_BASE_URL` or default `http://localhost:3000`; sample does not define app server.
- Evidence/output file: `.harness/records.jsonl`.
- Local subtree rule matters: scenario plan comes before test code; do not weaken assertions or patch failures with arbitrary sleeps.

## Content And Research Rules

- Do not reintroduce OpenAI Agents SDK examples into `docs/AI-Agent-Harness.md` unless user asks for SDK-specific section.
- Prefer executable/config truth over prose when conflicts appear.
- Prefer sourced facts over inference; label inference clearly.
- Keep feature tracking in instruction files if needed; do not create `feature_list.json`.

## Research Gotchas

- `https://openai.com/index/harness-engineering/` returned 403 via `webfetch`; browser automation worked.
- For OpenAI/Codex docs, prefer `openaiDeveloperDocs_*` tools first.
- OpenAI article diagrams contain important `alt` text; inspect it when summarizing implementation details.

## Verification

- For main seminar doc edits, grep for terms that should stay out when keeping it runtime-agnostic: `OpenAI|SDK|@openai|agents-js|Sandbox Agent|feature_list`.
- Verify referenced files exist before claiming them. Current repo has no `.pptx`.
- Root-level verification is usually targeted file reads/greps, not repo-wide test runs.
