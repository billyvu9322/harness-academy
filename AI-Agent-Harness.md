# AI Agent Harness: Architecture, Operations & Building Agents with Claude Code

Seminar notes for preparing a talk about AI agent harness engineering, operational patterns, and practical runtime-agnostic harness construction for Claude Code and other coding agents.

## 1. Executive Summary

An AI agent harness is the engineering system around a model that turns raw model capability into reliable execution. The model supplies reasoning and generation. The harness supplies context, tools, environment, state, permissions, verification, recovery, observability, and operating discipline.

Harness engineering is important because strong models still fail in real software work when requirements are vague, repo conventions are implicit, environments are broken, tests are unknown, state is lost between sessions, or the agent declares victory too early. In those cases, the failure is often not a model-capability problem. It is a harness problem.

Core message for the seminar:

> Better agents are not only better models. Better agents are better model + better harness.

## 2. Definitions

### AI Agent

An AI agent is an LLM-driven application that can plan, call tools, observe results, update state, and continue working toward a goal across one or more steps.

### AI Agent Harness

An AI agent harness is the control system that surrounds the model. It controls:

- What context the model receives.
- Which tools the model can call.
- Where code or commands execute.
- How state persists across turns and sessions.
- What safety boundaries exist.
- How work is verified.
- How failures are diagnosed and recovered.
- How traces, logs, and metrics are collected.

### Harness Engineering

Harness engineering is the discipline of designing, testing, and improving that control system. It includes environment design, intent expression, feedback loops, state management, verification, and operational safeguards.

Prompt engineering is only one part of harness engineering. A prompt can ask the agent to do better. A harness makes it possible, observable, and enforceable.

### Harness Engineering Field Map

The resource map frames harness engineering as a field at the intersection of:

- Context engineering.
- Evaluation.
- Observability.
- Orchestration.
- Safe autonomy.
- Software architecture.

This matters because a practical harness is not only a prompt file or a tool wrapper. It is the full operating surface that determines what the agent sees, what it may do, how it proves work, how humans intervene, and how failures improve the next run.

## 3. Why Capable Agents Still Fail

Common failure modes:

- **Vague requirements**: "Add search" leaves too many choices unresolved.
- **Implicit conventions**: team rules exist in Slack or human memory, not in repo-readable files.
- **Incomplete environment setup**: wrong Node/Python version, missing dependencies, unknown dev command.
- **No verification path**: agent cannot run or does not know the correct tests, lint, typecheck, or E2E flow.
- **State loss**: long-running tasks span multiple context windows; each new session starts cold.
- **Overreach**: agent tries to implement too much at once, runs out of context, leaves half-finished work.
- **Under-finish**: agent sees partial progress and says task is done.
- **Self-evaluation bias**: the same agent that wrote the code tends to overrate its own work.
- **No observability**: humans cannot easily tell which tools ran, what failed, and why.

Seminar framing:

> If an agent fails, do not immediately ask "which model should we upgrade to?" Ask first: "which harness layer failed?"

## 4. Five-Subsystem Harness Model

Learn Harness Engineering summarizes a practical harness as five subsystems: instructions, tools, environment, state, and feedback.

### 4.1 Instruction Subsystem

Purpose: give the agent a repo map, not a giant manual.

Typical artifacts:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.cursorrules`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/runbook.md`

Good instruction files include:

- Project purpose.
- Tech stack and versions.
- Directory map.
- First-run setup commands.
- Verification commands.
- Non-negotiable constraints.
- Links to deeper docs.
- Definition of Done.

Bad instruction files:

- Too long to use.
- Mix stable rules with temporary task notes.
- Repeat obvious coding advice.
- Omit executable commands.
- Hide important rules in prose instead of checklists.

Rule of thumb:

> `AGENTS.md` should be a directory page, not an encyclopedia.

### 4.2 Tool Subsystem

Purpose: expose actions the agent can safely take.

Tool types:

- File read/search/edit.
- Shell commands.
- Test runner.
- Browser automation.
- Git operations.
- API/business actions.
- Database queries or migrations.
- MCP tools.
- Hosted tools.
- Human approval gates.

