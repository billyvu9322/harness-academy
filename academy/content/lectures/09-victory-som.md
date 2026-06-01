---
title: "Lecture 09 — Agent declare victory quá sớm"
description: "Báo done khi chưa thật done. Cách build verification gate."
order: 9
duration: "9 phút đọc"
tags: [foundation, verification]
---

## Hiện tượng phổ biến

```
Agent: Tôi đã implement xong feature. Mọi thay đổi nhìn ổn.
```

Kiểm tra thực tế:
- Test chưa chạy
- Code có compile error
- Edge case chưa cover
- File save không?

→ "Done" = lời nói. Không phải sự thật.

## Vì sao xảy ra?

### 1. Completion bias

Assistant có xu hướng kết thúc bằng câu trả lời tích cực. Trong coding task, câu "done" dễ xuất hiện trước khi có bằng chứng chạy thật.

### 2. Verification tốn công

Chạy test, đọc log, sửa lỗi mất thời gian. Nếu harness không ép, agent dễ chọn đường ngắn: nói code "chắc chạy được".

### 3. No external gate

Nếu prompt không ép verify → agent assume self-judgment đủ. Không đủ.

## Pattern Verification Gate

Gate = checkpoint **bắt buộc** trước khi agent được phép nói "done".

### Cấu trúc gate

```
1. Run automated checks (test, lint, type)
2. Capture output (không paraphrase)
3. Map output to feature list (item nào pass / fail)
4. Chỉ khi tất cả pass → claim done + paste evidence
5. IF anything fail → fix, re-verify, không claim done
```

## Implement: Verification Skill

```yaml
---
name: verification-before-completion
description: |
  Use when about to claim work is complete, fixed, or passing,
  before committing or creating PRs. Requires running verification
   commands and confirming output before any success claim.
   Bằng chứng trước, kết luận sau.
---

# Verification protocol

Run these in order. STOP at first failure, fix, restart.

## 1. Type check
```bash
npm run type-check
# or: tsc --noEmit
```
Paste exact output. Must be empty (no error).

## 2. Lint
```bash
npm run lint
```
Paste output. Zero error, warnings ok if pre-existing.

## 3. Unit test
```bash
npm test -- --run
```
Paste output. All tests pass.

## 4. E2E test (if UI/API changed)
```bash
npm run test:e2e
```
Paste output. All green.

## 5. Map to feature list
For each item in feature list:
- Pass/Fail
- Evidence: which test/check confirms it

## 6. Only after all green:
"Done. Evidence above."

## ANTI-PATTERN
- "Test chắc pass" — không. Chạy test.
- "Tôi nghĩ cái này chạy" — không. Verify.
- Bỏ qua vì "hiển nhiên" — không. Vẫn chạy.
```

## Evidence-Before-Assertions

Quy tắc vàng:

> **Mọi claim "X works" phải đi kèm output chứng minh X.**

Không có output = không có claim.

### Ví dụ đúng

```
Agent: Test pass:
```
$ npm test
✓ user can login (45ms)
✓ user blocked after 5 fail (67ms)
PASS src/auth/__tests__/login.test.ts (2 tests)
```
Done.
```

### Ví dụ sai

```
Agent: Với thay đổi này test chắc pass. Done.
```

## Hook-level enforcement

Hook `PreToolUse` cho keyword "done" có thể trigger verification:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "if echo '$TOOL_INPUT' | grep -q 'git commit'; then npm test || exit 1; fi"
      }
    ]
  }
}
```

→ Hệ thống chặn commit nếu test fail.

## Memory rule cứng

`CLAUDE.md`:
```
ABSOLUTE RULE:
NEVER claim completion without test output evidence.
Nếu không verify được, nói rõ:
"Tôi chưa verify được vì X. Cần user xác nhận hoặc cung cấp Y."

Không claim done.
Không nói "chắc chạy được".
```

## Điểm chính

- Premature victory = lỗi #1 của agent
- Verification gate = chặn bằng skill + hook + rule
- Evidence-before-assertions: output trước, claim sau
- "Can't verify" honest > "Done" dối

## Tiếp theo

[Lecture 10 — E2E testing thay đổi kết quả](/lectures/10-e2e-testing-quan-trong)
