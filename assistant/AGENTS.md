# Assistant Instructions

## Scope

- `apps/api/` owns API shell, env wiring, route shells, DB shell modules.
- `apps/web/` owns chat UI shell, client helpers, route shell, local UI state.
- `packages/shared/` owns cross-app TypeScript and Zod contracts.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Generate migrations: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`

## Rules

- Keep phase scoped to scaffold unless user asks for feature work.
- Keep shared contracts source of truth for API and web shells.
- Prefer structured SSE events over raw text streams in transport helpers.
- Do not add retrieval, agent orchestration, or persistence logic without explicit scope expansion.
