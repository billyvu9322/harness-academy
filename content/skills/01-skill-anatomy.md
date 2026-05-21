---
title: "Skill Anatomy — Cấu trúc của một Skill"
description: "SKILL.md là file cấu trúc (Entrypoint) bắt buộc của một Skill. Nó chứa phần khai báo điều kiện kích hoạt (Frontmatter) và các bước hướng dẫn (Instruction) chi tiết bằng Markdown để AI Agent đọc hiểu và thực thi chuẩn xác một nhiệm vụ cụ thể."
order: 1
duration: "8 phút đọc"
tags: [skill, anatomy]
---

## Tìm kiếm skill ở đâu?

Có thể tìm kiếm các skills trên [Skills Marketplace](https://skillsmp.com/) — thư viện public, nhiều skill hay.

## Anatomy 1 skill

```
.claude/skills/your-skill/
├── SKILL.md            ← entrypoint bắt buộc
├── scripts/            ← optional, code chạy
│   ├── parse.py
│   └── validate.sh
├── references/         ← optional, tài liệu sâu
│   └── api-spec.md
└── templates/          ← optional, copy-ready
    └── boilerplate.ts
```

## SKILL.md format

```markdown
---
name: my-skill
description: |
  Use when [trigger condition]. Keywords: [list].
  This skill helps with [purpose].
---

# Instructions

Body Markdown free-form. Có thể:
- Liệt kê step
- Reference scripts/ hoặc references/
- Code example
- Anti-pattern

## Example
...

## Anti-pattern
...
```

## Frontmatter rules

| Field | Required | Mục đích |
|-------|----------|----------|
| `name` | ✓ | Identifier, dùng để invoke |
| `description` | ✓ | Trigger signal — viết RÕ "Use when..." |

**Quan trọng:** description load vô system prompt **mỗi turn**. Phải ngắn nhưng có signal trigger rõ.

## Description viết sao?

### Sai (mơ hồ)

```
description: A helpful skill for working with databases
```

→ Khi nào trigger? Model không biết.

### Đúng (trigger rõ)

```
description: |
  Use when user modifies database schema, writes migration, or asks
  about table relationships. Keywords: schema, migration, ALTER TABLE,
  Drizzle, foreign key.
```

→ Trigger condition rõ + keyword cụ thể.

## Body structure

Body free-form nhưng nên có:

### 1. Purpose (1-2 dòng)

```markdown
# Database Schema Helper

Validate schema changes, generate migration, prevent breaking change.
```

### 2. Step-by-step

```markdown
## Workflow

1. Read current schema: `cat schema.sql`
2. Diff vs proposed change
3. Run `./scripts/check-breaking.sh`
4. Generate migration: `./scripts/gen-migration.sh`
5. Verify with test
```

### 3. Reference bundled

```markdown
## Detailed reference
See [references/drizzle-patterns.md](references/drizzle-patterns.md) 
for complex relationship pattern.
```

### 4. Anti-pattern (cảnh báo trước)

```markdown
## NEVER

- DROP COLUMN without 2-phase migration
- Rename column directly (use add + backfill + drop)
```

## Progressive Disclosure tại runtime

```
Turn 1: User mention "schema"
  → Lớp 1: model thấy description match
  → Lớp 2: harness load SKILL.md body vô context
  → Lớp 3: nếu cần migration pattern → load references/drizzle-patterns.md

Turn 2: User chuyển sang task khác
  → Skill drop khỏi context (lớp 2-3 thả ra)
  → Lớp 1 description vẫn còn (cheap, ~50 token)
```

## Bundled script

Code deterministic > prompt. Ví dụ:

```python
# scripts/check-breaking.py
import json, sys

def check(old, new):
    breaks = []
    for col in old:
        if col not in new:
            breaks.append(f"REMOVED: {col}")
    return breaks
```

Skill chỉ định:
```markdown
Run: `python scripts/check-breaking.py old.json new.json`
If any breaking → STOP, alert user.
```

→ Model không tự "compute" — gọi script.

## Quy tắc tốt

1. **1 skill = 1 trách nhiệm**. Đừng nhồi.
2. **Description trigger explicit**. Keyword list.
3. **Body < 200 dòng**. Lớn hơn → split.
4. **Script for compute**. Markdown for guidance.
5. **Anti-pattern section**. Cảnh báo bug history.

## Skill khi nào tạo?

✓ Workflow lặp lại > 3 lần
✓ Cần deterministic action (parse, validate)
✓ Domain knowledge chuyên biệt
✓ Anti-pattern khó nhớ

✗ One-off task
✗ General knowledge (model biết sẵn)
✗ Quá nhỏ (< 20 dòng → CLAUDE.md)

## Tiếp theo

[Skill: Verification Before Completion](/skills/02-skill-verification)
