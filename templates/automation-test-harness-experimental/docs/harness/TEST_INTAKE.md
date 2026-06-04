# Test Intake

Use this gate before scenario or code generation.

## Input Types

- User story: acceptance criteria from product or QA.
- Bug: defect that needs regression coverage.
- Manual testcase: existing manual steps to automate.
- Exploratory note: observed behavior that may need coverage.
- Regression gap: missing automated proof for known behavior.
- Harness improvement: change to AI workflow, docs, prompts, agents, fixtures, or evidence.

## Risk Lanes

### Tiny

Use for docs, names, narrow selector updates, or non-behavioral edits.

Proof: focused check if code changed and short evidence note.

### Normal

Use for one feature scenario, one manual testcase conversion, one page-object update, or one flaky test with clear cause.

Proof: human-approved scenario, focused command, evidence report.

### High-risk

Use for authentication, authorization, payment, order creation, user data, shared fixtures, global setup, CI config, or weak proof.

Proof: scenario approval, data/setup plan, focused test plus affected smoke subset when available, evidence report, explicit human approval.

## Intake Template

```md
# Test Intake

## Source
- Requester:
- Date:
- Source type:
- Link or reference:

## Restated Work Item
- Feature:
- Behavior to verify:
- Out of scope:

## Data Cases
> Tester owns input AND expected. Secrets stay in `.env` (reference as `<env>`), never inline.
> Mark each expected as verified (observed/confirmed) or not. See Test Data Policy in `CONTEXT_RULES.md`.

| Case ID | Input | Expected result | Expected verified? |
| --- | --- | --- | --- |
|  |  |  |  |

## Risk Lane
- Lane:
- Risk flags:
- Human approval required before code:

## Context To Read
- Product docs:
- Existing specs:
- Existing tests:
- Fixtures/page objects:

## Done Proof
- Scenario plan path:
- Test code path:
- Validation command:
- Required artifacts:
```
