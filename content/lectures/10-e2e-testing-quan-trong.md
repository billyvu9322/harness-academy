---
title: "Lecture 10 — E2E test thay đổi kết quả"
description: "Vì sao unit test không đủ cho agent work. E2E là gate thật."
order: 10
duration: "10 phút đọc"
tags: [foundation, testing]
---

## Nghịch lý unit test với agent

Agent rất giỏi tạo unit test pass. **Quá giỏi.**

Vì:
- Agent biết signature function
- Agent biết spec mong đợi
- Agent viết mock match spec
- Test pass — *vì test viết theo cùng giả định đã sinh ra bug*

→ Unit test pass + production fail. Lỗi cổ điển.

## E2E khác gì?

E2E test = chạy **trên hệ thống thật**:
- Browser thật (Playwright, Cypress)
- Database thật (test container, không mock)
- HTTP call thật qua network stack
- File I/O thật

Agent không "mock" được reality.

## Vì sao E2E phù hợp với agent?

### 1. Bắt assumption sai

Unit test: agent assume `db.query` trả `[user]`. Mock theo assumption. Pass.

E2E: chạy DB thật. Nếu schema sai → query fail thật → test fail thật.

### 2. Detect side-effect ngoài ý muốn

Agent sửa endpoint A → vô tình ảnh hưởng B. Unit test A pass. E2E flow A→B → fail.

### 3. Verify integration

Frontend agent claim "button works". E2E click button thật → mới biết.

## Pattern: E2E là verify gate

```
Feature list: thêm endpoint /users/:id

Verification (theo order):
1. Type check ✓
2. Lint ✓
3. Unit test handler ✓
4. **E2E**: POST /users → GET /users/:id → assert response ← gate quyết định
5. Performance check (nếu critical)
```

Bước 4 fail = chưa done, dù 1-3 pass.

## Công cụ: Playwright MCP

Claude Code support MCP. Playwright MCP cho agent **điều khiển browser**:

```
Agent gọi: mcp__playwright__browser_navigate("http://localhost:3000")
Agent gọi: mcp__playwright__browser_click(selector)
Agent gọi: mcp__playwright__browser_snapshot()  ← screenshot
Agent gọi: mcp__playwright__browser_evaluate(js)
```

→ Agent **thực sự click**, không simulate. Catch bug thật.

## Chrome DevTools MCP

Tương tự, có MCP cho Chrome DevTools:
- Network inspection
- Performance trace
- Memory snapshot
- Console message capture

→ Agent debug FE giống dev thật.

## Anti-pattern: "tôi đã test bằng mắt"

Sai:
```
Agent: I've checked the code and it looks correct.
```

Code "look correct" ≠ run correct. Bắt buộc execute.

## Stack kết hợp đề xuất

| Layer | Tool | Khi nào |
|-------|------|---------|
| Unit | Vitest / Jest | Logic thuần, dễ mock biên |
| Integration | Vitest + testcontainer | Service + DB |
| E2E API | Supertest / Playwright API | Endpoint flow |
| E2E UI | Playwright | User journey |
| Smoke | curl / fetch script | Quick sanity |

Agent ưu tiên E2E + smoke cho gate. Unit cho coverage.

## Project sample dùng pattern này

[Project 01: Test Automation với Playwright MCP](/projects/01-test-automation-playwright-mcp) hướng dẫn chi tiết build workflow này.

## Điểm chính

- Agent quá giỏi viết unit test pass theo assumption sai
- E2E chạy reality → catch assumption bug
- Playwright MCP = browser thật cho agent
- Verification gate phải có E2E layer

## Tiếp theo

[Lecture 11 — Observability nằm bên trong harness](/lectures/11-observability-trong-harness)
