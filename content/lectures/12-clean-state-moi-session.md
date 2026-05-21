---
title: "Lecture 12 — Mọi session phải để lại clean state"
description: "Rác từ session trước = bug session sau. Cleanup là bắt buộc."
order: 12
duration: "8 phút đọc"
tags: [foundation, lifecycle]
---

## Vấn đề: rác tích tụ

Session 1 agent:
- Tạo `tmp/debug.log`
- Tạo branch experiment `feature/test-x`
- Stash 1 batch change "for later"
- Để 2 file `.bak`
- Crash giữa lệnh, không cleanup

Session 2:
- Load lại — thấy rác, tưởng là code thật
- Build lên rác → bug
- Hoặc bị confuse "branch này để làm gì?"

→ State drift.

## Nguyên tắc

> **Mọi session bắt đầu với clean state. Mọi session kết thúc trả lại clean state.**

State drift = silent killer của agent workflow.

## "Clean" có nghĩa gì?

### 1. Git tree

```bash
git status
# nothing to commit, working tree clean
```

Hoặc: only intentional changes, staged đúng, commit message rõ.

### 2. Không file tạm

Không còn:
- `*.bak`, `*.tmp`, `*.orig`
- Debug log
- Stash unrelated
- Branch experiment chưa merge/delete

### 3. Process

Không còn:
- Dev server bỏ chạy
- Test container không tắt
- Port bị bind

### 4. State file

Plan file đã update đúng status. Todo đã complete hoặc note rõ blocker.

## Implement: SessionEnd hook

Claude Code:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "git status --short" },
          { "type": "command", "command": "ls tmp/ 2>/dev/null && echo 'CLEAN tmp/!'" },
          { "type": "command", "command": "lsof -i :3000 && echo 'KILL dev server!'" }
        ]
      }
    ]
  }
}
```

→ Cuối session, hook nhắc nhở.

## Cleanup Skill

```yaml
---
name: session-cleanup
description: Run before ending session. Verifies clean git state, no tmp files, no stray processes.
---
1. git status — show diff if any
2. Confirm with user: commit / discard / stash
3. Check tmp/, .cache/, *.log — list orphans
4. List branches not merged: git branch --no-merged main
5. Kill dev server if running on standard ports
6. Update plan file with current status
7. Save TodoWrite state
8. Output: "Session ended cleanly" + summary
```

## Edge case: Long-running task

Task chưa xong nhưng phải end session:
- KHÔNG cleanup pending work
- Update plan file: "WIP: tại bước X, file Y dang dở"
- Commit WIP với prefix `wip:` rõ ràng
- Note exact next step cho session sau

→ "Clean" = state có ý thức, không phải "xoá hết".

## Anti-pattern: Yolo cleanup

Sai:
```bash
git checkout .  # discard ALL changes
rm -rf tmp/
git branch -D feature/test-x
```

→ Có thể xoá nhầm work in progress. **DESTRUCTIVE**.

Đúng:
- Liệt kê tất cả file dirty
- Confirm từng cái: keep / discard / stash
- Branch chưa merge → hỏi user

## Worktree pattern

Cho task isolation cao:
- Mỗi task = 1 worktree riêng
- Done → exit worktree → auto cleanup
- Không lo polluting main workspace

Claude Code có `EnterWorktree` / `ExitWorktree` tool.

## Postmortem rule

Khi session crash:
- Đầu session sau, init skill kiểm git state
- Nếu dirty → recovery flow trước khi action mới
- Document gì xảy ra → CLAUDE.md gotcha (nếu lặp lại)

## Điểm chính

- State drift = silent killer
- SessionEnd hook + cleanup skill = enforce
- Long-task: WIP có ý thức, không yolo cleanup
- Worktree cung cấp isolation triệt để

## Liên kết tới các bài còn lại

Series nền tảng 12 lecture đã khép. Mở rộng:

- [Lecture 13 — Orchestrator & Sub-agent](/lectures/13-orchestrator-va-sub-agent) — scale workflow với nhiều agent
- [Project 01](/projects/01-test-automation-playwright-mcp) — áp toàn bộ vào test automation
- [Skills](/skills) — template skill production-grade
