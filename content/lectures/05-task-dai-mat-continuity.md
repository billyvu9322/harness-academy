---
title: "Lecture 05 — Task dài mất continuity"
description: "Compaction + session reset = mất context. Cách persist state."
order: 5
duration: "10 phút đọc"
tags: [foundation, continuity]
---

## Vấn đề

Task lớn (refactor module, build feature dài) chạy > 1 session hoặc > vài giờ. Khi đó:

1. **Compaction** — harness tự nén history khi context gần đầy. Chi tiết mất.
2. **Session reset** — bạn tắt máy, lab mai. Session mới = blank.
3. **Crash** — Claude Code crash, restart. Mất dòng chat.

→ Agent quên: đã quyết định gì, đang ở bước nào, bug nào đã fix.

## Triệu chứng

- Agent hỏi lại câu đã trả lời 1 giờ trước
- Agent re-implement function đã có
- Agent đề xuất approach đã loại bỏ
- Agent claim "starting fresh" giữa task dài

## Giải pháp: Lưu state bên ngoài

State **không** nằm trong chat. State nằm trong:

### 1. Plan file

```
docs/plans/auth-rewrite.md
```

```markdown
# Plan: Auth rewrite từ session → JWT

## Decision
- [x] Chọn JWT httpOnly cookie (ADR-007)
- [x] Migration: dual-mode 2 tuần
- [ ] Phase 1: Add JWT alongside session
- [ ] Phase 2: Move login flow
- [ ] Phase 3: Remove session

## Progress
- 2026-05-18: started Phase 1
- 2026-05-19: JWT issue endpoint done, see src/auth/jwt.ts
- 2026-05-20: middleware updated, TODO test rate limit
```

Agent đọc file này đầu session → hiểu ngay đang ở đâu.

### 2. TodoWrite tool

Claude Code có tool `TodoWrite` persistent. Trạng thái todo nằm ngoài context window — load lại được.

### 3. Commit message + branch name

Branch `feature/auth-rewrite-phase-1`. Commit gần nhất: `wip: jwt issue endpoint, mid-impl`. Đọc git log = biết.

### 4. PR description

Nếu task dài thực sự, mở PR sớm (draft). Mô tả PR = persistent state, ai cũng xem được.

## Pattern "Resume Skill"

Tạo skill `init-resume`:

```yaml
---
name: init-resume
description: Use at session start when continuing a multi-session task. Reads plan file + git log + open PRs.
---
1. Check `docs/plans/` for active plan
2. Run `git log --oneline -20`
3. Run `gh pr list --state open`
4. Summarize: đang ở task nào, bước nào, blocker nào
5. Confirm với user trước khi tiếp tục
```

Mỗi session mới → trigger skill này → agent **tự catch up**.

## Anti-pattern: "Just continue"

Sai:
```
User: continue
Claude: continuing... [hallucinate đang làm gì]
```

Đúng:
```
User: continue
Claude: [reads plan file] Đang ở Phase 1, bước "test rate limit". 
        Test file đang viết dở ở src/auth/__tests__/rate-limit.test.ts. 
        Tiếp tục từ đây?
```

## Pattern Checkpoint

Mọi 30-60 phút work, agent (hoặc bạn ép) chạy:

1. Update plan file: checkbox đã xong + ghi chú bước hiện tại
2. Commit WIP (có prefix `wip:`)
3. Save 1-2 dòng "next step" vào plan

→ Crash bất ngờ vẫn resume được.

## Long-running task = nhiều checkpoint

Task ước tính > 2 giờ → bắt buộc:
- Plan file
- Commit từng 30 phút
- TodoWrite cập nhật realtime
- Cuối session: summary "đã xong / còn lại / blocker"

## Điểm chính

- Compaction là tất yếu. State phải sống ngoài context.
- Plan file + TodoWrite + git = bộ 3 persistent
- Skill resume = catch up tự động đầu session
- "Continue" mà không check state = recipe cho hallucination

## Tiếp theo

[Lecture 06 — Init phase cần được tách riêng](/lectures/06-init-phase-rieng)
