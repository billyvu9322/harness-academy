---
title: "Lecture 06 — Init phase cần được tách riêng"
description: "Trước khi code, agent phải biết: dự án gì, scope đâu, đã làm gì."
order: 6
duration: "9 phút đọc"
tags: [foundation, lifecycle]
---

## Vấn đề: Agent "lao vô làm" ngay

Một nhiệm vụ điển hình: "thêm endpoint users". Agent thường:
- Đoán stack
- Đoán convention
- Đoán file structure
- Viết code → sai 50% — không match convention dự án

Nguyên nhân: **không có init phase**.

## Init phase = gì?

Pha **trước khi action chính** — agent thu thập đủ context để quyết định đúng:

1. Đọc memory file (CLAUDE.md/AGENTS.md)
2. Kiểm git state (branch, dirty file, last commit)
3. Đọc plan file đang active (nếu có)
4. Load skill phù hợp với task
5. Confirm scope với user nếu task ambiguous

Chỉ sau init xong → bắt đầu action.

## Vì sao bắt buộc tách phase?

### 1. Determinism

Init = deterministic step (đọc file, run command). Agent reasoning bắt đầu **sau** khi có data.

### 2. Token efficiency

Init load file vô context **1 lần**. Mọi tool call sau dùng chung context đó. Không reload mỗi lần.

### 3. Scope clarity

Sau init, agent có thể trả lời: "Tôi sẽ làm X, Y, Z. Không đụng A, B, C. OK?" → bạn confirm trước khi action.

## Cách implement: SessionStart hook + init skill

### Claude Code hook

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          { "type": "command", "command": "cat CLAUDE.md" },
          { "type": "command", "command": "git status --short" },
          { "type": "command", "command": "git log --oneline -5" }
        ]
      }
    ]
  }
}
```

→ Mỗi session mở, hook đẩy context vào.

### Codex AGENTS.md

Đặt instruction ưu tiên ở đầu `AGENTS.md`:

```markdown
# Init checklist (run before any code change)
1. Read this AGENTS.md fully
2. Check `docs/plans/` for active plan
3. Run `git status` to confirm clean tree
4. Confirm scope with user if task >= 3 files affected
```

### Skill Init

```yaml
---
name: init-session
description: Run at start of any non-trivial coding task. Loads project context + git state + active plan.
---
1. Read CLAUDE.md (or AGENTS.md)
2. Run: git status, git log -5, git branch
3. Check docs/plans/ for *.md files
4. Identify task type (feature / fix / refactor / docs)
5. Map task to skills needed
6. Summarize plan to user, await confirm
```

## Pattern xác nhận phạm vi (scope)

Sau init, agent **phải** confirm:

```
Agent: Task = "thêm endpoint users". Hiểu là:
       - Tạo route GET /users/:id
       - Service + repository layer (theo convention dự án)
       - Test e2e với supertest
       - Không đụng module auth, không sửa schema
       OK proceed?
User: ok proceed
```

→ Loại bỏ misalignment trước khi tốn token code sai.

## Anti-pattern: Skip init

Tệ:
```
User: add /users endpoint
Claude: [tạo route trực tiếp, đoán convention]
```

Đúng:
```
User: add /users endpoint
Claude: [SessionStart hook chạy] [reads CLAUDE.md] 
        Dự án dùng Hono + Drizzle, convention controller/service/repo.
        Plan: tạo src/routes/users.ts → service → repo → test.
        Proceed?
```

## Init phase cho task nhỏ

Task siêu nhỏ (sửa typo, rename var) → init nhẹ, chỉ đọc CLAUDE.md.

Task lớn (refactor module) → init nặng: đọc CLAUDE.md + plan + git log + ADR + run test baseline.

→ **Scale init theo scope.**

## Điểm chính

- Init phase = pha bắt buộc trước action
- Hook SessionStart + init skill ép discipline
- Confirm scope trước = save token, save bug
- Skip init = bug downstream

## Tiếp theo

[Lecture 07 — Agent overreach và under-finish](/lectures/07-overreach-under-finish)
