# Review Checklist

Use this checklist before approving AI-generated scenarios and code.

## Scenario Review

- Requirement is restated correctly.
- Scope and out-of-scope items are clear.
- Preconditions are realistic.
- Steps match real user behavior.
- Expected results prove business value.
- Negative paths are included when relevant.
- Test data is safe and maintainable.

## Code Review

- Test name maps to scenario ID.
- Code follows existing fixtures and page objects.
- Locators are semantic and stable.
- Assertions verify outcomes, not implementation details.
- No arbitrary sleep.
- No skipped test without documented blocker.
- Test can run independently or states dependency clearly.

## Evidence Review

- Command is recorded.
- Result or blocker is recorded.
- Artifacts are linked when available.
- Failure is classified honestly.
- Human decision is recorded.
