# Context Rules

Claude Code should load context by phase and risk lane. Do not load the whole repo by default.

## Phase Routing

| Phase | Required context |
| --- | --- |
| Intake | `CLAUDE.md`, `docs/harness/TEST_INTAKE.md`, tester request |
| Planning | Product docs, similar specs, relevant existing tests, live page via Playwright MCP (locator discovery) |
| Generation | Approved spec, adjacent tests, fixtures, page objects, selector policy |
| Validation | Test matrix, validation command, generated test, artifacts |
| Review and trace | Review checklist, trace spec, evidence report |

## Lane Budgets

- Tiny: entrypoint, relevant file, validation command.
- Normal: entrypoint, intake, approved spec, adjacent tests, fixtures, page objects.
- High-risk: entrypoint, intake, product docs, decisions, test matrix, setup fixtures, CI notes, prior evidence.

## Locator Discovery Policy

How to obtain accurate locators before generation. **Default: discover live, do not guess.**

1. **Input is a URL + how to reach the state, not selectors.** The tester provides the page
   URL plus whatever is needed to reach the target state (credentials via gitignored `.env`,
   seed data, route). The tester does not need to list selectors up front.
2. **AI discovers via Playwright MCP.** During Planning, drive the live page: `navigate` →
   `browser_snapshot` (accessibility tree, not screenshot) to read real `role` + accessible
   `name`. Where it clarifies the success state, perform the action (e.g. log in) and snapshot
   the resulting page so assertions target observed business behavior, not guesses.
3. **Record a locator table in the test plan.** Every `specs/<feature>.test-plan.md` lists each
   element with its chosen locator. This table is the human control point — the reviewer edits,
   corrects, or pins preferred `data-testid`s here, **before** any code is generated.
4. **Generate only from the approved table.** Page objects/tests use the approved locators.
5. **Validation confirms resolution.** The focused run proves locators resolve; unresolved
   locators are a generation defect to fix, not to weaken.

Locator priority (see `.claude/rules/playwright-tests.md`): `getByRole` → `getByLabel` →
`getByPlaceholder` → `getByText` → `getByTestId` → CSS/XPath (last resort, justify in evidence).

**When to hand the AI a locator list instead of auto-discovering:**

- The page is unreachable by the agent (auth wall it cannot pass, VPN, local-only, special
  data state). Provide URL + sample DOM/HTML + the locator list. The AI generates but **cannot
  verify** → mark validation blocked per `TEST_INTAKE.md`.
- DOM has no stable accessible names → AI proposes adding `data-testid` to the app first; human
  decides before generation.
- A design-system test-id contract must be enforced → provide the canonical test-id list; AI
  uses `getByTestId`.

## Test Data Policy

Who owns the data, and where each kind lives. The tester owns intent + input + expected;
the AI implements and verifies.

**Ownership**

- Tester provides: feature, behavior to verify, input values, **and the expected result (the oracle).**
- The AI must **not** invent expected results. Missing or ambiguous expected → stop and ask
  (see `TEST_INTAKE.md` stop conditions).
- The AI discovers locators (see Locator Discovery Policy), writes code, and runs it.

**Where data lives, by type**

| Type | Location | Rule |
| --- | --- | --- |
| Secret (password, token, API key) | gitignored `.env` → `process.env` | never in spec, code, or evidence; reference as `<env>` |
| Ordinary test data (inputs, expected text) | data-cases table in `specs/*.test-plan.md` + a data module (e.g. `tests/<area>/<feature>.data.ts`) | reviewable, separated from test logic |
| Seed data (pre-existing records) | fixture / API setup, listed under the plan's **Preconditions** | reproducible |

**Data-driven**

- Multiple input combinations = one data-cases table → one parametrized test (loop), not copy-paste.
- One row = one intent (valid / invalid / edge). Each row has `id`, input, and `expect`.
- Mark each expected outcome as verified or not. **Unverified expected outcomes must be confirmed
  by the tester (or observed live) before those cases are generated as code.**
- Sample: `tests/auth/login.data.ts`.

## Claude Code Specifics

- Root `CLAUDE.md` is loaded at session start.
- `AGENTS.md` is only loaded because `CLAUDE.md` imports it.
- `.claude/rules/` files can be path-scoped and load when matching files are worked on.
- Custom subagents start with fresh context and their own prompt; include enough task context when delegating.
- Built-in Explore and Plan subagents skip `CLAUDE.md`; restate critical constraints if using them for research.
