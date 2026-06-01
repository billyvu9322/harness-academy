---
title: "Lecture 13 — Orchestrator & Sub-agent"
description: "Pattern điều phối nhiều agent. Khi nào tách, cách giao việc, cách bảo vệ context window."
order: 13
duration: "10 phút đọc"
tags: [orchestrator, sub-agent, multi-agent]
---

## Vấn đề: 1 agent làm hết = giới hạn

1 agent đảm nhận:
- Đọc 50 file để tìm bug
- Refactor 10 module
- Viết test
- Chạy verify
- Tổng hợp report

→ Context đầy nhanh. Compact mất chi tiết. Hallucinate. Tốn token.

## Giải pháp: Orchestrator + Sub-agent

> **Orchestrator** = agent "chỉ huy". Giữ mục tiêu, phân việc, tổng hợp, quyết định bước tiếp. Chỉ tự code khi task quá nhỏ để delegate.
> **Sub-agent** = agent con. Làm 1 task hẹp, trả về **summary**, không trả raw output.

<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#0f172a;border-radius:12px;padding:8px">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#fb923c"/>
    </marker>
  </defs>
  <rect x="220" y="20" width="160" height="60" rx="10" fill="#ed7220" stroke="#fb923c" stroke-width="2"/>
  <text x="300" y="48" text-anchor="middle" fill="white" font-family="Inter" font-weight="700" font-size="16">Orchestrator</text>
  <text x="300" y="68" text-anchor="middle" fill="#fde7d3" font-family="Inter" font-size="11">điều phối, không code</text>

  <rect x="40" y="170" width="130" height="70" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <text x="105" y="198" text-anchor="middle" fill="#fb923c" font-family="Inter" font-weight="600" font-size="13">Researcher</text>
  <text x="105" y="218" text-anchor="middle" fill="#cbd5e1" font-family="Inter" font-size="11">đọc code</text>
  <text x="105" y="232" text-anchor="middle" fill="#94a3b8" font-family="Inter" font-size="10">→ summary</text>

  <rect x="235" y="170" width="130" height="70" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <text x="300" y="198" text-anchor="middle" fill="#fb923c" font-family="Inter" font-weight="600" font-size="13">Implementer</text>
  <text x="300" y="218" text-anchor="middle" fill="#cbd5e1" font-family="Inter" font-size="11">viết code</text>
  <text x="300" y="232" text-anchor="middle" fill="#94a3b8" font-family="Inter" font-size="10">→ diff</text>

  <rect x="430" y="170" width="130" height="70" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <text x="495" y="198" text-anchor="middle" fill="#fb923c" font-family="Inter" font-weight="600" font-size="13">Verifier</text>
  <text x="495" y="218" text-anchor="middle" fill="#cbd5e1" font-family="Inter" font-size="11">chạy test</text>
  <text x="495" y="232" text-anchor="middle" fill="#94a3b8" font-family="Inter" font-size="10">→ pass/fail</text>

  <line x1="280" y1="80" x2="125" y2="170" stroke="#fb923c" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="300" y1="80" x2="300" y2="170" stroke="#fb923c" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="320" y1="80" x2="475" y2="170" stroke="#fb923c" stroke-width="2" marker-end="url(#arr)"/>

  <text x="300" y="130" text-anchor="middle" fill="#fde7d3" font-family="JetBrains Mono" font-size="11">dispatch (parallel)</text>
</svg>

## Vì sao tách?

### 1. Context isolation

Mỗi sub-agent có context window **riêng**. Researcher đọc 50 file — context của orchestrator vẫn sạch.

### 2. Parallel execution

3 sub-agent chạy đồng thời → giảm wall-clock time 3 lần.

### 3. Specialization

Sub-agent dùng prompt + skill riêng. Reviewer khác Implementer khác Tester. Tập trung = chất lượng.

### 4. Context budget cho orchestrator

Orchestrator chỉ giữ summary, không giữ raw. Có thể chạy chuỗi task dài mà không compact.

## Khi nào dùng sub-agent?

Dùng khi:
- Task **độc lập**, không cần share state in-flight
- Output lớn (nhiều file đọc, nhiều dòng diff)
- Cần parallel
- Cần expertise riêng (security, perf, a11y)

KHÔNG dùng khi:
- Task nhỏ < 5 phút work
- Cần tương tác qua lại nhiều lần
- State phải share liên tục → 1 agent + tool call rẻ hơn

Multi-agent không tự động tốt hơn. Dùng khi decomposition, external evaluation, hoặc chuyên môn riêng giải quyết failure mode thật.

## Pattern: Input/Output contract

Sub-agent là blackbox. Quan trọng nhất = **hợp đồng input/output rõ**.

```
Orchestrator → Sub-agent
INPUT:
- Mục tiêu cụ thể (1 câu)
- Context tối thiểu cần biết
- Format output mong muốn
- Hạn token / scope

Sub-agent → Orchestrator
OUTPUT:
- Summary structured (markdown/JSON)
- File path đã sửa (không paste full diff)
- Decision/blocker (nếu có)
- Evidence link (test output, screenshot path)
```

## Anti-pattern

### ❌ Orchestrator ôm hết việc

Nếu orchestrator vừa đọc 50 file, vừa sửa code, vừa verify, bạn mất context isolation. Với task lớn, orchestrator phải delegate phần nặng.

### ❌ Sub-agent trả raw

Sub-agent đọc 50 file → trả tóm tắt 200 từ. KHÔNG paste 50 file vô output. Mất ý nghĩa isolation.

### ❌ Quá nhiều layer

Orchestrator → Manager → Lead → Worker = lằng nhằng. Tối đa **2 tầng**: 1 orchestrator + N worker.

### ❌ Race condition

2 sub-agent cùng sửa 1 file → conflict. Orchestrator phải phân vùng file rõ.

## 3 tool support

| Tool | Cách spawn | Type config |
|------|-----------|-------------|
| Claude Code | `Agent` tool + `subagent_type` | `.claude/agents/*.md` |
| Codex | `exec` sub-task | inline prompt |
| OpenCode | `task` tool / subagent | inline prompt + agent type |

Điểm quan trọng không phải tên tool. Điểm quan trọng là sub-agent có context riêng, scope riêng, và output contract rõ.

## Quy tắc 3-5-1

- **3 sub-agent song song** là sweet spot. Hơn 5 = orchestrator quá tải tổng hợp.
- **5 phút** mỗi sub-agent task. Quá dài → break tiếp.
- **1 mục tiêu** mỗi sub-agent. Đa mục tiêu = sub-agent fail như mono agent.

## Pattern thực hành

[Skill 06 — Build sub-agent template](/skills/06-build-sub-agent) — viết sub-agent đúng cách.

[Project 01 — Bước 11](/projects/01-test-automation-playwright-mcp) — orchestrator + 3 sub-agent áp vô test automation.

## Điểm chính

- Sub-agent = isolation + parallel + specialization
- Orchestrator giữ mục tiêu, phân việc, tổng hợp; tránh ôm hết task lớn
- Input/output contract = chìa khoá
- Max 2 tầng, 3-5 sub-agent song song
- Sub-agent trả summary, không trả raw

## Tiếp theo

Series 13 lecture nền tảng khép tại đây. Bước thực hành: [Projects](/projects) hoặc thiết kế [Skills](/skills) riêng.
