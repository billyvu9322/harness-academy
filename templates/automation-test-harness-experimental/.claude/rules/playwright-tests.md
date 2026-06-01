---
paths:
  - "tests/**/*.ts"
  - "playwright.config.ts"
---

# Playwright Test Rules

- Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, then `getByTestId`.
- Use CSS or XPath only when semantic locators are unavailable and explain why in the evidence report.
- Do not use `waitForTimeout` unless the approved test plan explicitly requires a time-based behavior check.
- Assertions must prove user-visible or business behavior.
- Do not delete assertions to make tests pass.
- Keep page objects focused on page actions and assertions that are reused by multiple tests.
