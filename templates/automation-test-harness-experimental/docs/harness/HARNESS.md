# Automation Test Harness

The harness is the operating layer around this automation repo. It tells Claude Code how to receive tester intent, select context, generate reviewable scenarios, produce Playwright tests, validate results, and preserve evidence.

## Control Plane

- `CLAUDE.md`: Claude Code entrypoint.
- `.claude/agents/`: project subagents.
- `docs/harness/`: policy, workflow, context, proof, and review rules.
- `specs/`: approved or draft test plans.
- `reports/ai-generated/`: evidence records.

## Execution Plane

- `tests/`: Playwright test code.
- `tests/fixtures/`: reusable fixtures.
- `tests/pages/`: page objects.
- `playwright.config.ts`: runner configuration.
- `test-results/` and `playwright-report/`: runtime artifacts.

## Human-In-The-Loop Rule

Claude Code may draft, run, inspect, and propose repairs. Humans approve:

- test scenario scope;
- code changes;
- final result;
- merge decisions.

## Main Flow

```text
tester request
  -> intake and risk lane
  -> context routing
  -> AI-generated test plan
  -> human scenario review
  -> AI-generated Playwright code
  -> focused execution
  -> failure attribution and safe repair
  -> evidence report
  -> human final approval
```

## Done Definition

A task is done only when the scenario is approved, code follows repo conventions, focused validation is run or blocked with reason, evidence exists, and human final decision is recorded.
