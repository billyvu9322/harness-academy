# Agent Instructions

## Repo Shape

- Root is a harness-engineering seminar/research workspace. There is no root `README`, root package manifest, root lockfile, CI, or root test config.
- Runnable projects live under subdirectories. Run commands from the project directory that owns the manifest/config.
- Do not invent root build, lint, test, or dev-server commands. Root verification is usually targeted Markdown/source checks with `grep`, `read`, and browser/web research.

## Main Files

- `AI-Agent-Harness.md`: primary seminar document. Keep it framework-agnostic unless the user explicitly asks for a vendor-specific section.
- `docs/OpenAI-Harness-Engineering.md`: sourced notes on OpenAI's harness engineering article plus related Codex docs. Snapshot date: 2026-05-31.
- `docs/Harness-Template-Flow.md`: notes from `hoangnb24/harness-experimental`; use for repo harness template, intake, risk lanes, context routing, trace/friction capture.
- `docs/Awesome-Harness-Engineering-Flow.md`: notes from `walkinglabs/awesome-harness-engineering`; use for field map, reliability loop, benchmarks, evals/observability framing.
- `academy/`: React/Vite site for Vietnamese Harness Academy content.
- `samples/automation-test-harness-experimental/`: sample Playwright automation-test harness with its own `AGENTS.md`.
- `.playwright-mcp/`: browser-tool artifacts from research. Treat as generated evidence, not source prose.

## Academy App

- Work from `academy/` for app commands.
- Commands from `academy/package.json`: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm lint`.
- `pnpm lint` is TypeScript only: `tsc --noEmit`.
- Both `pnpm-lock.yaml` and `yarn.lock` exist; README documents `pnpm install` or `npm install`. Prefer `pnpm` when adding examples because README uses it first.
- Content lives in `academy/content/{lectures,projects,skills,references}` and is auto-loaded by `academy/src/content/index.ts` via Vite `import.meta.glob` raw Markdown imports.
- Adding academy content requires frontmatter with at least `title`, `description`, `order`, `duration`, and `tags`; restart dev server if sidebar does not update.
- Routes are manual in `academy/src/router.tsx`; new content sections need route and collection wiring, not only Markdown files.
- Vite aliases: `@` -> `academy/src`, `@content` -> `academy/content`.

## Sample Harness

- Treat `samples/automation-test-harness-experimental/AGENTS.md` as authoritative inside that subtree.
- Commands from sample `package.json`: `npm test`, `npm run test:auth`, `npm run report`, `npm run harness:intake`, `npm run harness:trace`.
- Focused Playwright command: `npx playwright test <test-file> --trace=on` from `samples/automation-test-harness-experimental/`.
- Playwright uses `E2E_BASE_URL` or defaults to `http://localhost:3000`; no app server is defined in the sample.
- Harness CLI writes JSONL records to `samples/automation-test-harness-experimental/.harness/records.jsonl`.

## Content Rules

- Keep `AI-Agent-Harness.md` focused on harness approach, flow, and contents, not SDK tutorials.
- Do not reintroduce OpenAI Agents SDK code/examples unless the user asks for SDK-specific material.
- Keep feature tracking inside `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`; do not create `feature_list.json`.
- Prefer sourced facts over inference. Label inference when summarizing what OpenAI's approach implies.
- Preserve source URLs and snapshot dates in research notes.

## Research Gotchas

- `https://openai.com/index/harness-engineering/` returned 403 via `webfetch`; browser automation was able to read it.
- For OpenAI/Codex docs, prefer `openaiDeveloperDocs_*` tools when available, then browser/webfetch as fallback.
- When researching pages with diagrams, inspect image `alt` text; OpenAI's article diagrams contain important implementation details.

## Verification Patterns

- After edits, run focused grep checks for removed or required terms. Example: `OpenAI|SDK|@openai|agents-js|Sandbox Agent|feature_list` when keeping the main doc runtime-agnostic.
- For research notes, verify key terms exist rather than claiming completeness from memory.
- If a PowerPoint is requested, verify the `.pptx` exists before referencing it. No `.pptx` is currently present in this directory.

## Style

- Keep files concise, seminar-ready, and practical.
- Use Markdown headings and short bullets.
- Avoid generic agent advice unless it is tied to this workspace's harness-engineering content.
