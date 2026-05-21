---
title: "Lecture 07 — Agent overreach và under-finish"
description: "Vì sao agent làm quá hoặc làm thiếu, và cách khoá scope."
order: 7
duration: "10 phút đọc"
tags: [foundation, scope]
---

## Hai cực bệnh

### Overreach (làm quá)

Task: "fix bug login redirect" → Agent:
- Refactor cả module auth
- Đổi tên 12 biến
- Thêm 3 helper function "for cleanliness"
- Update package version

→ 200 file diff. Bạn review không nổi. Bug fix thật sự bị chôn.

### Under-finish (làm thiếu)

Task: "implement feature signup" → Agent:
- Tạo route + handler
- Skip test
- Skip validation edge case
- Claim done

→ Code lên prod → user signup với email rỗng → bug.

## Vì sao xảy ra?

### Overreach

Model train trên code "clean". Khi thấy code không sạch, instinct = sửa. Không phân biệt "trong scope" vs "ngoài scope".

### Under-finish

Tokens cost time. Model có bias tiết kiệm — claim done sớm. Đặc biệt khi prompt không có verify gate.

## Đối sách: Khoá phạm vi (Scope Lock)

### 1. Prompt scope rõ

```
SỬA: redirect bug ở login flow
KHÔNG SỬA: tên biến, format code, refactor logic không liên quan
KHÔNG THÊM: dependency, helper function, abstraction mới
DONE = test pass + bug verified gone
```

→ Phương châm: liệt kê **explicit** cái KHÔNG được làm.

### 2. Plan mode

Claude Code có Plan Mode. Agent viết plan trước → bạn approve → mới code. Plan ngoài scope → reject.

### 3. Diff size limit

Skill rule:
```
Nếu diff > 20 file mà task chỉ là bugfix → STOP, hỏi user.
Nếu touch file không liên quan → STOP, justify hoặc revert.
```

### 4. Feature list = primitive

Trước khi code, bắt agent liệt kê **chính xác** danh sách thay đổi:

```
Feature list:
- [ ] Sửa redirect logic in src/auth/login.ts line 42
- [ ] Update test in src/auth/__tests__/login.test.ts  
- [ ] Verify e2e login flow not regress
```

Code phải match đúng list. Vượt → cờ đỏ.

## Đối sách: Finish Gate (cổng hoàn thành)

### 1. Verification skill (bắt buộc)

```yaml
---
name: verification-before-completion
description: MUST run before claiming any task done.
---
1. Run: npm test → all green?
2. Run: npm run type-check → no error?
3. Run: npm run lint → no error?
4. Compare diff vs feature list → all checked?
5. Run e2e if UI/API changed
6. ONLY THEN say "done", paste evidence
```

### 2. "Done = evidence" rule

Memory file rule:
```
NEVER claim done without pasting test output.
If you can't run test, SAY SO explicitly, không claim done.
```

### 3. Definition of Done

```
DoD cho mỗi task:
- [ ] Code change match feature list
- [ ] Unit test pass
- [ ] Type check pass
- [ ] Manual smoke test passed
- [ ] No new warning in console
```

## Pattern: TodoWrite mỗi item

Mỗi item trong feature list → 1 todo riêng. Agent mark complete **từng cái**. Không batch.

→ Visibility: bạn thấy real-time agent đang ở đâu.

## Ví dụ workflow đúng

```
User: fix bug login redirect

Agent: [init skill]
       Feature list:
       1. Reproduce bug
       2. Identify root cause
       3. Fix
       4. Add regression test
       5. Verify e2e

       [TodoWrite tạo 5 todo]
       
       Starting item 1...
       [actions]
       Item 1 done. ✓
       
       Item 2: root cause = redirect_url not encoded properly.
       
       ... [each item explicit]
       
       Item 5 done. Test output:
       ```
       ✓ login redirects correctly (143ms)
       ✓ regression: no double-encode (12ms)
       PASS  src/auth/__tests__/login.test.ts
       ```
       Task complete.
```

## Điểm chính

- Overreach + under-finish = 2 lỗi đối xứng
- Scope lock: liệt kê cái KHÔNG được làm
- Feature list trước, todo per item, verify gate
- Done = evidence, không phải lời nói

## Tiếp theo

[Lecture 08 — Feature list là primitive của harness](/lectures/08-feature-list-la-primitive)
