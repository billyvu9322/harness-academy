# Claude Code Instructions

Claude Code reads this file at session start. Keep this file short, stable, and specific.

## Claude Code Source Of Truth

- `CLAUDE.md` is the primary Claude Code entrypoint.
- `AGENTS.md` is the standalone cross-agent baseline (Codex, Cursor, others); keep it in sync with this file.
- Project subagents are defined in `.claude/agents/`.
- Project skills are defined in `.claude/skills/`.
- Path-scoped rules are defined in `.claude/rules/`.
- Project-scoped MCP servers are defined in `.mcp.json`; this template enables Playwright MCP for live browser exploration.

## Required Workflow

For every AI-assisted automation task:

1. Restate the request as a test work item.
2. **Resolve external IDs.** A bare numeric ID in a request (e.g. `458232`) is an **Azure DevOps work item ID**. Fetch it via the `ado` MCP (`wit_get_work_item`) and read its **type and fields** from Azure DevOps — do NOT ask the user what the ID is. Use its content as the requirement (see "Azure DevOps work items" below).
3. Classify the risk lane using `docs/harness/TEST_INTAKE.md`.
4. Create or update a test plan in `specs/` before writing test code. When the request
   carries a **URL + user flow**, do live discovery first to capture real locators — the
   `test-planner` subagent walks the flow with **agent-browser** (primary; Playwright MCP
   is the fallback) and records stable locators into the plan. See "Live discovery" below.
5. Stop for human scenario approval unless the lane is Tiny and docs-only.
6. Generate Playwright code only from an approved scenario.
7. Run the focused validation command when available.
8. Write evidence under `reports/ai-generated/`.
9. Ask for human final review before claiming ready to merge.

## Subagent Orchestration

Use project subagents when the task matches their descriptions:

- `test-planner`: scenario planning only, no test code.
- `test-generator`: approved scenario to Playwright code.
- `test-healer`: run focused tests, inspect artifacts, classify failures, repair only test/setup bugs.
- `test-reviewer`: review scenario, code, and evidence.
- `automation-test-orchestrator`: optional main session agent for chained planner -> generator -> healer -> reviewer flow.

## Project Skills

Claude Code discovers project skills from `.claude/skills/`.

- `ai-automation-test-harness`: load for the full human-in-the-loop automation workflow.
- `playwright-testing`: load for Playwright Test code, locators, fixtures, traces, and repairs.

Subagents preload these skills through their `skills:` frontmatter where relevant.

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

## Live discovery (locators from a real page)

When planning needs locators off a live page (request carries a URL + user flow):

- **agent-browser is the primary discovery tool**; Playwright MCP is the fallback when the
  CLI is unavailable. The `test-planner` subagent owns this step (it has `Bash` +
  the `agent-browser` skill).
- The CLI is installed in this project's `node_modules`, **not on PATH** — invoke it as
  `npx agent-browser <command>`. Load mechanics first: `npx agent-browser skills get core`.
- Walk the flow: `open <url>` → `snapshot -i` at each screen, re-snapshotting after every
  page change (refs go stale). Record **stable** locators (role+name / label / placeholder /
  testid), not the ephemeral `@eN` refs — they map 1:1 to Playwright `getByRole/getByLabel/
  getByPlaceholder/getByTestId`. Put them in the plan's locator strategy.
- Auth: use agent-browser's auth vault or `state save`; never read `.env`, never put the
  password on the command line. `agent-browser close` when done.

## Project MCP

- Playwright MCP is the **fallback** discovery tool (see "Live discovery" above) — use it
  when agent-browser is unavailable.
- Prefer `browser_snapshot` accessibility output over screenshots or guessed selectors.
- Use `/mcp` in Claude Code to approve or inspect the project-scoped servers.

### Azure DevOps MCP (`ado`)

- Package `@azure-devops/mcp` (https://github.com/microsoft/azure-devops-mcp). Use to pull work
  items / acceptance criteria into intake, link tests to PRs, or file test work items.
- **Org name is set directly in `.mcp.json`** (the `<org>` in `dev.azure.com/<org>`, e.g.
  `add-on-products`). Change that arg if your org differs. (Env expansion `${ADO_ORG}` does NOT read
  the project `.env` — `.env` is only loaded by `playwright.config.ts` for tests, not by the MCP
  server — so the org is hardcoded here instead.)
- **Auth:** on the first `ado` tool call a browser opens for Microsoft sign-in. For Azure CLI auth
  instead, run `az login` and add `"--authentication", "azcli"` to the `ado` args in `.mcp.json`.
- Approve the server once via `/mcp`. Do not commit org-specific values or tokens.

Important Claude Code behavior:

- Subagents are loaded from `.claude/agents/`.
- Each subagent file needs `name` and `description` frontmatter.
- Descriptions must say when to use the agent. Use `Use proactively when...` for automatic delegation.
- Non-fork subagents start with fresh context, their own prompt, and loaded `CLAUDE.md` memory.
- Subagents cannot spawn other subagents.
- `Agent(test-planner, test-generator, test-healer, test-reviewer)` is useful only when `automation-test-orchestrator` runs as the main session agent.

## Test Config (non-secret, readable)

- **Live base URL + test username live in `tests/test-config.ts`** (committed). Read that file to
  get the URL for a discovery pass — do NOT ask the user for it, and do NOT read `.env`.
- The **password is the only secret** — it stays in the gitignored `.env` as `E2E_PASSWORD`.
- Tests/setup import `BASE_URL`, `USERNAME`, `PASSWORD` from `tests/test-config.ts` (which loads
  `.env` for the secret). `playwright.config.ts` uses `BASE_URL` as the Playwright base URL.

## Test Suite Architecture

Tests now exist under `tests/` (the README still says "intentionally absent" — that line is
stale; do not trust it). Layout: `tests/auth.setup.ts`, `tests/pages/*.page.ts` (page objects),
`tests/<area>/*.spec.ts` (specs, e.g. `auth/`, `root/`), `tests/test-config.ts` (config).

**Auth runs once, not per test.** `playwright.config.ts` defines two projects:

- `setup` project — runs `tests/auth.setup.ts`, which logs in via `LoginPage`, asserts it reached
  `/root/organizations`, then saves the authenticated session to `playwright/.auth/user.json`
  (`storageState`).
- `chromium` project — `dependencies: ["setup"]` + `storageState: playwright/.auth/user.json`, so
  every spec starts already signed in. **Do not add per-test login** — reuse the stored session.

Consequences for generated code:
- A new authenticated spec needs no login step; it inherits `user.json`.
- A test of the login flow itself belongs in the `setup`/unauthenticated path, not the `chromium`
  project (which is pre-authenticated).
- `setup.skip(!USERNAME || !PASSWORD, ...)` is the documented blocker when `E2E_PASSWORD` is unset — that is the allowed skip, not a workaround.
- Live target: `BASE_URL`, post-login route is `/root/organizations` (see `auth.setup.ts` assertions).

## Harness CLI

`scripts/bin/harness-cli.mjs` writes/reads JSONL at `.harness/records.jsonl`. Beyond the
`harness:intake` / `harness:trace` npm scripts, it has an undocumented `query` subcommand:

- `node scripts/bin/harness-cli.mjs query all|intakes|traces` — read back recorded events.

## Safety

- Do not read `.env` or secret files. Non-secret config (base URL, username) is in
  `tests/test-config.ts`, not `.env`.
- Do not print credentials in reports.
- Do not weaken assertions to make a test pass.
- Do not add arbitrary sleeps as a default repair.
- Do not skip tests without a documented app, data, or environment blocker.
