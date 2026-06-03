# Assistant Skills — Lazy-Load (Progressive Disclosure)

**Date:** 2026-06-03
**Status:** Approved (design)
**Scope:** `assistant/apps/api` (agent harness)

## Goal

Port Claude Code's Skills loading mechanism into the Assistant bot: a set of
instruction packets whose **names + descriptions** are always in the agent's
system prompt (cheap), but whose **full bodies load on demand** when the model
decides a skill is relevant — mirroring Claude Code's two-phase progressive
disclosure.

## Decisions (locked)

- **Trigger:** model-driven via a `load_skill` tool (closest to Claude Code; not
  keyword auto-inject).
- **Skills v1:** `concept-explainer`, `harness-blueprint-guide`.
- **Schema v1:** minimal instruction packet — frontmatter `name` + `description`
  (+ optional `when_to_use`); markdown body is the instruction. No per-skill
  tools, no `allowed-tools` enforcement, no keyword/paths gating.
- **Integration:** closure-based registry built once in `createAssistant`
  (Approach A).

## Mechanism (two phases)

- **Phase 1 — boot (cheap):** loader reads `SKILL.md` files, parses frontmatter
  into a registry `{ name, description, whenToUse?, body }`. `buildSystemPrompt`
  injects **only** a `name: description` block per skill plus the instruction
  "call `load_skill` when a question matches a skill, before answering." Bodies
  are **not** in context.
- **Phase 2 — on demand:** the model calls `load_skill(name)`; the tool returns
  the full body, which enters the model context for the remainder of the run.
  This is the progressive-disclosure equivalent.

## Storage

- Skills live at `assistant/apps/api/skills/<name>/SKILL.md`.
  - Ships in the Docker image automatically (`COPY apps/api apps/api`).
- New env `SKILLS_ROOT` (optional) defaults to that directory, resolved like
  `DOCS_ROOT`.

### SKILL.md format

```markdown
---
name: concept-explainer
description: Khung giải thích một khái niệm harness cho người mới. Dùng khi người
  dùng hỏi "X là gì", "giải thích X", hoặc cần hiểu một khái niệm nền tảng.
when_to_use: Câu hỏi định nghĩa / "là gì" / "giải thích".
---

# (body markdown — hướng dẫn chi tiết, chỉ nạp khi load_skill)
...
```

## Components

| Unit | Responsibility | Depends on |
|------|----------------|-----------|
| `agent/skills/loader.ts` | Read `SKILLS_ROOT`, parse each `SKILL.md` frontmatter, build `SkillRegistry` (`Map<name, Skill>`). Skip + log malformed. Expose `loadSkillRegistry(root)` and types `Skill`, `SkillMeta`. | frontmatter parser reused from `docs/parseMarkdown` |
| `agent/skills/loadSkillTool.ts` | `tool({ name: 'load_skill', parameters: { name } })`. Look up registry; on hit push `name` to `context.loadedSkills` and return `{ found: true, name, body }`; on miss return `{ found: false, available: string[] }`. | registry, `AssistantContext` |
| `agent/prompts.ts` | `buildSystemPrompt` accepts `skills?: SkillMeta[]`; appends a meta-only block (name + description). | — |
| `agent/harnessAssistant.ts` | Build registry once in `createAssistant`; `instructions` closure passes skill meta to `buildSystemPrompt`; register `load_skill` tool on the orchestrator. | loader, tool, prompts |
| `agent/context.ts` | Add `loadedSkills: string[]` (init `[]`) for observability/trace. | — |
| `config/env.ts` | Add optional `SKILLS_ROOT` with default path. | — |

## Data flow

```
request
  → orchestrator (instructions include skill name+description meta)
  → model recognizes a matching skill
  → load_skill(name)  ── returns full body ──▶ body now in context
  → model answers using the skill body
```

Streaming path is unaffected by wiring — it shares `assistant.orchestrator`, so
the `load_skill` tool and the skill meta in instructions apply automatically.

## Error handling

- Malformed/empty frontmatter in a `SKILL.md` → loader skips that file and logs;
  boot never crashes.
- `load_skill` with an unknown name → `{ found: false, available }`; the model
  can self-correct.
- Empty registry → the skills block is omitted from the system prompt entirely.

## Testing

1. **loader.test.ts** — parse a fixture skills dir → registry contains expected
   `name`/`description`/`body`; a malformed fixture is skipped (not thrown).
2. **prompts (skills) test** — `buildSystemPrompt({ skills })` contains each
   skill's name + description but **does not** contain the skill body text
   (asserting the lazy contract).
3. **loadSkillTool.test.ts** — returns `{ found: true, body }` for a known name
   and `{ found: false, available }` for an unknown name; records the name in
   `context.loadedSkills`.

## Out of scope (v1)

`allowed-tools` gating, keyword/paths gating, hot-reload, per-skill model
override, UI surfacing of loaded skills, persisting loaded-skill list to the
trace table (kept in-memory on context only).
