# Test Intake

Use this gate before scenario or code generation.

## Input Types

- Azure DevOps work item (numeric ID): a bare number (e.g. `458232`) = an ADO work item. Resolve it first (see below) — its type decides the rest.
- User story: acceptance criteria from product or QA.
- Bug: defect that needs regression coverage.
- Manual testcase: existing manual steps to automate.
- Exploratory note: observed behavior that may need coverage.
- Regression gap: missing automated proof for known behavior.
- Harness improvement: change to AI workflow, docs, prompts, agents, fixtures, or evidence.

### Resolving an Azure DevOps ID

Before classifying the lane, fetch the item via the `ado` MCP (`wit_get_work_item <id>`) and read it
from Azure DevOps instead of asking the user:

- **Test Case** → Steps field (`Microsoft.VSTS.TCM.Steps`) = the scenario (actions + expected).
- **User Story / Bug** → Description + Acceptance Criteria / repro = the requirement.
- **Test Plan / Suite** → enumerate child cases; ask only which to automate if more than one.

Prereq: `ADO_ORG` set + `ado` MCP approved (`/mcp`) + signed in. If unavailable, that is the only
case where you ask the user for the work item details.

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
