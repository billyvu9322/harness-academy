# Harness Engineering — The Emerging Discipline (Viblo)

Primary source: https://viblo.asia/p/harness-engineering-the-emerging-discipline-of-making-ai-agents-reliable-wd43EZKjLX9

Snapshot date: 2026-06-02

This article is a synthesis/survey piece. It pulls together OpenAI, Anthropic,
LangChain, Thoughtworks, and HumanLayer sources into one vocabulary for "harness
engineering". Notes below preserve the article's named frameworks verbatim. Where
a claim is the article's interpretation rather than a primitive definition, it is
labeled **(survey framing)**.

## 1. Core Thesis

> **Agent = Model + Harness**

Harness engineering = the practice of designing and iterating **everything around
the model except the model itself**: the environment, tooling, constraints, and
feedback loops. When the agent fails, you fix the harness, not the prompt.

A harness is composed of:

- System prompts
- Tools, skills, MCP servers
- Bundled infrastructure (filesystem, sandboxes, browsers, observability)
- Orchestration logic (sub-agent spawning, handoffs, routing)
- Hooks and middleware (deterministic control flow, verification)
- Memory and state management (progress files, git history, knowledge bases)

This matches the repo's own framing (see `AI-Agent-Harness.md` §2, §8) and adds a
broader cross-vendor vocabulary on top.

## 2. Control Frameworks (the article's main contribution)

The value of this source is that it **names** the control structures other docs
only describe implicitly.

### 2.1 Feedforward vs Feedback (Thoughtworks)

- **Guides (feedforward controls)** — anticipatory; steer behavior *before* action.
  Examples: `AGENTS.md`, architecture docs, skills, conventions.
- **Sensors (feedback controls)** — observe *after* action; enable self-correction.
  Examples: linters with custom messages, tests, code-review agents, screenshots.

Maps directly onto the repo's instruction subsystem (guides) and feedback
subsystem (sensors).

### 2.2 Computational vs Inferential controls

- **Computational** — deterministic, fast, CPU-based: tests, linters, type checkers.
- **Inferential** — semantic AI judgment: LLM-based code review. Slower, richer.

**(survey framing)** Good harnesses use computational checks as the cheap first
gate and reserve inferential checks for judgment that determinism can't express.

### 2.3 The Cybernetic Governor — three regulation dimensions

1. **Maintainability harness** — internal code quality (linting, complexity, coverage).
2. **Architecture fitness harness** — system characteristics (performance, observability, security).
3. **Behavior harness** — functional correctness verification.

### 2.4 Control–Agency–Runtime (CAR) decomposition

- **Control** — constraints, guardrails, permissions.
- **Agency** — planning, decision-making, self-evaluation.
- **Runtime** — execution environment, tools, infrastructure.

### 2.5 Framework / Runtime / Harness distinction (LangChain)

- **Framework** — reusable abstractions (LangGraph, CrewAI).
- **Runtime** — execution infrastructure (sandboxes, state, scheduling).
- **Harness** — task-specific configuration for one particular agent deployment.

Useful because it separates "the library you import" from "the configured system
you operate" — the harness is the latter.

## 3. Cross-cutting Principles

### 3.1 Progressive disclosure
Give the agent specific instructions/knowledge/tools **only when needed**, to avoid
degrading the context window with irrelevant information.

### 3.2 Context engineering = working memory budget
Treat the context window as a **scarce resource, not a dumping ground**.

### 3.3 The Three Pillars (Thoughtworks)
1. **Context engineering** — managing what agents know and when.
2. **Architectural constraints** — enforcing invariants mechanically.
3. **Garbage collection** — fighting entropy continuously.

### 3.4 12-Factor Agents (HumanLayer) — selected factors
1. Explicit prompts over implicit behavior.
2. State ownership — agents manage their own state.
3. Clean pause–resume behavior.
4. Context discipline.
5. Reproducible workflows.

### 3.5 Eval taxonomy (OpenAI / LangChain)
- **Single-step evals** — does one tool call produce correct results?
- **Full-run evals** — does the complete task succeed?
- **Multi-turn evals** — does the agent handle conversations and evolving goals?

This refines the repo's eval section (`AI-Agent-Harness.md`, assistant `evals/`),
which currently sits mostly at the full-run level.

## 4. Examples & Analogies

- **"One Big File" anti-pattern** — a monolithic `AGENTS.md` crowds out task + code,
  rots instantly, is hard to verify. Fix: treat it as a **table of contents (~100
  lines)** pointing into a deeper `docs/` directory.
- **Context isolation via sub-agents** — *"A bigger context window doesn't make the
  model better at finding the needle — it just makes the haystack bigger."*
- **Feature lists for long-running work** — an initializer agent generates a big
  feature list (200+ items), all marked failing; later agents work one item at a
  time → prevents premature victory and one-shot failure.
