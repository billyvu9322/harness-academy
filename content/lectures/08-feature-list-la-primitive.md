---
title: "Lecture 08 — Feature list là primitive của harness"
description: "Đơn vị nhỏ nhất để track, verify, ép hoàn thành."
order: 8
duration: "8 phút đọc"
tags: [foundation, primitive]
---

## Primitive là gì?

Primitive = đơn vị nguyên thủy không thể chia nhỏ hơn nữa mà vẫn còn nghĩa. Trong harness:

- File = primitive cho storage
- Tool call = primitive cho action
- **Feature list item = primitive cho intent**

Thiếu feature list → agent không có "đơn vị" để verify.

## Định nghĩa feature list

Danh sách checkbox **rõ ràng, đo được, atomic** mô tả những gì task này phải hoàn thành.

```markdown
## Feature list — Add user search

- [ ] API: GET /users/search?q=...
- [ ] Pagination (page, pageSize params)
- [ ] Filter: by role, by status
- [ ] Return: id, email, name (không leak password hash)
- [ ] Test: e2e với 3 dataset (empty, normal, edge case)
- [ ] Performance: < 200ms với 10k user
```

Mỗi item:
- **Atomic** — không thể split nhỏ hơn mà vẫn meaningful
- **Verifiable** — có thể kiểm "xong hay chưa"
- **Concrete** — không "improve performance", phải "< 200ms"

## Vì sao quan trọng?

### 1. Anchor cho verification

Khi claim done → verify từng item. Item không check = chưa done.

### 2. Khoá scope

Item ngoài list = ngoài scope. Agent muốn thêm → ask user trước.

### 3. Resume-friendly

Crash session → mở list → biết ngay item nào đã ✓, item nào chưa.

### 4. Communication artifact

List có thể chia sẻ với team — họ nắm được phạm vi task mà không cần đọc 200 file diff.

## Khi nào tạo feature list?

Mọi task **không trivial** (> 30 phút work):
- Add feature
- Refactor module
- Migration
- Bug fix với nhiều branch ảnh hưởng

Task trivial (sửa typo, rename 1 var) → skip.

## Mapping feature list → todo

1 feature item → 1 hoặc nhiều TodoWrite todo.

```
Feature: API GET /users/search

→ Todos:
- Define route + handler skeleton
- Implement search query (Drizzle)
- Add validation (zod schema)
- Write unit test (handler)
- Write e2e test (full flow)
- Manual smoke check
```

Mark complete từng todo → tự nhiên hoàn thành feature.

## Anti-pattern

### Mơ hồ

Sai:
```
- [ ] Make it fast
- [ ] Improve UX
- [ ] Clean up code
```

Không verifiable. Vô dụng.

### Quá to

Sai:
```
- [ ] Rewrite auth module
```

Không atomic. Split:
```
- [ ] Replace session middleware with JWT verifier
- [ ] Migrate login endpoint to issue JWT
- [ ] Update frontend to send JWT
- [ ] Migration plan for existing sessions
```

### Hidden item

Code thay đổi không có trong list → reject hoặc justify.

## Workflow chuẩn

```
1. Receive task
2. Init phase (đọc context)
3. Draft feature list — explicit, atomic, verifiable
4. Confirm với user
5. TodoWrite mỗi item → 1+ todo
6. Code từng item, mark todo done
7. Verification gate: check từng feature item
8. Paste evidence (test output) per item
9. Done
```

## Điểm chính

- Feature list = đơn vị verify nhỏ nhất
- Atomic + verifiable + concrete
- Item ngoài list = ngoài scope (cờ đỏ)
- Mọi task không trivial bắt đầu bằng feature list

## Tiếp theo

[Lecture 09 — Agent declare victory quá sớm](/lectures/09-victory-som)
