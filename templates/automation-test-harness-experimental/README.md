# Automation Test Harness Experimental

This sample repository shows how to turn an automation test repo into a Claude Code-ready harness for AI-assisted test scenario and Playwright test generation.

The harness is built for testers. Claude Code drafts scenarios, generates test code, runs focused checks, diagnoses failures, and writes evidence. Humans approve scenarios, code, and final merge decisions.

## Reusable Blueprint

This README explains how this sample repository works. See [`HARNESS-BLUEPRINT.md`](HARNESS-BLUEPRINT.md) for the reusable automation-test harness blueprint: recommended repo surface, workflow contracts, prompt templates, review gates, evidence format, and adoption guide for applying this pattern to another QA automation repo.

## What This Sample Demonstrates

- `CLAUDE.md` as the primary Claude Code entrypoint.
- `AGENTS.md` as a compatibility file imported by `CLAUDE.md` for other agent tools.
- Project subagents under `.claude/agents/` with Claude Code frontmatter.
- Project skills under `.claude/skills/` for Playwright and AI automation workflow guidance.
- Project-scoped Playwright MCP in `.mcp.json` for live browser exploration and locator discovery.
- Harness control-plane docs under `docs/harness/`.
- Human-in-the-loop automation workflow from intake to evidence.
- A sample login testcase generated from an approved test plan.
- A lightweight `scripts/bin/harness-cli.mjs` for local trace and intake records.

## Architecture From `docs/AI-Agent-Harness.md`

This sample applies the architecture described in `../../docs/AI-Agent-Harness.md` to the automation testing domain. The original seminar document defines a harness as the system around the model that controls context, tools, environment, state, safety, verification, recovery, and observability. In this sample, those abstract layers become concrete repo files and Claude Code workflows for testers.

### Five-Subsystem Harness Model

`docs/AI-Agent-Harness.md` describes five practical subsystems: instructions, tools, environment, state, and feedback. This repo maps them as follows:

| Harness subsystem | Automation test implementation |
| --- | --- |
| Instructions | `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, `.claude/skills/`, `docs/harness/` |
| Tools | Claude Code file/search/edit tools, Playwright commands, `scripts/bin/harness-cli.mjs`, subagent tool allowlists |
| Environment | `package.json`, `playwright.config.ts`, documented `E2E_BASE_URL` and credential env vars |
| State | Feature tracking in `AGENTS.md`, generated `specs/`, evidence in `reports/ai-generated/`, optional `.harness/records.jsonl` |
| Feedback | Focused Playwright runs, traces, screenshots, HTML reports, reviewer findings, human approval decisions |

The key adaptation: feedback is not only test pass/fail. For automation testing, feedback includes whether the generated scenario matches the requirement, whether assertions prove business behavior, and whether evidence is reviewable by a QA lead.

### Control Plane vs Execution Plane

`docs/AI-Agent-Harness.md` separates trusted orchestration from risky execution. This sample uses the same split:

| Plane | Files in this sample | Responsibility |
| --- | --- | --- |
| Control plane | `CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `docs/harness/`, `docs/product/`, `docs/decisions/` | Intent, rules, risk lane, context routing, role orchestration, approval gates, proof expectations |
| Execution plane | `tests/`, `playwright.config.ts`, `test-results/`, `playwright-report/`, browser runtime | Generated Playwright code, fixture execution, browser actions, command output, trace artifacts |

This prevents Claude Code from treating test generation as a direct code-writing task. The control plane first turns tester intent into a reviewed test contract. The execution plane runs the approved automation and returns evidence.

### General Harness Flow Adapted For Test Automation

`docs/AI-Agent-Harness.md` defines the general flow:

```text
Human goal
  -> Spec / task contract
  -> Context builder
  -> Agent runtime
  -> Tool and execution layer
  -> Observation stream
  -> Verifier / evaluator
  -> Trace, evidence, state update
```

This sample turns that into an automation-test flow:

```text
Tester requirement
  -> Test intake in `docs/harness/TEST_INTAKE.md`
  -> Risk lane: Tiny / Normal / High-risk
  -> Context routing from `docs/harness/CONTEXT_RULES.md`
  -> Draft scenario in `specs/`
  -> Human scenario approval
  -> Playwright code generation under `tests/`
  -> Focused Playwright run
  -> Failure attribution from `docs/harness/FAILURE_TAXONOMY.md`
  -> Evidence report in `reports/ai-generated/`
  -> Human final review
```

The important pattern is contract-before-code. Claude Code should not generate Playwright code from a vague prompt. It must first produce a test plan that a tester can review.

### Multi-Agent Harness Pattern

`docs/AI-Agent-Harness.md` describes planner, generator/builder, evaluator/QA, and reviewer roles. This sample implements those roles as Claude Code project subagents:

| Seminar role | Sample subagent | Responsibility |
| --- | --- | --- |
| Planner | `.claude/agents/test-planner.md` | Converts requirement into reviewable test plan. No test code. |
| Generator / Builder | `.claude/agents/test-generator.md` | Converts approved scenario into Playwright code. |
| Evaluator / QA | `.claude/agents/test-healer.md` | Runs focused tests, inspects artifacts, classifies failures, repairs safe test/setup issues. |
| Reviewer | `.claude/agents/test-reviewer.md` | Reviews scenario, code, evidence, and residual risk. |
| Orchestrator | `.claude/agents/automation-test-orchestrator.md` | Coordinates planner -> approval -> generator -> healer -> reviewer when run as main session agent. |

Claude Code-specific note: subagents cannot spawn other subagents. That is why only `automation-test-orchestrator` has `Agent(test-planner, test-generator, test-healer, test-reviewer)` in its tool list, and it is intended to run as the main session agent.

### Context Engineering