- **Sandboxing over prompting** — better sandbox + policy design lets the agent work
  autonomously inside safe boundaries instead of prompting a human per action.
- **"Success is silent"** — swallow output of passing checks; surface only errors to
  the agent, so thousands of passing test lines don't flood context.

## 5. Practices — Do / Don't

### Agent files
- Keep small (HumanLayer's `CLAUDE.md` is **under 60 lines**).
- **Don't auto-generate** — LLM-generated agent files hurt performance and cost 20%+
  more tokens.
- Don't include directory listings — agents discover structure themselves.
- Use progressive disclosure; make rules **universally applicable**, avoid conditional
  rules that confuse the model.

### Context control
- Treat the **filesystem as a foundational harness primitive**.
- Use sub-agents as **context firewalls** for research / grep / exploration.
- Delegate cheaper models (Sonnet, Haiku) to sub-agents; keep expensive models (Opus)
  at the parent.
- Return **condensed results with source citations** in `filepath:line` format.

### Constraint design
- Enforce boundaries **centrally**; allow autonomy **locally**.
- Custom linters with **remediation instructions injected into context**.
- Define layered architecture with fixed dependency directions.
- Encode "taste" as rules: logging, naming, file-size limits.

### Long-running work
- Initializer agent sets up `init.sh`, progress file, feature list.
- Each agent: read progress → work ONE feature → commit → summarize.
- Always **start** by reading progress files + running a health check.
- Always **end** in a clean, mergeable state.

### Golden principles & entropy
- Encode golden principles directly in the repo.
- Run recurring **background agents** scanning for deviations.
- Open small, targeted refactor PRs reviewable in under a minute.
- Track quality grades per domain / architectural layer.
- Treat tech debt as a **high-interest loan — pay daily**.

### Knowledge management
- Everything the agent needs must be **in-repo**. From the agent's view: *"anything it
  can't access in-context effectively doesn't exist."*
- Slack discussions → markdown. Design decisions → ADRs. Onboarding → structured docs.

### Iteration meta-principle (Mitchell Hashimoto)
- When an agent makes a mistake, engineer the harness so it **can never repeat it**.
- Don't design the ideal harness upfront; **bias toward shipping**, add config only
  when the agent actually fails.

## 6. Failure Modes

- **Context degradation** — models measurably worse at longer context; low query↔info
  similarity worsens it. Monolithic instructions create a "dumb zone".
- **One-shot attempts** — agent builds everything at once, runs out of context
  mid-implementation, leaves broken state.
- **Premature victory** — sees existing progress, declares done without verifying.
- **Infrastructure noise** — runtime config can shift benchmark scores more than the
  gap between leaderboard models; results may reflect infra, not intelligence.
- **Over-fitting to the training harness** — models post-trained with a harness in the
  loop can perform worse under a different harness.
- **Skill registry malware** — registries have already shipped malicious skills; treat
  like `npm install random-package`.
- **Harnessability gap** — not all codebases are equally governable; legacy systems
  need the harness most but make it hardest to build.

## 7. What this adds to our repo

**(survey framing — gaps worth closing)**

- Adopt the **single-step / full-run / multi-turn** eval split for the assistant; we
  mostly test full-run today.
- The **computational-before-inferential** ordering is a concrete rule for the
  guardrail/eval layer.
- **"Success is silent"** is a precise tool-observation rule (surface errors only) that
  complements our tool-observation shape in `AI-Agent-Harness.md` §9.5.
- **CAR** and **Cybernetic Governor** give clean slide vocabulary for the seminar's
  guardrails + observability sections.

## 8. Sources cited by the article

- **OpenAI** — harness engineering; Codex in an agent-first world.
- **Anthropic** — effective harnesses for long-running agents; building effective
  agents; context engineering; code sandboxing.
- **LangChain** — Anatomy of an Agent Harness; evaluating deep agents; improving deep
  agents with harness engineering (Vivek Trivedy).
- **Thoughtworks** — harness engineering framework; context engineering; spec-driven
  development (Birgitta Böckeler).
- **HumanLayer** — Skill Issue: harness engineering; 12-Factor Agents;
  context-efficient backpressure; CLAUDE.md.
- **Research** — Chroma context-rot; Manus playbook; OpenHands context condensation /
  verification stacks; Mitchell Hashimoto (fix-the-mistake principle).
- **Standards / collections** — AGENTS.md, agent.md, GitHub Spec Kit, skills.sh,
  Awesome Harness Engineering.
- **Benchmarks** — SWE-bench Verified, Terminal-Bench, WebArena, VisualWebArena,
  BrowserGym, AgentBench, GAIA, OSWorld, AppWorld, MCP Bench, MCPMark.
