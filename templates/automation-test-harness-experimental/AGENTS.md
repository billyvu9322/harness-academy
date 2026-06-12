# Agent Instructions

This repository is an automation test harness sample (TypeScript + Playwright Test). AI agents may help draft test scenarios, generate test code, run focused validation, inspect artifacts, and prepare evidence. Humans approve scenarios, code, and merge decisions.

Claude Code users: `CLAUDE.md` is the Claude-specific entrypoint (subagents, skills, MCP, live-discovery mechanics). This file is the cross-agent baseline — any agent tool can operate from it alone. Keep the two in sync.

## Harness Entry Points

Before test work, read:

- `docs/harness/HARNESS.md` — collaboration model, control plane vs execution plane
- `docs/harness/TEST_INTAKE.md` — classify the request and choose a risk lane
- `docs/harness/CONTEXT_RULES.md` — what to read by phase and lane, locator + test data policy
- `docs/harness/TEST_MATRIX.md` — behavior-to-proof matrix
- `docs/harness/TRACE_SPEC.md` — evidence requirements
- `docs/harness/REVIEW_CHECKLIST.md` — human review checklist
- `docs/harness/FAILURE_TAXONOMY.md` — app bug vs test bug vs data/setup bug vs environment bug

## Workflow Rules

- Restate every request as a test work item first (`docs/harness/TEST_INTAKE.md` template).
- Create or update a test plan in `specs/` before writing test code.
- Do not generate test code until a human approves the scenario, unless the lane is Tiny and docs-only.
- Follow existing page objects (`tests/pages/`), naming, and folder structure (`tests/<area>/*.spec.ts`).
- Prefer semantic Playwright locators: role, label, placeholder, text, then test id. CSS/XPath last resort, justified in evidence.
- Do not use `waitForTimeout` as a default fix.
- Do not delete or weaken assertions to make a test pass.
- Do not skip tests without a documented app, data, or environment blocker.
- Classify failures with `docs/harness/FAILURE_TAXONOMY.md` before repairing anything.
- Write an evidence report in `reports/ai-generated/` after AI-generated or AI-modified tests.

## Test Config And Secrets

- Non-secret config (live base URL, test username) is committed in `tests/test-config.ts` — read it from there; do not ask the user, do not read `.env`.
- The password is the only secret: gitignored `.env`, key `E2E_PASSWORD`. Never print it or put it on a command line.
- Auth runs once via the `setup` Playwright project (`tests/auth.setup.ts` → `playwright/.auth/user.json`). Authenticated specs inherit that storage state — do not add per-test login.

## Validation Commands

- Install dependencies: `npm install` (or `yarn`)
- Run all tests: `npm test`
- Run focused auth smoke: `npm run test:auth`
- Run one spec: `npx playwright test <test-file> --trace=on`
- Open HTML report: `npm run report`
- Record intake/trace events: `npm run harness:intake` / `npm run harness:trace` (JSONL in `.harness/records.jsonl`)

## Definition Of Done

A test task is done only when:

- Scenario plan exists in `specs/` and is human-approved.
- Test code follows repo patterns.
- Focused validation command was run, or the blocker is documented.
- Evidence report exists in `reports/ai-generated/`.
- Final response states changed files, proof, and limits.