Tool design principles:

- Stable, explicit names.
- Narrow schemas.
- Deterministic return shapes.
- Least privilege.
- Separate read tools from write tools.
- Separate tool visibility from approval policy.
- High-risk operations should be micro-tools with approval.

Recommended tool response shape:

```json
{
  "status": "success | warning | error",
  "summary": "One-line result",
  "data": {},
  "artifacts": ["paths-or-ids"],
  "next_actions": ["specific follow-up"],
  "recovery_hint": "what to do if this failed"
}
```

### 4.3 Environment Subsystem

Purpose: make execution reproducible.

Typical artifacts:

- `package.json`
- `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock`
- `pyproject.toml`
- `.nvmrc`
- `.python-version`
- `Dockerfile`
- `docker-compose.yml`
- `.devcontainer/`
- `.env.example`
- `init.sh`

Good environment setup answers:

- Which runtime version?
- Which package manager?
- How to install dependencies?
- How to start app?
- How to run tests?
- What secrets are required?
- Which services need to be running?

### 4.4 State Subsystem

Purpose: preserve progress across long-running tasks and context resets.

Typical artifacts:

- `PROGRESS.md`
- `claude-progress.txt`
- Feature tracking section inside `CLAUDE.md`, `AGENTS.md`, or `GEMINI.md`
- Git commits.
- Session summaries.
- Task board/issues.
- Trace store.

State should capture:

- What was done.
- What is in progress.
- What is blocked.
- What failed and why.
- What should happen next.
- Which features are passing or failing.

Long-running agent pattern from Anthropic:

- Initializer agent creates environment, `init.sh`, progress file, embedded feature tracking section in the repo context file, and initial commit.
- Coding agent reads current state, chooses one unfinished feature, implements it, verifies it, updates progress, and leaves repo clean.

### 4.5 Feedback Subsystem

Purpose: replace agent confidence with external evidence.

Feedback includes:

- Unit tests.
- Integration tests.
- Typecheck.
- Lint.
- Build.
- E2E browser checks.
- API smoke tests.
- App startup health checks.
- Runtime logs.
- Screenshots.
- Code review.
- QA evaluator output.

Highest ROI starting point:

```md
## Verification Commands

- Install: pnpm install
- Typecheck: pnpm typecheck
- Lint: pnpm lint
- Unit tests: pnpm test
- Build: pnpm build
- E2E: pnpm e2e
- Full check: pnpm check
```

## 5. Harness Architecture

### 5.1 Conceptual Architecture

```txt
User / Task Source
  -> Harness Control Plane
    -> Instruction Loader
    -> Context Builder
    -> Agent Runtime
    -> Tool Registry
    -> Permission & Approval Layer
    -> State Store
    -> Verification Runner
    -> Observability & Tracing
    -> Recovery Controller
  -> Execution Plane
    -> Repo / Workspace
    -> Shell / Sandbox
    -> Browser / E2E Harness
    -> External APIs / MCP Servers
```

### 5.2 Control Plane vs Execution Plane

Important architecture principle for any agent harness:

- Harness is the control plane around the model.
- Compute/sandbox is the execution plane.

The harness should own:

- Agent loop.
- Model calls.
- Tool routing.
- Handoffs.
- Approvals.
- Guardrails.
- Secrets.
- Billing.
- Audit logs.
- Tracing.
- Recovery state.

The sandbox should own:

- Reading/writing files in scoped workspace.
- Running commands.
- Installing packages.
- Producing artifacts.
- Exposing test ports.
- Snapshotting execution state.

Production recommendation:

> Keep trusted orchestration outside the sandbox. Let sandbox handle risky or stateful execution with narrow credentials.

### 5.3 Layer Model

The broader harness engineering field map is useful for explaining where each layer sits:

```txt
Model
  -> Agent Runtime
    -> Harness Layer
      -> Instructions and specs
      -> Context and memory
      -> Tools and permissions
      -> Execution environment
      -> Verification and evals
      -> Observability and traces
      -> Recovery and human approval
    -> Repo / Browser / Shell / APIs / MCP
```

