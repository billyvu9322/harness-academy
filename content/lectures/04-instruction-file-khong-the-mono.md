---
title: "Lecture 04 — Một file instruction khổng lồ luôn fail"
description: "Vì sao CLAUDE.md 5000 dòng tệ hơn 50 dòng + skill split."
order: 4
duration: "10 phút đọc"
tags: [foundation, instruction]
---

## Phản xạ tự nhiên (sai)

Logic phổ biến: AI cần context tốt → viết CLAUDE.md càng chi tiết càng tốt → file phình lên 3000-5000 dòng.

**Vấn đề:** càng dài, hiệu quả càng giảm.

## 4 lý do file monolithic fail

### 1. Token cost mỗi turn

CLAUDE.md load vào **mọi turn**. File 5000 dòng = 20k token mỗi message. Chat 50 lượt = 1M token chỉ cho instruction. Đắt + chậm.

### 2. Signal-to-noise giảm

Model nhìn 5000 dòng → rule quan trọng "luôn chạy test trước commit" bị chìm trong 4999 dòng khác. Attention rải đều.

### 3. Stale content

File càng dài, càng nhiều phần outdated. Rule "dùng Redux" còn đó dù dự án đã chuyển sang Zustand 6 tháng trước. Model làm theo rule cũ → bug.

### 4. Khó maintain

Không ai muốn đọc 5000 dòng để sửa 1 rule → file không được cập nhật → nội dung drift theo thời gian.

## Pattern đúng: Progressive Disclosure

Khái niệm từ Anthropic Skills doc. **Load dần theo nhu cầu.**

3 lớp:

| Lớp | Khi load | Nội dung | Token cost |
|-----|----------|----------|------------|
| 1 | Mọi turn | Name + description metadata | ~50 token/skill |
| 2 | Khi relevant | Full SKILL.md body | 200-1000 token |
| 3 | On-demand | Bundled files (script, ref) | Tuỳ |

→ Mỗi turn chỉ trả tiền cho cái thật sự cần.

## Cách split CLAUDE.md

### Trước (mono, sai)

`CLAUDE.md` 4000 dòng chứa:
- Stack
- Architecture
- Database schema chi tiết
- API spec
- Style guide
- Test convention
- Deployment process
- Onboarding cho dev mới
- ...

### Sau (modular, đúng)

`CLAUDE.md` 80 dòng — chỉ index:

```markdown
# Project X
Stack: Node 22, TS, Postgres. See docs/architecture.md.
Commands: pnpm dev | test | build
Rule chính: chạy test trước claim done. Không refactor không yêu cầu.
```

Rồi tách:

```
.claude/skills/
├── database-schema-helper/SKILL.md   ← load khi sửa schema
├── api-design-review/SKILL.md         ← load khi tạo endpoint
├── test-writer/SKILL.md               ← load khi viết test
└── deployment-runbook/SKILL.md        ← load khi deploy
```

Mỗi skill chỉ load khi description match. CLAUDE.md siêu nhẹ.

## Khi nào nên tạo Skill?

Tạo skill khi:
- Cùng workflow lặp lại nhiều lần
- Cần script deterministic (parse, format, validate)
- Domain knowledge chuyên biệt (chỉ relevant 10% task)

KHÔNG tạo skill khi:
- 1 lần dùng → viết thẳng vô prompt
- General coding knowledge model đã biết
- Quá ngắn (< 20 dòng) → nhét vô CLAUDE.md ổn

## Quy tắc kích thước

- `CLAUDE.md`: < 100 dòng. Là index.
- 1 skill: < 200 dòng body. Bundle script/file ngoài.
- 1 file plan: < 300 dòng. Lớn hơn → split task.

## Ví dụ trigger rule trong description

```yaml
---
name: database-schema-helper
description: |
  Use when user modifies schema, adds migration, or asks about
  table relationships. Triggers on keywords: schema, migration,
  table, foreign key, drizzle, postgres.
---
```

→ Skill chỉ activate khi context match. Không phí token.

## Điểm chính

- File mono → token waste + signal loss + stale
- Progressive disclosure = chỉ load cái cần
- CLAUDE.md = index, không phải bách khoa
- Skill có description rõ trigger → harness tự pick

## Tiếp theo

[Lecture 05 — Task dài mất continuity](/lectures/05-task-dai-mat-continuity)
