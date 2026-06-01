# ADR-001: Claude Code Entrypoint And Subagents

Date: 2026-05-31

## Decision

Use `CLAUDE.md` as the primary Claude Code entrypoint and define project subagents in `.claude/agents/`.

Keep `AGENTS.md` as a compatibility surface for other agent tools, imported from `CLAUDE.md` with `@AGENTS.md`.

## Context

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. It can import files from `CLAUDE.md` using `@path` syntax. Claude Code discovers project subagents from `.claude/agents/`. Subagent definitions require YAML frontmatter with `name` and `description`. The description tells Claude when to delegate.

## Consequences

- Team instructions live in one visible Claude Code entrypoint.
- Cross-agent compatibility remains available through `AGENTS.md`.
- Tester workflows are encoded as reusable subagents.
- The orchestrator can be run as the main session agent with `claude --agent automation-test-orchestrator`.
- Worker subagents do not spawn other subagents because Claude Code subagents cannot nest delegation.
