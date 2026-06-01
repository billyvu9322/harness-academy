---
name: playwright-testing
description: Use whenever creating, reviewing, repairing, or explaining Playwright Test code, locators, fixtures, page objects, traces, screenshots, or browser E2E validation in this automation harness.
paths:
  - "tests/**/*.ts"
  - "playwright.config.ts"
---

# Playwright Testing Skill

Use this skill for Playwright Test work in this repository.

## Test Design Rules

- Generate tests only from an approved scenario in `specs/` unless the task is Tiny lane maintenance.
- Keep each test focused on one behavior.
- Prefer user-visible behavior over implementation details.
- Put repeated page operations in `tests/pages/` only when reuse is clear.
- Put shared setup in `tests/fixtures/` only when multiple specs need it.

## Locator Policy

Preferred locator order:

1. `page.getByRole()` with accessible name.
2. `page.getByLabel()` for form controls.
3. `page.getByPlaceholder()` when label is unavailable.
4. `page.getByText()` for stable user-visible text.
5. `page.getByTestId()` if the product has a stable test id contract.
6. CSS or XPath only when no semantic locator exists; document the reason in evidence.

## Assertion Policy

- Use Playwright web-first assertions: `toBeVisible`, `toHaveURL`, `toHaveText`, `toBeEnabled`, `toHaveValue`.
- Assert business outcomes, not just element presence.
- For negative tests, assert both error state and absence of forbidden success state.
- Do not delete or weaken assertions to make a test pass.
- Do not add `waitForTimeout` as a default fix.

## Fixture Policy

- Use fixtures for reusable test objects and setup.
- Do not hide important business steps inside fixtures if the scenario requires those steps to be visible.
- Keep secrets in environment variables or secure CI secret storage.
- Fail fast when required env vars are missing.

## Trace And Debug Flow

When a Playwright test fails:

1. Run the narrowest focused command.
2. Read the error output first.
3. Inspect trace, screenshot, or video if available.
4. Classify failure as app bug, test bug, data/setup bug, or environment bug.
5. Repair only test or setup bugs.
6. Update evidence report.

## Output Expectations

When writing Playwright code, include:

- spec reference comment, e.g. `// spec: specs/auth-login.test-plan.md`
- scenario reference comment, e.g. `// scenario: TC-AUTH-001`
- semantic locators where possible
- meaningful assertions mapped to expected results
- focused validation command in the evidence report
