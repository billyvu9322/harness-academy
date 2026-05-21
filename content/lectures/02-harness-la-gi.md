---
title: "Lecture 02 — Harness thực sự là gì?"
description: "Định nghĩa harness, các thành phần, ví dụ thực tế từ Claude Code & Codex."
order: 2
duration: "12 phút đọc"
tags: [foundation, architecture]
---

## Định nghĩa ngắn

> **Harness** = lớp scaffolding bao quanh LLM, biến model thành agent vận hành đáng tin trong task thực tế.

Không có harness, model chỉ là API. Có harness, model trở thành "đồng nghiệp".

## 7 thành phần cốt lõi

### 1. Tool Layer

Set các "hành động" model có thể gọi:

```
Read, Write, Edit, Bash, Glob, Grep
```

Mỗi tool deterministic — đầu vào giống nhau luôn cho đầu ra giống nhau. Cộng với MCP (Model Context Protocol) để plug tool ngoài.

### 2. Permission Layer

Gate trước khi tool chạy:
- Allowlist command
- Deny destructive (`rm -rf`, `force-push`)
- Approval prompt cho action có rủi ro

### 3. Context Management

- System prompt (instruction tĩnh)
- File memory (CLAUDE.md, AGENTS.md)
- Compaction khi context đầy
- Skills load dynamic theo task

### 4. State Persistence

State không nằm trong RAM model — nằm trong **repo**:
- File markdown làm memo
- Plan file cho multi-step
- Todo list theo session

### 5. Verification Gate

Ép chạy test/lint/type-check **trước khi claim done**. Output evidence, không output assertion.

### 6. Hooks / Events

Script tự động chạy trên event:
- `SessionStart` — load context
- `PreToolUse` — kiểm permission
- `PostToolUse` — log, format code
- `SessionEnd` — cleanup

### 7. Sub-agents / Delegation

Spawn agent con cho task độc lập (research, parallel exploration). Trả về **summary**, không trả về toàn bộ output → bảo vệ context window chính.

## Map sang các tool phổ biến

| Component | Claude Code | Codex | Gemini CLI |
|-----------|-------------|-------|-------|
| Tool layer | Read/Edit/Bash + Skills | Read/Edit/Apply + Shell | Read/Edit/Shell |
| Permission | hook + allowlist | sandbox mode (read/workspace/full) | confirm prompt |
| Memory file | CLAUDE.md (+ AGENTS.md) | AGENTS.md | GEMINI.md (+ AGENTS.md) |
| State | TodoWrite + memory file | resume + .codex/ | session state |
| Verification | hook + skill | approval policy | manual |
| Hooks | SessionStart/PreTool/etc | command hooks | (limited) |
| Sub-agent | Agent tool + types | exec sub-task | sub-task |

→ **Cùng triết lý, khác cú pháp.** Học 1 sâu, học các tool khác nhanh.

### AGENTS.md là chuẩn mở (cross-tool)

[agents.md](https://agents.md/) định nghĩa format **mở** cho file instruction agent. Được adopt bởi Codex, Cursor, Aider, GitHub Copilot, Devin, Google Jules, OpenCode... (20+ tool).

→ Viết `AGENTS.md` 1 lần — mọi tool đọc được. CLAUDE.md / GEMINI.md có thể là symlink hoặc stub trỏ về.

Chi tiết: [Lecture 03 — Repository là System of Record](/lectures/03-repo-la-system-of-record).

## Ví dụ minh hoạ

Task: "Thêm endpoint `/users/:id` trả user info"

**Không harness:**
1. Model viết code endpoint
2. Claim done
3. Bạn chạy test → fail
4. Báo lại model → vòng lặp tốn token

**Có harness:**
1. **Skill** `init` chạy: load schema DB, route hiện tại
2. **Plan** tạo: tạo route → handler → test → migration nếu cần
3. **Tool** Edit thêm code
4. **Hook** PostToolUse chạy test ngay
5. **Verification skill** kiểm: test pass, type-check pass
6. **Hook** SessionEnd: clean tmp file, commit message gợi ý

→ Output: code chạy được + evidence + clean state.

## Skill là gì? (preview)

Đơn vị nguyên thủy của harness modern. Mỗi skill =
- 1 file `SKILL.md` mô tả + trigger rule
- Optional script bundled
- Load **dynamic** khi task match

Học sâu ở mục [Skills](/skills).

## Điểm chính

- Harness = 7 layer, không phải 1 thứ duy nhất
- Không tool nào "có sẵn" harness hoàn hảo — bạn phải custom
- Học từng layer riêng → ghép lại = workflow

## Tiếp theo

[Lecture 03 — Repository là System of Record](/lectures/03-repo-la-system-of-record)
