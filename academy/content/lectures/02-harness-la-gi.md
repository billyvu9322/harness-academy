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

## 5 subsystem cốt lõi

Một harness thực dụng có 5 subsystem. Các layer như permission, hook, sub-agent nằm bên trong hoặc cắt ngang 5 subsystem này.

### 1. Instruction Subsystem

Cho agent repo map, không phải bách khoa toàn thư:
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `docs/architecture.md`, `docs/testing.md`, `docs/runbook.md`
- Definition of Done, command thật, gotcha, link tới doc sâu

Rule: instruction file là **index**, không phải nơi nhồi mọi chi tiết.

### 2. Tool Subsystem

Set các "hành động" model có thể gọi:

```
Read, Write, Edit, Bash, Glob, Grep
```

Tool nên có schema hẹp, tên rõ, output có cấu trúc, và quyền tối thiểu. Cộng với MCP (Model Context Protocol) để plug tool ngoài.

Permission là một phần của tool subsystem:

Gate trước khi tool chạy:
- Allowlist command
- Deny destructive (`rm -rf`, `force-push`)
- Approval prompt cho action có rủi ro

### 3. Environment Subsystem

Đảm bảo execution tái lập được:
- Runtime version
- Package manager + lockfile
- Dev server command
- Test/lint/typecheck command
- `.env.example` và service phụ thuộc

### 4. State Subsystem

State không nằm trong RAM model — nằm trong **repo**:
- File markdown làm memo
- Plan file cho multi-step
- Todo list theo session
- Git commit, PR description, trace store

### 5. Feedback Subsystem

Thay confidence bằng bằng chứng:
- Typecheck, lint, build
- Unit/integration/E2E test
- Browser smoke check
- Runtime log, screenshot, trace
- Code review hoặc evaluator riêng

### Hooks / Events là cơ chế enforcement

Script tự động chạy trên event:
- `SessionStart` — load context
- `PreToolUse` — kiểm permission
- `PostToolUse` — log, format code
- `SessionEnd` — cleanup

### Sub-agents / Delegation là orchestration pattern

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

[agents.md](https://agents.md/) định nghĩa format **mở** cho file instruction agent. Nhiều coding agent đã hỗ trợ hoặc đang hội tụ quanh pattern này.

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

Đơn vị workflow load theo nhu cầu trong harness hiện đại. Mỗi skill =
- 1 file `SKILL.md` mô tả + trigger rule
- Optional script bundled
- Load **dynamic** khi task match

Học sâu ở mục [Skills](/skills).

## Điểm chính

- Harness = 5 subsystem chính: instruction, tool, environment, state, feedback
- Permission, hook, skill, sub-agent là cơ chế để 5 subsystem đó chạy ổn định
- Không tool nào "có sẵn" harness hoàn hảo — bạn phải custom
- Học từng layer riêng → ghép lại = workflow

## Tiếp theo

[Lecture 03 — Repository là System of Record](/lectures/03-repo-la-system-of-record)