In seminar terms: the model is not the harness. The harness is the system that decides what the model sees, what it can do, how it proves work, and how failures become better future behavior.

### 5.4 General Harness Flow

```txt
Human goal
  -> Spec / task contract
  -> Context builder
  -> Agent runtime
  -> Tool and execution layer
  -> Observation stream
  -> Verifier / evaluator
  -> If failed: failure attribution -> recovery plan -> updated context
  -> If passed: trace, evidence, state update -> harness improvement backlog
  -> Next task starts with better harness
```

This flow comes from the practical pattern across harness resources: goal becomes contract, contract selects context, agent acts through constrained tools, execution produces observations, verifier decides completion, and traces improve the next run.

## 6. Agent Workflow Patterns

### 6.1 ReAct Loop

Pattern: reason, act, observe, repeat.

Good for:

- Exploration.
- Debugging.
- Codebase investigation.
- Unknown path tasks.

Risk:

- Can loop without termination criteria.
- Can overuse tools.
- Can drift without state and feedback.

### 6.2 Function-Calling Workflow

Pattern: model chooses from typed functions.

Good for:

- Structured business processes.
- Deterministic API actions.
- Workflows with clear schemas.

Risk:

- Too rigid for exploratory tasks.

### 6.3 Hybrid Harness

Recommended pattern:

- ReAct-style planning and exploration.
- Typed tool execution.
- Explicit verification before completion.
- Human approvals for risky actions.

### 6.4 Multi-Agent Harness

Common roles:

- **Planner**: expands vague request into spec, features, milestones, risks.
- **Generator/Builder**: implements one feature or sprint at a time.
- **Evaluator/QA**: runs app, tests behavior, identifies bugs, grades against criteria.
- **Reviewer**: checks code quality, maintainability, security.
- **Operator**: handles deploy, monitoring, rollback.

Anthropic example:

- Solo run for a 2D game editor: fast and cheap, but core gameplay broken.
- Planner + generator + evaluator harness: slower and more expensive, but produced playable app.

Lesson:

> Multi-agent systems are not automatically better. They are useful when decomposition, external evaluation, or specialist ownership addresses a real failure mode.

## 7. Operations Playbook

### 7.1 Session Startup

Every agent session should begin by getting oriented.

Recommended startup sequence:

```txt
1. Confirm working directory.
2. Read AGENTS.md / CLAUDE.md / GEMINI.md.
3. Read progress file.
4. Check recent git log.
5. Check feature tracking section in the context file or task state.
6. Run lightweight health check.
7. Choose one scoped task.
```

### 7.2 During Work

Operational rules:

- Work on one feature or bounded task at a time.
- Prefer small, reversible changes.
- Run local verification early.
- Do not refactor unrelated code.
- Record discoveries that future sessions need.
- If blocked, write blocker and next steps.

### 7.3 Completion Criteria

Definition of Done should be external and executable.

Three-layer termination validation:

- **Layer 1: Static checks**: formatting, lint, typecheck, build.
- **Layer 2: Runtime checks**: tests, app startup, service health, API smoke tests.
- **Layer 3: System checks**: E2E user flow, browser automation, integration validation.

Completion rule:

> Code written is not done. Code verified through required checks is done.

### 7.4 Preventing Premature Victory

Known agent failure: agent says “done” when feature is only partially working.

Harness countermeasures:

- Explicit Definition of Done.
- Require commands and evidence in final response.
- Feature tracking section with pass/fail status in the repo context file.
- Separate evaluator from generator.
- Browser/E2E tests for user-facing flows.
- No feature marked passing without direct verification.

### 7.5 Error Recovery Contract

Every tool or validation error should include:

- Root cause hint.
- Safe retry instruction.
- Explicit stop condition.
- Links to relevant logs/artifacts.

Bad feedback:

```txt
Test failed.
```

Good feedback:

```txt
POST /api/reset-password returned 500.
Likely missing EMAIL_PROVIDER_API_KEY in test environment.
Check .env.example and tests/e2e/password-reset.spec.ts.
Retry after adding mock email provider config.
Stop if migration state is inconsistent.
```

