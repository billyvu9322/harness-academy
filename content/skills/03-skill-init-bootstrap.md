---
title: "Init / Bootstrap Skill — Load context đầu session"
description: "Đầu mỗi session, agent đọc CLAUDE.md, git state, plan file. Tránh blind start."
order: 3
duration: "5 phút đọc"
tags: [skill, init, lifecycle]
---

## Vấn đề skill này giải

Lecture 06 đã nói: skip init = bug. Skill này automate init.

## Full template

`.claude/skills/init-session/SKILL.md`:

```markdown
---
name: init-session
description: |
  Run at start of any non-trivial coding task (>= 3 files affected,
  or task lasting > 10 min). Loads project context, git state,
  active plan. Trigger keywords: start, begin, work on, resume.
---

# Init protocol

## Step 1: Load memory
```bash
cat CLAUDE.md 2>/dev/null
cat AGENTS.md 2>/dev/null
```

## Step 2: Git state
```bash
git branch --show-current
git status --short
git log --oneline -10
```

## Step 3: Active plan
```bash
ls docs/plans/ 2>/dev/null
```
If files exist, read most recent.

## Step 4: Active PRs
```bash
gh pr list --state open --author @me 2>/dev/null
```

## Step 5: Identify task type
- Feature → load skills: feature-builder, e2e-test
- Bugfix → load skills: bug-repro, verification
- Refactor → load skills: scope-lock, regression-test
- Docs → load skills: technical-writer

## Step 6: Summarize + confirm

Output template:
```
## Session init complete

**Project**: <from CLAUDE.md>
**Branch**: <current>
**Git state**: <clean | dirty: X files>
**Active plan**: <plan file or "none">
**Pending PR**: <list or "none">

**Task understanding**: <restate user task>
**Estimated scope**: <files to touch, est. duration>
**Skills loaded**: <list>

Proceed? (Y/n)
```

Wait for user confirm before action.
```

## Hook tự động trigger

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

→ Mỗi session start, hook đẩy context. Skill xử lý structured.

## Init nhẹ vs nặng

| Task | Init |
|------|------|
| Sửa typo | Skip skill, hook đủ |
| Add small endpoint | Step 1+2 |
| Refactor module | Full skill 6 step |
| Resume multi-day | Full + đọc plan kỹ |

→ **Scale init theo scope.**

## Anti-pattern

❌ Skip init → "lao vô làm" → 5 phút sau quay lại đọc convention
❌ Init quá chi tiết cho task tiny → token waste
❌ Không confirm với user → bug misalignment

## Tiếp theo

[Skill: Session Cleanup](/skills/04-skill-cleanup)
