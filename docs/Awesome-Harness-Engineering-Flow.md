# Awesome Harness Engineering Flow

Research target: https://github.com/walkinglabs/awesome-harness-engineering

Snapshot date: 2026-05-31

Purpose: extract a general harness-engineering flow from the curated resource map, then adapt it into a Claude Code repo harness template.

## What This Source Adds

`awesome-harness-engineering` is a curated map of articles, playbooks, benchmarks, specs, runtimes, and reference implementations for harness engineering.

Unlike `harness-experimental`, it is not a concrete installable harness. It is a field map. It shows which layers matter when making agents reliable in real workflows.

## Harness Engineering Scope

The README frames harness engineering as the practice of shaping the environment around AI agents so they can work reliably.

Core intersection areas:

- Context engineering.
- Evaluation.
- Observability.
- Orchestration.
- Safe autonomy.
- Software architecture.

Generic agent tooling is out of scope unless it directly covers harness design, context management, evaluation, runtime control, or reliability-critical primitives.

## Field Map From The Repo

```mermaid
flowchart TD
    A[Harness Engineering] --> B[Foundations]
    A --> C[Context, Memory, Working State]
    A --> D[Constraints, Guardrails, Safe Autonomy]
    A --> E[Specs, Agent Files, Workflow Design]
    A --> F[Evals and Observability]
    A --> G[Benchmarks]
    A --> H[Runtimes, Harnesses, Reference Implementations]

    B --> B1[Why model capability alone is not enough]
    C --> C1[What the agent sees and remembers]
    D --> D1[What the agent may do safely]
    E --> E1[How work enters and gets decomposed]
    F --> F1[How behavior is traced and graded]
    G --> G1[How harness quality is compared]
    H --> H1[How patterns become executable systems]
```

## General Harness Flow

```mermaid
flowchart TD
    A[Human goal] --> B[Spec / task contract]
    B --> C[Context builder]
    C --> D[Agent runtime]
    D --> E[Tool and execution layer]
    E --> F[Observation stream]
    F --> G[Verifier / evaluator]
    G --> H{Pass?}
    H -->|No| I[Failure attribution]
    I --> J[Recovery plan]
    J --> C
    H -->|Yes| K[Trace, evidence, state update]
    K --> L[Harness improvement backlog]
    L --> M[Next task starts with better harness]
```

This is the reusable pattern across the resources: goal becomes contract, contract selects context, agent acts through constrained tools, execution produces observations, verifier decides completion, trace improves next run.

## Claude Code Harness Flow

```mermaid
flowchart TD
    A[User request in Claude Code] --> B[Read root context file]
    B --> B1[AGENTS.md / CLAUDE.md / GEMINI.md]
    B1 --> C[Classify task]
    C --> C1[Tiny / normal / high-risk]
    C1 --> D[Select context]
    D --> D1[README, architecture docs, product docs, stories, decisions]
    D1 --> E[Plan scoped work]
    E --> F[Call tools]
    F --> F1[Read, search, edit, shell, tests, browser, MCP]
    F1 --> G[Observe results]
    G --> H[Run verification]
    H --> I{Evidence enough?}
    I -->|No| J[Debug or narrow scope]
    J --> E
    I -->|Yes| K[Update state and trace]
    K --> K1[Feature tracking, progress notes, decision log, trace record]
    K1 --> L[Final response with proof and limits]
```

## Harness Build Sequence For A Repo

```mermaid
flowchart LR
    A[1. Agent files] --> B[2. Spec workflow]
    B --> C[3. Context rules]
    C --> D[4. Tool policy]
    D --> E[5. Verification ladder]
    E --> F[6. Trace schema]
    F --> G[7. Eval suite]
    G --> H[8. Benchmark / regression loop]
```

Build order:

1. Agent files: create `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` as stable entrypoints.
2. Spec workflow: define how vague work becomes story-sized work.
3. Context rules: define what to read by task type and risk level.
4. Tool policy: define safe actions, approval gates, and high-risk operations.
5. Verification ladder: define quick, integration, E2E, platform, and release checks.
6. Trace schema: record actions, files read, files changed, errors, proof, friction.
7. Eval suite: convert traces into repeatable evaluation tasks.
8. Benchmark loop: compare harness changes against baseline runs.

## Reliability Loop

```mermaid
flowchart TD
    A[Agent attempt] --> B[Trace]
    B --> C[Score final output]
    B --> D[Score trajectory]
    C --> E[Failure taxonomy]
    D --> E
    E --> F{Failure source}
    F -->|Missing context| G[Improve context rules]
    F -->|Bad tool call| H[Improve tool schema]
    F -->|Weak verification| I[Improve test matrix]
    F -->|Unsafe autonomy| J[Improve guardrails]
    F -->|State loss| K[Improve memory / progress protocol]
    G --> L[Run eval again]
    H --> L
    I --> L
    J --> L
    K --> L
    L --> A
```

Important distinction:

- Final-output eval asks whether the task ended correctly.
- Trace eval asks whether the path was safe, efficient, observable, and recoverable.

Harness quality needs both.

## Layer Model For Seminar

```mermaid
flowchart TB
    A[Model] --> B[Agent Runtime]
    B --> C[Harness Layer]
    C --> C1[Instructions and specs]
    C --> C2[Context and memory]
    C --> C3[Tools and permissions]
    C --> C4[Execution environment]
    C --> C5[Verification and evals]
    C --> C6[Observability and traces]
    C --> C7[Recovery and human approval]
    C --> D[Repo / Browser / Shell / APIs / MCP]
```

In seminar terms: the model is not the harness. The harness is the system that decides what the model sees, what it can do, how it proves work, and how failures become better future behavior.

## Practical Claude Code Template

```text
project/
  AGENTS.md or CLAUDE.md or GEMINI.md
    - project map
    - setup commands
    - verification commands
    - feature tracking
    - definition of done

  docs/
    product/
      - source of product truth
    stories/
      - scoped work packets
    decisions/
      - architecture and product decisions
    harness/
      - context rules
      - risk lanes
      - trace protocol
      - eval protocol

  tests/
    - unit, integration, e2e, smoke

  scripts/
    - check commands
    - harness utility commands
```

Feature tracking stays inside the root context file for this seminar model. No separate feature-list file.

## What To Add To The Seminar Deck

Use `awesome-harness-engineering` to justify a broader flow than repo files alone:

- Harness is a field, not just a prompt pattern.
- Reliable agents need context, guardrails, runtime, evals, observability, and benchmarks.
- Claude Code can act as the interactive runtime, but the repo must supply the operating surface.
- The next maturity step after a basic template is trace-driven evals.

Suggested slide flow:

1. Harness field map: context, safety, specs, evals, runtimes.
2. Claude Code harness loop: request, context, tools, verification, trace.
3. Reliability loop: trace, score, attribute failure, improve harness, rerun.

## Evidence Notes

Sourced facts from the repo:

- The repo describes harness engineering as shaping the environment around AI agents so they can work reliably.
- It explicitly scopes harness engineering across context engineering, evaluation, observability, orchestration, safe autonomy, and software architecture.
- It groups resources into foundations, context/memory/state, guardrails, specs/workflow, evals/observability, benchmarks, and runtimes/reference implementations.
- It treats benchmarks as useful for comparing harness quality, not just model quality.

Inference for our seminar:

- A Claude Code harness template should not stop at `AGENTS.md`. It should include context routing, risk classification, proof expectations, trace capture, and eval loops.
- The flow should emphasize improving the harness after failures, not only retrying the agent with a longer prompt.