### 7.6 Clean Session End

End-of-session checklist:

- Tests/checks run or explicitly noted as not run.
- Progress file updated.
- Embedded feature tracking updated only for verified features.
- Git status inspected.
- No unrelated changes mixed in.
- Next steps written clearly.

## 8. Claude Code As A Harness

Claude Code is not just a chat interface. It is already a coding-agent harness:

- Reads repository instructions such as `CLAUDE.md` / `AGENTS.md` / `GEMINI.md`.
- Has file and shell tools.
- Can run tests and inspect failures.
- Maintains session context.
- Supports skills, subagents, hooks, and MCP integrations depending on setup.
- Works inside a real repo, so repo artifacts can become the system of record.

### 8.1 Recommended Claude Code Repo Setup

Add a small `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` at repo root:

```md
# Agent Guide

## Project
Short description of what this repo does.

## Stack
- Runtime:
- Framework:
- Package manager:
- Database:

## Setup
- Install: ...
- Dev: ...

## Verification
- Lint: ...
- Typecheck: ...
- Test: ...
- Build: ...
- Full check: ...

## Rules
- Do not declare done before full check passes.
- Do not refactor unrelated files.
- Keep changes small and reversible.
- Update progress notes for long-running work.

## Feature Tracking
- Feature: auth-password-reset
  - Category: functional
  - Outcome: User can request password reset and complete reset using emailed token.
  - Verification steps: submit email, verify reset email queued, open reset link, set new password, login.
  - Status: not verified
  - Evidence: none yet

## Docs
- Architecture: docs/architecture.md
- Testing: docs/testing.md
- Deployment: docs/deployment.md
```

### 8.2 Feature Tracking Pattern

Use a `Feature Tracking` section inside the root context file for long-running app builds. Do not create a separate file for this list.

```md
## Feature Tracking

- Feature: auth-password-reset
  - Category: functional
  - Outcome: User can request password reset and complete reset using emailed token.
  - Steps:
    - Open forgot password page.
    - Submit registered email.
    - Verify reset email is queued.
    - Open reset link.
    - Set new password.
    - Login with new password.
  - Status: not verified
  - Evidence: none yet
```

Rules:

- Agent may only change status from `not verified` to `verified` after testing.
- Agent should append evidence: command output, screenshot, trace, test name.
- Agent must not delete failing features to make progress look better.

### 8.3 Progress File Pattern

Use `PROGRESS.md`:

```md
# Progress

## Current Goal

## Completed

## In Progress

## Blocked

## Verification Evidence

## Next Session Should Start With
```

## 9. Building A Runtime-Agnostic Harness Template

A harness template is not an app scaffold or a framework tutorial. It is the repo operating surface that lets any capable coding agent start from the right context, choose a safe scope, act through constrained tools, prove completion, and leave better state for the next run.

### 9.1 Minimal Template Surface

```txt
project/
  AGENTS.md                # stable agent entrypoint and local rules
  CLAUDE.md or GEMINI.md   # optional context file for the active agent surface
  README.md                # human-facing project overview
  docs/
    HARNESS.md             # human-agent collaboration model
    FEATURE_INTAKE.md      # classify work and choose risk lane
    CONTEXT_RULES.md       # what to read by phase and lane
    ARCHITECTURE.md        # boundary rules and stack decisions
    TEST_MATRIX.md         # behavior-to-proof matrix
    TRACE_SPEC.md          # execution trace requirements
    product/               # current product contract
    stories/               # story packets and backlog
    decisions/             # durable architecture/product decisions
    templates/             # story, decision, validation templates
```

For a lightweight setup, the root context file plus a test matrix and trace protocol is enough. For a larger team, split stable policy, product truth, story packets, and trace evidence into dedicated docs.

### 9.2 Main Harness Flow

```txt
Human intent or product spec
  -> Agent entrypoint: AGENTS.md / CLAUDE.md / GEMINI.md
  -> Feature intake
  -> Risk lane: tiny / normal / high-risk
  -> Context routing
  -> Story and proof contract
  -> Scoped implementation
  -> Validation evidence
  -> Trace and friction capture
  -> Next agent starts with better context
```

