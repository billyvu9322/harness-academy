@AGENTS.md

# Claude Code Instructions

Claude Code reads this file at session start. Keep this file short, stable, and specific.

## Claude Code Source Of Truth

- `CLAUDE.md` is the primary Claude Code entrypoint.
- `AGENTS.md` is imported for cross-agent compatibility.
- Project subagents are defined in `.claude/agents/`.
- Project skills are defined in `.claude/skills/`.
- Path-scoped rules are defined in `.claude/rules/`.
- Project-scoped MCP servers are defined in `.mcp.json`; this template enables Playwright MCP for live browser exploration.

## Required Workflow

For every AI-assisted automation task:

1. Restate the request as a test work item.
2. Classify the risk lane using `docs/harness/TEST_INTAKE.md`.
3. Create or update a test plan in `specs/` before writing test code.
4. Stop for human scenario approval unless the lane is Tiny and docs-only.
5. Generate Playwright code only from an approved scenario.
6. Run the focused validation command when available.
7. Write evidence under `reports/ai-generated/`.
8. Ask for human final review before claiming ready to merge.

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

## Project MCP

- Use Playwright MCP during planning when a live page is available and locators need discovery.
- Prefer `browser_snapshot` accessibility output over screenshots or guessed selectors.
- Use `/mcp` in Claude Code to approve or inspect the project-scoped Playwright server.

Important Claude Code behavior:

- Subagents are loaded from `.claude/agents/`.
- Each subagent file needs `name` and `description` frontmatter.
- Descriptions must say when to use the agent. Use `Use proactively when...` for automatic delegation.
- Non-fork subagents start with fresh context, their own prompt, and loaded `CLAUDE.md` memory.
- Subagents cannot spawn other subagents.
- `Agent(test-planner, test-generator, test-healer, test-reviewer)` is useful only when `automation-test-orchestrator` runs as the main session agent.

## Safety

- Do not read `.env` or secret files.
- Do not print credentials in reports.
- Do not weaken assertions to make a test pass.
- Do not add arbitrary sleeps as a default repair.
- Do not skip tests without a documented app, data, or environment blocker.
