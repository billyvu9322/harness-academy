# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First

- `AGENTS.md` at repo root is the canonical operating doc for this workspace. Follow it. This file only adds Claude-specific notes and corrections.
- `docs/AI-Agent-Harness.md` is the primary seminar artifact. Keep it framework-agnostic; do not reintroduce OpenAI Agents SDK code/examples unless the user asks.
- `docs/OpenAI-Harness-Engineering.md`, `docs/Harness-Template-Flow.md`, `docs/Awesome-Harness-Engineering-Flow.md`, `docs/Viblo-Harness-Engineering.md` are sourced research notes — preserve source URLs and snapshot dates when editing.

## Repo Shape

No root build, lint, test, or CI. Runnable projects live in subdirectories — run commands from the project directory that owns the manifest.

Three runnable subtrees:

| Path | What | Manifest |
|------|------|----------|
| `academy/` | Vite + React 19 site (Vietnamese Harness Academy content) | `package.json` (pnpm) |
| `assistant/` | Turborepo monorepo: `apps/api` (Fastify agent harness), `apps/web` (React 18 chat UI + embeddable widget), `packages/shared` (Zod contracts) | `package.json` + `turbo.json` + `pnpm-workspace.yaml` |
| `templates/automation-test-harness-experimental/` | Sample Playwright harness — has its own `AGENTS.md` + `CLAUDE.md`; treat those as authoritative inside that subtree | `package.json` |

Note: root `AGENTS.md` references the sample harness as `samples/automation-test-harness-experimental/` — actual path is `templates/automation-test-harness-experimental/`. Same content, different folder.

## Commands By Subtree

### `academy/` (pnpm preferred, npm works)

- `pnpm dev` — Vite dev on `localhost:5173`
- `pnpm build` — `tsc -b && vite build`
- `pnpm preview` — preview built `dist/`
- `pnpm lint` — typecheck only (`tsc --noEmit`); no ESLint configured
- Vite aliases: `@` → `academy/src`, `@content` → `academy/content`

### `assistant/` (Turborepo, pnpm@10.12.4)

- `pnpm install` then `pnpm dev` (turbo `--parallel`)
- `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test` — all routed through turbo
- DB: `pnpm db:generate` and `pnpm db:migrate` (forwarded to `@assistant/api`); local Postgres via `docker compose up -d`
- Eval (live, LLM-judge): `pnpm eval`
- Widget: `pnpm --filter @assistant/web build:widget` — builds the one-file embed (Vite lib mode) **and** copies it to `academy/public/assistant-widget.js`
- Deploy artifact: `pnpm package:zip` — syncs corpus then zips `assistant/` (excludes `node_modules`/`dist`/`.env*`); see `assistant/Dockerfile` + `docker-compose.yml`
- **`assistant/AGENTS.md` is canonical for the harness** — full architecture, request-flow layers, SSE event contract, and scope rules. Read it before changing the agent. Keep `packages/shared` as the source of truth for cross-app contracts; do not add retrieval/orchestration/persistence without explicit scope expansion.

### `templates/automation-test-harness-experimental/`

- `npm test`, `npm run test:auth`, `npm run report`, `npm run harness:intake`, `npm run harness:trace`
- Focused: `npx playwright test <test-file> --trace=on` from that directory
- Playwright base URL: `E2E_BASE_URL` or `http://localhost:3000` (no app server defined in this sample)
- Harness CLI writes JSONL to `.harness/records.jsonl`

## Academy Content Pipeline

- Markdown in `academy/content/{lectures,projects,skills,references}` auto-loads via Vite `import.meta.glob` raw imports in `academy/src/content/index.ts`.
- Required frontmatter: `title`, `description`, `order`, `duration`, `tags`.
- Routes are **manual** in `academy/src/router.tsx` — a new content section needs route + collection wiring, not just a Markdown file.
- Restart dev server if sidebar does not update after adding content.

## Assistant ↔ Academy Widget (cross-repo)

The academy embeds the assistant chat as a self-contained widget — the two subtrees are coupled at one seam:

- `assistant` builds `dist-widget/assistant-widget.js` (custom element `<harness-assistant>`, Shadow DOM, Tailwind + React bundled in) and `scripts/copy-widget.mjs` writes it to `academy/public/assistant-widget.js`. The committed copy in `academy/public/` is a **build output** — regenerate it with `build:widget`, don't hand-edit.
- `academy/src/components/RootLayout.tsx` injects the script and mounts `<harness-assistant>` at **body root level (after the footer, not inside the header)** — the header's `backdrop-blur` (a `backdrop-filter`) would otherwise become the containing block for the widget's `position:fixed` panel and trap it under the header.
- Widget config flows through `data-*` attributes: `data-api-base-url` (from `VITE_ASSISTANT_API_URL`), `data-academy-route`, `data-academy-title` (read from the page's `main h1`).
- The API origin must be in the assistant's `WEB_ORIGINS` allowlist (`config/origins.ts`) — honored by both `@fastify/cors` and the hijacked SSE route's manual ACAO header.

## Content Rules

- Keep `docs/AI-Agent-Harness.md` focused on harness approach/flow/contents, not SDK tutorials.
- Feature tracking belongs in `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` — do not create `feature_list.json`.
- Prefer sourced facts; label inference explicitly when summarizing what a source implies.

## Research Gotchas

- `https://openai.com/index/harness-engineering/` returns 403 to `webfetch` — browser automation worked. For OpenAI/Codex docs, try `openaiDeveloperDocs_*` tools first, then browser/webfetch.
- OpenAI's article diagrams carry real implementation detail in `alt` text — inspect it.

## Verification

- After edits to `docs/AI-Agent-Harness.md`, grep for terms that must stay out when runtime-agnostic: `OpenAI|SDK|@openai|agents-js|Sandbox Agent|feature_list`.
- Verify referenced files exist before claiming they do (e.g. no `.pptx` is present in the repo currently).

## Safety

- Do not read `.env` files or print credentials.
- Sample harness rule (inside `templates/automation-test-harness-experimental/`): never weaken assertions, never add arbitrary sleeps as repair, never skip tests without a documented blocker.
