# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First

- `AGENTS.md` at repo root is the canonical operating doc for this workspace. Follow it. This file only adds Claude-specific notes and corrections.
- `AI-Agent-Harness.md` is the primary seminar artifact. Keep it framework-agnostic; do not reintroduce OpenAI Agents SDK code/examples unless the user asks.
- `docs/OpenAI-Harness-Engineering.md`, `docs/Harness-Template-Flow.md`, `docs/Awesome-Harness-Engineering-Flow.md` are sourced research notes — preserve source URLs and snapshot dates when editing.

## Repo Shape

No root build, lint, test, or CI. Runnable projects live in subdirectories — run commands from the project directory that owns the manifest.

Three runnable subtrees:

| Path | What | Manifest |
|------|------|----------|
| `academy/` | Vite + React 19 site (Vietnamese Harness Academy content) | `package.json` (pnpm) |
| `assistant/` | Turborepo monorepo: `apps/api`, `apps/web`, `packages/shared` | `package.json` + `turbo.json` + `pnpm-workspace.yaml` |
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
- DB: `pnpm db:generate` and `pnpm db:migrate` (forwarded to `@assistant/api`)
- See `assistant/AGENTS.md` for scope rules — keep `packages/shared` as the source of truth for cross-app contracts; do not add retrieval/orchestration/persistence without explicit scope expansion.

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

## Content Rules

- Keep `AI-Agent-Harness.md` focused on harness approach/flow/contents, not SDK tutorials.
- Feature tracking belongs in `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` — do not create `feature_list.json`.
- Prefer sourced facts; label inference explicitly when summarizing what a source implies.

## Research Gotchas

- `https://openai.com/index/harness-engineering/` returns 403 to `webfetch` — browser automation worked. For OpenAI/Codex docs, try `openaiDeveloperDocs_*` tools first, then browser/webfetch.
- OpenAI's article diagrams carry real implementation detail in `alt` text — inspect it.

## Verification

- After edits to `AI-Agent-Harness.md`, grep for terms that must stay out when runtime-agnostic: `OpenAI|SDK|@openai|agents-js|Sandbox Agent|feature_list`.
- Verify referenced files exist before claiming they do (e.g. no `.pptx` is present in the repo currently).

## Safety

- Do not read `.env` files or print credentials.
- Sample harness rule (inside `templates/automation-test-harness-experimental/`): never weaken assertions, never add arbitrary sleeps as repair, never skip tests without a documented blocker.
