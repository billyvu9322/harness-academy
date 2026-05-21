---
title: "Lecture 03 — Repository là System of Record"
description: "State không sống trong context window. State sống trong repo."
order: 3
duration: "10 phút đọc"
tags: [foundation, state]
---

## Nguyên tắc cốt lõi

> **Nếu nó quan trọng — phải nằm trong repo.**

Context window (cửa sổ ngữ cảnh) trong các mô hình ngôn ngữ lớn (LLM) là tổng lượng dữ liệu (văn bản, code, hình ảnh, v.v.) tối đa mà AI có thể đọc, hiểu và ghi nhớ trong một lần giao tiếp hoặc xử lý duy nhất. Hãy hình dung nó giống như dung lượng RAM của bộ não AI và được đo bằng token.

## 3 lý do bắt buộc

### 1. Context window có giới hạn

Claude Sonnet 4.6 = 200k token. 1M token Opus 4.7 lớn hơn — nhưng vẫn hữu hạn. Task dài đầy → compact → mất chi tiết.

### 2. Session không persistent

Đóng terminal → session mới = blank. Nếu decision "dùng JWT thay vì cookie" chỉ ở trong chat history → mất.

### 3. Multi-agent / Multi-session collaboration

Một thành viên dùng Claude Code, người khác dùng Codex. Cả hai agent đọc chung repo → state đồng nhất. Chat history không thể chia sẻ.

## Thực hành: Cái gì lưu vô repo?

### File memory chính

```
AGENTS.md          ← chuẩn mở cross-tool (đề xuất chính)
CLAUDE.md          ← Claude Code default
GEMINI.md          ← Gemini CLI default
.claude/CLAUDE.md  ← scope nhỏ hơn (subdir)
```

Chứa:
- Architecture decisions (ADR ngắn)
- Convention (naming, folder structure)
- Gotcha (workaround, bug history)
- Command shortcut (`npm run dev`, `make test`)

### AGENTS.md — chuẩn mở (cần biết)

> *"AGENTS.md is a simple, open format for guiding coding agents."*  
> — [agents.md](https://agents.md/) (60k+ project đã adopt)

**Vấn đề trước AGENTS.md**: mỗi tool đẻ ra file riêng — `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.aider.conf`, `.continuerules`... → repo đầy file trùng nội dung.

**AGENTS.md** = format chung. **Mọi agent đọc cùng 1 file**.

#### Tool đã support

OpenAI Codex · Google Jules · Aider · VS Code · GitHub Copilot · Cursor · Devin · OpenCode · và 20+ tool khác.

→ AGENTS.md = de-facto cross-tool standard 2025-2026.

#### Khác README.md ra sao?

| | README.md | AGENTS.md |
|--|-----------|-----------|
| Audience | Human contributor | AI coding agent |
| Nội dung | Mô tả dự án, demo, install | Build step, test, convention, security, PR rule |
| Tone | Marketing + onboarding | Concise, programmatic |
| Mục tiêu | Hấp dẫn, dễ đọc | Agent execute được automated check |

> *"README files address human contributors, while AGENTS.md supplies the extra, sometimes detailed context coding agents need: build steps, tests, and conventions that might clutter a README."*

→ Tách concern: README cho người, AGENTS.md cho agent.

#### Section thường dùng

- **Project overview** — 2-3 câu mục đích
- **Build & test commands** — exact CLI
- **Code style** — convention naming, format
- **Testing instructions** — chạy gì, expect gì
- **Security considerations** — secret, sandbox rule
- **PR / commit conventions** — format message, branch rule

#### Monorepo: nested AGENTS.md

```
repo/
├── AGENTS.md                ← root, áp dụng global
├── packages/
│   ├── api/
│   │   └── AGENTS.md        ← override cho package api
│   └── web/
│       └── AGENTS.md        ← override cho package web
```

Agent đọc file gần nhất theo path. Sub-folder override parent. → instruction theo scope.

#### Strategy cho repo dùng nhiều tool

**Option A** — single source:
```
AGENTS.md                    ← nội dung thật
CLAUDE.md → symlink AGENTS.md
GEMINI.md → symlink AGENTS.md
```

**Option B** — 1-line stub:
```markdown
# CLAUDE.md
See [AGENTS.md](./AGENTS.md).
```

**Option C** — tool-specific extension:
- `AGENTS.md` — common
- `CLAUDE.md` — chỉ chứa Claude-specific (hook config, skill list)

→ Chọn theo team. **Single source of truth quan trọng hơn convention nào.**

### File plan

```
docs/plans/auth-rewrite.md
```

Multi-step task → viết plan file trước khi code. Mỗi bước có checkbox.

### Decision log

```
docs/decisions/2026-05-12-jwt-vs-cookie.md
```

ADR (Architecture Decision Record) ngắn. Vì sao chọn X, alternative loại bỏ.

## Anti-pattern: "Memory" trong chat

Sai:
```
User: nhớ là chúng ta dùng PostgreSQL nhé
Claude: Đã ghi nhớ.  ← chỉ nhớ trong session này
```

Đúng:
```
User: nhớ là chúng ta dùng PostgreSQL nhé
Claude: [edits CLAUDE.md to add "DB: PostgreSQL 16"]
```

→ Lần sau load lại session, đọc CLAUDE.md = biết.

## Cấu trúc repo gợi ý

```
my-project/
├── CLAUDE.md                    ← memory chính
├── AGENTS.md                    ← compatible Codex/OpenCode
├── .claude/
│   ├── settings.json            ← config, hook
│   ├── skills/                  ← skill local
│   └── commands/                ← slash command custom
├── docs/
│   ├── plans/                   ← plan cho task lớn
│   ├── decisions/               ← ADR
│   └── runbooks/                ← thao tác lặp lại
├── src/                         ← code
└── tests/                       ← test (e2e ưu tiên)
```

## CLAUDE.md viết sao?

**Quy tắc:** index, không nhồi.

```markdown
# Project: E-commerce API

## Stack
Node 22, TypeScript, Postgres 16, Drizzle ORM, Vitest, Playwright.

## Commands
- Dev: `pnpm dev`
- Test: `pnpm test`
- E2E: `pnpm test:e2e`
- Build: `pnpm build`

## Architecture
- Route handler → service → repository → DB
- Auth: JWT via httpOnly cookie
- See `docs/decisions/` for ADRs

## Convention
- snake_case DB column, camelCase TS
- Errors: throw `AppError`, central handler catches
- Avoid: any, console.log in prod path

## Gotcha
- Migration phải chạy seq, không parallel
- `process.env.JWT_SECRET` required, no default
```

Ngắn, scannable, ai cũng đọc được.

## Điểm chính

- Đừng nhồi context bằng chat. Nhồi qua **file commit**.
- CLAUDE.md = index. Detail ở file riêng.
- Multi-session → cùng repo → cùng state.
- "Ghi nhớ" trong chat = ảo. "Ghi nhớ" trong git = thật.

## Tiếp theo

[Lecture 04 — Vì sao 1 file instruction khổng lồ thất bại](/lectures/04-instruction-file-khong-the-mono)
