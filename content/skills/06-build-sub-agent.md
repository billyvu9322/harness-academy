---
title: "Sub-agent Template — Build agent con đúng cách"
description: "Template config sub-agent cho Claude Code. Input/output contract, parallel dispatch."
order: 6
duration: "7 phút đọc"
tags: [skill, sub-agent, orchestrator]
---

## Mục tiêu

Skill này dạy build sub-agent:
- Config file `.claude/agents/<name>.md`
- Hợp đồng input/output rõ
- Cách orchestrator dispatch
- Pattern parallel

## Có thể tìm kiếm sub-agent template ở đâu?

Có thể tìm kiếm sub-agent template trên [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents?tab=readme-ov-file) và [Agency Agents](https://github.com/msitarzewski/agency-agents)

## Cấu trúc 1 sub-agent

```
.claude/agents/
├── researcher.md       ← agent đọc code, trả summary
├── implementer.md      ← agent viết code 1 module
├── verifier.md         ← agent chạy test
├── security-auditor.md ← agent quét vuln
└── doc-writer.md       ← agent viết docs
```

Mỗi file = 1 agent type. Orchestrator gọi bằng `subagent_type`.

## Template file

`.claude/agents/researcher.md`:

```markdown
---
name: researcher
description: |
  Use to explore codebase and find specific things. Reads files,
  greps for patterns, returns concise summary. Never modifies code.
tools: [Read, Grep, Glob]
---

# Researcher Agent

## Mission
Tìm thông tin trong repo và trả về summary có cấu trúc.

## Workflow
1. Đọc input task từ orchestrator
2. Plan grep/glob query
3. Đọc file relevant (tối đa 20 file)
4. Tổng hợp finding theo template output

## Output format

```markdown
## Finding summary

**Files inspected**: N
**Pattern**: <what searched>

### Key locations
- src/auth/login.ts:42 — JWT verify logic
- src/middleware/cookie.ts:18 — session fallback

### Observations
- 3 đoạn duplicate logic JWT decode
- Inconsistent error handling at 5 sites

### Recommendations
- Centralize JWT helper to src/auth/jwt.ts
- Add typed error class

### Files for follow-up
- src/auth/login.ts (refactor target)
- src/auth/__tests__/* (need update)
```

## Rules
- NEVER edit file (no Edit/Write tool granted)
- Cap output to 500 token
- Cite line numbers when claiming
- Say "uncertain" if not sure, don't guess
```

## Hợp đồng I/O (quan trọng nhất)

### Input từ orchestrator

```
{
  "objective": "Find all JWT-related code in src/auth/",
  "context": "Refactoring to centralize JWT logic",
  "output_format": "summary with file:line citations",
  "max_token": 500
}
```

### Output về orchestrator

```markdown
## Finding summary
... (theo template trên)
```

→ Structured. Orchestrator parse được.

## Pattern dispatch từ orchestrator

### Sequential (mỗi task chờ kết quả trước)

```
Orchestrator:
1. Dispatch researcher → wait → get findings
2. Dispatch implementer with findings → wait → get diff
3. Dispatch verifier with diff → wait → get pass/fail
4. Synthesize final report
```

### Parallel (3 task độc lập, dispatch cùng lúc)

```
Orchestrator (1 message, 3 tool calls):
- Agent(subagent_type=researcher, task="explore auth/")
- Agent(subagent_type=researcher, task="explore middleware/")
- Agent(subagent_type=researcher, task="explore tests/")

Wait all → 3 summary → merge
```

**Claude Code**: gửi nhiều `Agent` tool call trong **cùng 1 message** = parallel.

## Anti-pattern

### ❌ Tool đầy đủ

Sai:
```yaml
tools: [Read, Edit, Write, Bash, Glob, Grep, ...]
```
→ Sub-agent có quá nhiều quyền = mất isolation = giống agent chính.

Đúng — minimum tool:
```yaml
# researcher
tools: [Read, Grep, Glob]
# implementer
tools: [Read, Edit, Write]
# verifier
tools: [Bash, Read]
```

### ❌ Output không cấu trúc

Sai: sub-agent viết essay 2000 từ.
Đúng: output template fixed, ≤ 500 token.

### ❌ Sub-agent gọi sub-agent

Tối đa 2 tầng. Sub-agent của sub-agent = lằng nhằng, debug khó.

### ❌ Description mơ hồ

Sai: `description: A helpful agent`
Đúng: `description: Use to <verb> <object> when <condition>. Never <forbidden>.`

## 5 agent type chuẩn nên có

| Agent | Tool | Use case |
|-------|------|----------|
| `researcher` | Read, Grep, Glob | Explore, tìm pattern |
| `implementer` | Read, Edit, Write | Sửa code 1 module |
| `verifier` | Bash, Read | Chạy test, lint, type-check |
| `reviewer` | Read, Grep | Review diff, tìm vuln |
| `doc-writer` | Read, Edit, Write | Cập nhật README, ADR |

→ Set tối thiểu cho orchestrator pattern.

## Context budget

Mỗi sub-agent chạy session riêng. Orchestrator chỉ thấy output. Quy tắc:

- **Input** từ orchestrator: ≤ 500 token (objective + context)
- **Output** từ sub-agent: ≤ 1000 token (summary structured)
- Sub-agent intra-context: 10k-50k token tuỳ task

→ Orchestrator giữ context lean dù sub-agent đọc nhiều.

## Test sub-agent

Tạo xong, test bằng 1 task mẫu:

```
You: dispatch researcher to find all `useEffect` without cleanup in src/

Claude: [Agent tool: subagent_type=researcher, ...]
       
       [returns]
       
       Researcher trả về:
       ## Finding
       Files inspected: 23
       useEffect without cleanup: 7
       - src/Auth.tsx:42 — subscription no unsub
       - src/Map.tsx:88 — interval no clear
       ...
```

→ Output đúng format = sub-agent OK.

## Tiếp theo

Apply pattern thực tế: [Project 01 — Bước 11 Orchestrator upgrade](/projects/01-test-automation-playwright-mcp)