`docs/AI-Agent-Harness.md` says context should be loaded by phase and risk lane, not maximized. This sample encodes that in `docs/harness/CONTEXT_RULES.md`:

- Intake reads `CLAUDE.md`, `TEST_INTAKE.md`, and the tester request.
- Planning reads requirement, product docs, similar specs, and relevant existing tests.
- Generation reads approved spec, adjacent tests, fixtures, and page objects.
- Validation reads test matrix, command, generated test, and artifacts.
- Review reads checklist, trace spec, and evidence report.

This reduces noisy context and makes Claude Code less likely to edit the wrong file or invent missing conventions.

### Tool Policy And Safe Autonomy

`docs/AI-Agent-Harness.md` recommends stable tools, least privilege, approval gates, and explicit recovery hints. This sample applies that with:

- `.claude/settings.json` to allow common Playwright and harness commands while denying secret reads.
- Subagent `tools:` allowlists so planner is not a shell-heavy implementation agent.
- `test-planner` stop condition before code generation.
- `test-healer` forbidden repairs: no assertion weakening, no arbitrary sleep, no undocumented skip.
- Human approval gates for Normal and High-risk lanes.

The goal is controlled acceleration, not full autonomy.

### Verification And Premature Victory Prevention

`docs/AI-Agent-Harness.md` warns that agents often declare victory too early. This sample counters that with:

- `docs/harness/TEST_MATRIX.md`: behavior-to-proof mapping.
- `docs/harness/TRACE_SPEC.md`: required evidence fields.
- `docs/harness/REVIEW_CHECKLIST.md`: human review checklist.
- Evidence reports under `reports/ai-generated/`.
- `AGENTS.md` definition of done: scenario approved, code follows conventions, validation run or blocker documented, evidence exists.

For this sample, Playwright tests are intentionally absent so you can verify whether Claude Code creates them through the proper flow instead of relying on prewritten code.

### Trace-Driven Reliability Loop

`docs/AI-Agent-Harness.md` treats trace-driven evals as the next maturity step. This sample includes a lightweight durable layer:

- `scripts/bin/harness-cli.mjs intake ...` records intake events.
- `scripts/bin/harness-cli.mjs trace ...` records execution traces.
- `.harness/records.jsonl` stores local records when the CLI is used.

If Claude repeatedly fails in the same way, the fix should improve the harness, not just the prompt:

- Missing context -> update `CONTEXT_RULES.md`.
- Weak proof -> update `TEST_MATRIX.md`.
- Bad delegation -> update `.claude/agents/` descriptions or prompts.
- Repeated Playwright mistakes -> update `.claude/skills/playwright-testing/SKILL.md`.
- Unsafe workflow drift -> update `CLAUDE.md` or `.claude/settings.json`.

## Quick Start For Testers

1. Open Claude Code in this repository root.
2. Run `/mcp` if Claude Code asks you to approve the project-scoped Playwright MCP server.
3. Ask Claude to read `CLAUDE.md` if it has not already loaded.
4. Start with Planner mode:

```text
Use the test-planner agent to create a test plan for login with valid credentials.
```

5. Review the generated file under `specs/`.
6. Approve the scenario in chat:

```text
Approved. Use the test-generator agent to generate the Playwright testcase.
```

7. Run focused validation:

```text
Use the test-healer agent to run the focused test and write the evidence report.
```

8. Review scenario, code, and evidence before merging.

## Claude Code Notes

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. This sample keeps `AGENTS.md` for cross-agent compatibility, but `CLAUDE.md` imports it with `@AGENTS.md` and adds Claude-specific instructions.

Playwright MCP is project-scoped through `.mcp.json`, so it is available only when Claude Code is opened from this template repo. The server follows the official Playwright MCP setup:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Use Playwright MCP for exploratory browser work such as navigation, `browser_snapshot`, locator discovery, screenshots, console inspection, and trace/video capture. Keep generated test execution on the normal Playwright CLI commands listed below.

Project subagents live in `.claude/agents/`. Each subagent file uses YAML frontmatter with at least:

```md
---
name: test-planner
description: Use proactively when a tester asks to create or update automation test scenarios before code generation.
tools: Read, Glob, Grep, Write, Edit
model: sonnet
---
```

The `description` field is important because Claude Code uses it to decide when to delegate. Use direct descriptions like `Use proactively when...` for agents that should run automatically.

Project skills live in `.claude/skills/<skill-name>/SKILL.md`. Invoke them directly with `/playwright-testing` or let Claude load them automatically when the description matches the task. Subagents preload skills with `skills:` frontmatter.

## Repository Layout

```text
.
  CLAUDE.md
  AGENTS.md
  .mcp.json
  .claude/
    agents/
    skills/
    rules/
    settings.json
  docs/
    harness/
    product/
    decisions/
    templates/
  prompts/
  specs/
  tests/
  reports/
  scripts/bin/harness-cli.mjs
```

## Sample Feature To Generate

This repo intentionally does not include generated test code or generated test plans. Use this requirement to verify whether Claude Code follows the harness and creates the right artifacts from scratch:

```text
TC-AUTH-001: Login succeeds with valid credentials
```

Expected generated files after a successful harness run:

- `specs/auth-login.test-plan.md`
- `tests/pages/login-page.ts`
- `tests/fixtures/app-fixtures.ts`
- `tests/auth/login-valid.spec.ts`
- `reports/ai-generated/2026-05-31-auth-login-valid.evidence.md`

## Validation Commands

This sample is a template repo. Before running generated tests against a real app, adjust `baseURL`, credentials, and commands.

```bash
npm install
npx playwright install
npx playwright test tests/auth/login-valid.spec.ts --trace=on
npx playwright show-report
```

## Team Rule

```text
AI drafts. Tester reviews. Evidence proves. Human approves.
```
