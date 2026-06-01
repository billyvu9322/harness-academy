---
name: ai-automation-test-harness
description: Use whenever a tester asks Claude Code to create automation scenarios, generate test code, run AI-assisted validation, repair failing tests, or produce evidence in this harness. This is the primary workflow skill for human-in-the-loop automation test generation.
---

# AI Automation Test Harness Skill

Use this skill to operate the repo harness from tester request to reviewed evidence.

## Core Rule

AI drafts. Tester reviews. Evidence proves. Human approves.

Do not jump from vague request to test code. Scenario plan comes first.

## Required Flow

1. Intake: restate tester request as a test work item.
2. Risk lane: classify as Tiny, Normal, or High-risk using `docs/harness/TEST_INTAKE.md`.
3. Context: read only context needed for current phase using `docs/harness/CONTEXT_RULES.md`.
4. Plan: create or update `specs/<feature>.test-plan.md`.
5. Approval: stop for human scenario approval on Normal and High-risk lanes.
6. Generate: create Playwright code only after approval.
7. Validate: run focused command if app and dependencies are available.
8. Attribute: classify failures using `docs/harness/FAILURE_TAXONOMY.md`.
9. Evidence: write `reports/ai-generated/<run-id>.evidence.md`.
10. Review: ask for human final review before merge readiness.

## Role Routing

- Use `test-planner` for intake and scenario planning.
- Use `test-generator` only after scenario approval.
- Use `test-healer` for focused run, failure attribution, and safe repair.
- Use `test-reviewer` after generated or modified scenario, code, or evidence.
- Use `automation-test-orchestrator` as main session agent for full chained flow.

## Stop Conditions

Stop and ask human when:

- Requirement is ambiguous.
- Scenario is not approved.
- Expected behavior must change.
- Failure appears to be an app bug.
- Shared fixture, CI config, auth, payment, or data lifecycle needs broad changes.
- Validation cannot run because environment is missing.

## Evidence Requirements

Every AI-generated or AI-modified testcase needs evidence with:

- feature and scenario ID
- risk lane
- files created or updated
- command run or blocker
- artifacts produced
- failure attribution
- human review decision

## Harness Improvement Loop

If the same confusion or failure happens twice, propose a harness improvement:

- improve `CONTEXT_RULES.md` for missing context
- improve `TEST_MATRIX.md` for weak proof
- improve `.claude/agents/` for bad delegation
- improve `.claude/skills/` for repeated workflow guidance
- improve fixtures or page objects for repeated setup friction