The key move is converting a prompt into a work contract before coding. The contract should identify expected behavior, affected areas, risk flags, validation commands, and evidence required before completion.

### 9.3 Intake And Risk Lanes

`docs/FEATURE_INTAKE.md` prevents the agent from going directly from vague prompt to code.

Input types:

- New spec: turn supplied spec into product docs, candidate epics, and decisions.
- Spec slice: implement selected behavior from an accepted spec.
- Change request: bounded fix or refinement.
- New initiative: larger product area needing multiple stories.
- Maintenance request: dependency, architecture, performance, security, or operational work.
- Harness improvement: improve how humans and agents collaborate.

Risk lanes:

- **Tiny**: docs, copy, names, or narrow low-risk edits. Use direct patch plus quick proof.
- **Normal**: story-sized behavior with bounded blast radius. Use story packet plus validation expectations.
- **High-risk**: auth, authorization, data model, audit/security, external systems, public contracts, weak proof, or multi-domain change. Require design, explicit plan, stronger validation, and human approval gates.

### 9.4 Context Routing

Context should be loaded by phase and risk lane, not maximized.

```txt
Intake phase
  -> entrypoint + intake + test matrix
Planning phase
  -> affected product docs + story template + architecture rules
Implementation phase
  -> files to edit + adjacent patterns + current tests
Validation phase
  -> acceptance criteria + validation commands + logs
Trace phase
  -> trace spec + git status + evidence summary
```

Practical context targets:

- Tiny lane: about 2K tokens of harness context.
- Normal lane: about 5K tokens of harness context.
- High-risk lane: about 10K tokens of harness context.

The harness should make the right context easy to find, not force every agent to read the whole repo manual.

### 9.5 Tool Policy And Observation Shape

The harness should define what tools are allowed, when approval is required, and what a useful observation looks like.

Tool policy examples:

- Read/search tools are broadly allowed.
- File edits are scoped to the task unless explicitly widened.
- Tests and local builds are expected before completion.
- Deploys, migrations, destructive commands, billing, permissions, and production data require approval.
- Secrets stay in the trusted control plane, not in sandboxed execution or trace logs.

Recommended observation shape:

```json
{
  "status": "success | warning | error",
  "summary": "One-line result",
  "artifacts": ["paths-or-ids"],
  "next_actions": ["specific follow-up"],
  "recovery_hint": "root cause hint and safe retry"
}
```

This shape matters because an agent cannot recover from opaque output. A useful harness makes failure diagnosable and retryable.

### 9.6 Trace And Friction Capture

Each meaningful task should leave a short evidence record.

Trace fields:

- Task summary.
- Input type and risk lane.
- Files read.
- Files changed.
- Commands run.
- Failures encountered.
- Validation evidence.
- Human decisions or approvals.
- Friction that slowed the agent down.

Repeated friction becomes harness backlog. If agents repeatedly search for the same command, misunderstand the same boundary, or fail the same validation step, the fix is often a harness doc, test matrix, tool schema, or context rule.

### 9.7 Optional Durable Layer

A mature harness can add a local durable layer such as SQLite plus a small CLI. The docs explain how to work; the durable layer records what happened.

Useful records:

- `intake`: input type, summary, risk lane, flags, affected docs, story link.
- `story`: story status and proof columns.
- `decision`: architecture or product decisions and optional verification.
- `backlog`: harness improvement proposals with predicted and actual outcome.
- `trace`: task execution record, files read/changed, errors, outcome, friction.

The durable layer is optional. The essential pattern is intake, story/proof contract, validation, trace, and friction capture.

## 10. Evaluation And Metrics

Track harness quality, not just model quality.

Useful metrics:

- Task completion rate.
- pass@1 and pass@3.
- Retry count per task.
- Time to first useful result.
- Cost per successful task.
- Tool error rate.
- Verification failure rate.
- Premature completion rate.
- Human intervention count.
- Regression rate after agent changes.

### 10.1 Trace-Driven Reliability Loop

