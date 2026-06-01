# Agent Instructions

This repository is an experimental automation test harness for human-supervised AI testcase creation.

## Project Map

- `docs/harness/`: harness control-plane docs.
- `specs/`: human-reviewable test plans.
- `tests/`: Playwright test code, fixtures, and page objects.
- `reports/ai-generated/`: evidence reports from AI-assisted test work.
- `.claude/agents/`: Claude Code project subagents.
- `.claude/rules/`: Claude Code project rules.
- `scripts/bin/harness-cli.mjs`: lightweight local intake and trace recorder.

## Harness Entry Points

Before automation work, read:

- `docs/harness/HARNESS.md`
- `docs/harness/TEST_INTAKE.md`
- `docs/harness/CONTEXT_RULES.md`
- `docs/harness/TEST_MATRIX.md`
- `docs/harness/TRACE_SPEC.md`
- `docs/harness/REVIEW_CHECKLIST.md`
- `docs/harness/FAILURE_TAXONOMY.md`

## Operating Contract

- Test scenarios come before test code.
- Human approval gates are mandatory for Normal and High-risk lanes.
- Playwright tests must use stable semantic locators when available.
- Assertions must prove business behavior.
- Every AI-generated or AI-modified testcase needs an evidence report.

## Validation Commands

- Focused test: `npx playwright test <test-file> --trace=on`
- HTML report: `npx playwright show-report`
- Harness trace: `node scripts/bin/harness-cli.mjs trace --summary "<summary>" --outcome completed`

## Feature Tracking

- Current sample feature: Authentication login.
- Requirement source: `docs/product/authentication.md`.
- Expected scenario plan: `specs/auth-login.test-plan.md`.
- Expected test code: `tests/auth/login-valid.spec.ts`.
- Expected evidence: `reports/ai-generated/<run-id>.evidence.md`.
- Status: not generated. Use Claude Code to create scenario, code, and evidence from the harness.

## Definition Of Done

A task is done only when:

- Test intake or evidence summary exists.
- Scenario plan is human-approved.
- Test code follows repo conventions.
- Validation command was run or blocker is documented.
- Evidence report exists.
- Final response states changed files, proof, and limits.
