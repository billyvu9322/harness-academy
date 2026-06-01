# Context Rules

Claude Code should load context by phase and risk lane. Do not load the whole repo by default.

## Phase Routing

| Phase | Required context |
| --- | --- |
| Intake | `CLAUDE.md`, `docs/harness/TEST_INTAKE.md`, tester request |
| Planning | Product docs, similar specs, relevant existing tests |
| Generation | Approved spec, adjacent tests, fixtures, page objects, selector policy |
| Validation | Test matrix, validation command, generated test, artifacts |
| Review and trace | Review checklist, trace spec, evidence report |

## Lane Budgets

- Tiny: entrypoint, relevant file, validation command.
- Normal: entrypoint, intake, approved spec, adjacent tests, fixtures, page objects.
- High-risk: entrypoint, intake, product docs, decisions, test matrix, setup fixtures, CI notes, prior evidence.

## Claude Code Specifics

- Root `CLAUDE.md` is loaded at session start.
- `AGENTS.md` is only loaded because `CLAUDE.md` imports it.
- `.claude/rules/` files can be path-scoped and load when matching files are worked on.
- Custom subagents start with fresh context and their own prompt; include enough task context when delegating.
- Built-in Explore and Plan subagents skip `CLAUDE.md`; restate critical constraints if using them for research.
