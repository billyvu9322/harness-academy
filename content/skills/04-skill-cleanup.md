---
title: "Session Cleanup Skill — Trả lại clean state"
description: "Cuối session: verify git clean, no tmp, no stray process. Template skill + hook."
order: 4
duration: "5 phút đọc"
tags: [skill, cleanup, lifecycle]
---

## Mục tiêu

- Detect rác trước khi end session
- Confirm với user trước destructive cleanup
- Đảm bảo session sau load lên state predictable

## Template đầy đủ

`.claude/skills/session-cleanup/SKILL.md`:

```markdown
---
name: session-cleanup
description: |
  Run before ending session. Detects orphan files, dirty git tree,
  unmerged branches, stray dev processes. Trigger: end session,
  done for today, wrap up, signing off.
---

# Cleanup protocol

## Step 1: Git tree
```bash
git status
git stash list
```

If dirty:
- List file
- Ask user: commit / discard / stash for resume
- DON'T auto-discard

## Step 2: Orphan files
```bash
ls tmp/ .cache/ 2>/dev/null
find . -name "*.bak" -o -name "*.orig" -o -name "*~" 2>/dev/null
```

List orphans. Ask user before delete.

## Step 3: Unmerged branches
```bash
git branch --no-merged main
```

For each: prompt — merge / delete / keep.

## Step 4: Stray processes
```bash
lsof -i :3000 -i :5173 -i :8000 2>/dev/null
```

If dev server running, ask: kill / keep.

## Step 5: Update plan file
If task incomplete:
- Update plan file with current status
- Mark which steps done
- Note exact next step

If task complete:
- Mark plan archived: rename to docs/plans/archive/

## Step 6: Save TodoWrite state
Output current todos to plan file or commit message.

## Step 7: Summary
```
## Session ended cleanly

- Git: <clean | committed X files | stashed for resume>
- Cleanup: <N orphan files removed | none>
- Branches: <pruned X | kept Y>
- Processes: <killed dev server | none>
- Plan: <archived | updated WIP>

Next session: see <plan file> step <N>.
```

## Anti-pattern

❌ Auto `git checkout .` — destroys WIP
❌ Auto `rm -rf tmp/` — may delete user data
❌ Skip cleanup "vì gấp" — state drift bắt đầu từ đây
❌ Cleanup không update plan → session sau lạc
```

## Hook nhắc nhở

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "git status --short && echo '---' && ls tmp/ 2>/dev/null"
          }
        ]
      }
    ]
  }
}
```

→ Hook in ra state cuối session để bạn (và session sau) thấy.

## Phương án thay thế: Worktree

Nếu dùng worktree cho mỗi task:
- `ExitWorktree` tự cleanup worktree
- Workspace chính không cần cleanup riêng
- Branch tự prune nếu có config

→ Worktree xử lý phần lớn công đoạn cleanup.

## Tiếp theo

[Skill: MCP Integration](/skills/05-mcp-integration)