Harness quality should be evaluated from both final outputs and traces.

- Final-output eval asks whether the task ended correctly.
- Trace eval asks whether the path was safe, efficient, observable, and recoverable.
- Failure attribution should identify whether the issue came from missing context, bad tool schema, weak verification, unsafe autonomy, or state loss.

Reliability loop:

```txt
Agent attempt
  -> Trace
  -> Score final output
  -> Score trajectory
  -> Failure taxonomy
  -> Improve context rules, tool schema, test matrix, guardrails, or memory protocol
  -> Run eval again
```

Harness quality needs both task success and trajectory quality. A correct final answer can still hide a fragile process; a failed final answer can still contain useful trace evidence for improving the harness.

### 10.2 Benchmarks As Harness Tests

The `awesome-harness-engineering` resource map treats benchmarks as a way to compare harness quality, not only model quality.

Useful benchmark dimensions:

- Context handling.
- Tool calling accuracy.
- Environment control.
- Verification logic.
- Long-horizon state management.
- Runtime scaffolding around the model.

Harness ablation test:

```txt
Keep model fixed.
Remove one harness layer at a time.
Measure performance drop.
Attribute failures to missing context, missing tools, missing environment, missing state, or missing feedback.
```

Important nuance:

> Ablation shows which component is load-bearing for current tasks. It does not automatically prove the root bottleneck without failure attribution.

## 11. Seminar Flow Proposal

### Opening Hook

Ask audience:

> If the same model fails in one repo and succeeds in another, what changed?

Answer:

> The harness changed.

### Part 1: Problem

- Strong models still fail real work.
- Common failure modes.
- Capability gap vs execution reliability.

### Part 2: Definition

- Harness as infrastructure outside model weights.
- Prompt engineering vs harness engineering.
- Five-subsystem model.
- Field map: context, safety, specs, evals, observability, runtimes.

### Part 3: Architecture

- Control plane vs execution plane.
- Tool registry, state store, verification runner, tracing.
- Multi-agent patterns.
- Reliability loop: trace, score, attribute failure, improve harness, rerun.

### Part 4: Operations

- Session startup.
- Incremental feature work.
- Definition of Done.
- Preventing premature victory.
- Clean session end.

### Part 5: Claude Code

- `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`.
- Feature tracking section inside the context file.
- Progress files.
- Test commands.
- Browser/E2E verification.

### Part 6: Harness Template

- Intake and risk lanes.
- Context routing.
- Story and proof contracts.
- Tool policy and approval gates.
- Trace and friction capture.
- Optional durable layer.

### Closing

> Agent reliability is not only a model problem. It is a systems engineering problem.

## 12. Practical Checklist

Use this to evaluate any repo before assigning work to an agent.

### Instructions

- `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` exists.
- Tech stack and versions documented.
- Architecture links included.
- Definition of Done included.

### Tools

- Agent can search/read/edit files.
- Agent can run tests.
- Agent can inspect browser for UI work.
- High-risk tools require approval.

### Environment

- Runtime version pinned.
- Install command documented.
- App start command documented.
- `.env.example` exists.

### State

- Progress file exists for long tasks.
- Context file includes feature tracking for app builds.
- Git history is meaningful.

### Feedback

- Unit test command exists.
- Typecheck/lint/build commands exist.
- E2E or smoke test path exists.
- Final response must include verification evidence.

## 13. Key Takeaways

- A harness is everything outside model weights that helps the agent execute reliably.
- The repo should become the system of record for agent context.
- A good harness constrains behavior without micromanaging implementation.
- Feedback and verification usually have the highest ROI.
- Trace-driven evals are the next maturity step after a basic repo harness.
- Long-running agents need state artifacts and clean handoffs.
- Multi-agent harnesses help when planner, builder, and evaluator roles address real failure modes.
- Agent self-confidence is not evidence; runtime verification is evidence.
- Keep trusted orchestration, secrets, approval policy, and audit logs in the control plane; keep risky execution in scoped workspaces with narrow credentials.
- With Claude Code, invest in `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`, embedded feature tracking, verification commands, progress files, and trace evidence before blaming the model.
