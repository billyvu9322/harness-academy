# Seminar Plan — AI Agent Harness

**Title:** AI Agent Harness: Architecture, Operations & Building Agents with Claude Code
**Thời lượng:** 30 phút · 6 chủ đề lý thuyết + 2 live demo
**Khán giả:** kỹ sư (VN). Hook/định nghĩa tiếng Việt, technical terms giữ tiếng Anh.
**Style:** mirror Harness Academy — brand orange `#ED7220`, slate text, Inter + JetBrains Mono, light content slides + dark slate dividers/code panels.

## Artifact

| File | Là gì |
|------|-------|
| [AI-Agent-Harness-Seminar.pptx](AI-Agent-Harness-Seminar.pptx) | Deck 21 slide, **speaker notes đầy đủ trên từng slide** (timing + talking points + runbook demo). Mở bằng PowerPoint/Office365. |
| [build_deck.py](build_deck.py) | Generator. Sửa nội dung ở đây rồi `python build_deck.py` để render lại. |

Mọi nội dung **grounded** từ repo (harvest 8 sub-agent đọc `AI-Agent-Harness.md`, `academy/content/`, `assistant/`, `templates/…-test`). Mỗi slide có footnote `Source:` để truy nguyên.

## Cách build lại

```powershell
python -m pip install python-pptx      # nếu chưa có
python d:\Document\harness-academy\seminar\build_deck.py
```

---

## Bản đồ slide & timing (30')

| # | Slide | Thời lượng | Nội dung lõi |
|---|-------|-----------|--------------|
| 1 | Title | 0:00–0:30 | Hook: "model giỏi fail repo này → vấn đề là harness" |
| 2 | Agenda | 0:30–1:00 | 6 trụ cột + demo, nhịp ~3'/chủ đề |
| 3 | Built with Claude Code | 1:00–2:00 | 3 artifact: academy · assistant · template — đều là harness |
| 4 | §1 divider | — | What Is Harness Engineering? |
| 5 | §1 content | 2:00–5:00 | 5-subsystem · behavior gap · control/execution plane · repo as SoR |
| 6 | §2 divider | — | Context Engineering |
| 7 | §2 content | 5:00–8:00 | progressive disclosure · risk lane (2K/5K/10K) · compaction-aware · 1M-token waste |
| 8 | §3 divider | — | Orchestration |
| 9 | §3 content | 8:00–11:00 | query loop 5 phần · orchestrator/sub-agent · HarnessOrchestrator |
| 10 | §4 divider | — | Constraints, Guardrails & Safe Autonomy |
| 11 | §4 content | 11:00–14:00 | scope lock · finish gate · circuit breaker · error là main path |
| 12 | §5 divider | — | Specs, Agent Files & Workflow Design |
| 13 | §5 content | 14:00–17:00 | AGENTS.md index · feature list primitive · init phase · skill trigger |
| 14 | §6 divider | — | Evals & Observability |
| 15 | §6 content | 17:00–20:00 | golden questions · LLM-judge · provenance citations · trace summary |
| 16 | DEMO divider | 20:00 | chuyển sang demo |
| 17 | Demo 1 | 20:00–24:30 | **Sơ đồ kiến trúc harness Assistant** (conceptual, không technical) |
| 18 | Demo 2 | 24:30–28:30 | **Sơ đồ cấu trúc** harness components → Template Automation Test |
| 19 | Open Issues | 28:30–29:15 | 6 khoảng trống để thảo luận |
| 20 | Takeaways | 29:15–29:45 | 5 câu mang về |
| 21 | Thanks / Q&A | 29:45–30:00+ | tài liệu + Q&A |

---

## Demo slides — sơ đồ (không technical)

Hai slide demo là **diagram giải thích**, không phải runbook command. Mục tiêu: cho khán giả thấy kiến trúc/cấu trúc harness, không lạc vào code.

### Slide 17 — Sơ đồ kiến trúc harness Assistant

Pipeline 5 tầng (trái→phải), đọc như luồng 1 câu hỏi:

```
CÂU HỎI → GUARDRAIL VÀO → ORCHESTRATOR → TRA CỨU TÀI LIỆU → TRẢ LỜI + CITATION
(academy/   (chặn off-      (giữ mục       (chỉ trong         (guardrail ra
 widget)     corpus,         tiêu, điều     corpus: tìm →       ép dẫn nguồn)
             injection)      phối)          đọc đúng mục)
```

Băng xuyên suốt (dưới): **State** (Postgres — hội thoại + feedback, resume qua session) · **Observability** (trace mỗi lượt — tài liệu đã đọc, các bước, độ trễ).

**Cách nói:** đây chính là 5 trụ cột vừa trình bày (guardrail · orchestration · context/corpus · state · observability) ghép thành 1 hệ. Có thể chạy live 1 câu hỏi để minh hoạ câu trả lời + citation truy về academy — nhưng trọng tâm là sơ đồ, không phải code.

### Slide 18 — Sơ đồ cấu trúc: harness → Template Automation Test

5 phase (hàng trên) ↔ thành phần harness điều khiển (hộp tối dưới):

| Phase | Thành phần harness | File / cơ chế |
|-------|--------------------|---------------|
| 1 · Intake | **State** | `.harness/records.jsonl` (type · summary · lane · status) |
| 2 · Context | **Instruction** | `CONTEXT_RULES.md` (route tài liệu theo lane) |
| 3 · Generate | **Tool policy** | subagent `test-generator` (no shell · stop = scenario approved) |
| 4 · Review | **Guardrail** | `REVIEW_CHECKLIST.md` (no sleep · no weak assertion · no skip) |
| 5 · Run & Trace | **Feedback** | Playwright trace + records (outcome: completed/failed/blocked) |

**Cách nói:** cùng 5 trụ cột của Assistant, nhưng đóng gói thành FILE trong repo = "repo as system of record". Có thể mở nhanh `records.jsonl` + `REVIEW_CHECKLIST.md` cho thấy file thật.

---

## Open issues (slide 19 — để thảo luận / backlog)

1. **Failure attribution** — decision tree gán lỗi theo tầng (context/tool/env/state/feedback).
2. **Context self-tuning** — agent tự đo "context sắp đầy / load chưa tối ưu" + auto-compact theo lane.
3. **Sub-agent regenerate** — khi nào sub-agent tự regenerate vs trả summary lỗi cho orchestrator.
4. **Multi-agent re-approval** — escalation khi high-risk scenario đổi schema giữa planner→generator→evaluator.
5. **Context hand-off** — spec do planner viết: vào context generator hay lưu riêng?
6. **Trace → auto-fix loop** — trace lỗi lặp → tự đề xuất sửa docs/schema/test (hiện thủ công).

## Gợi ý làm deck "hoàn thiện hơn" (tuỳ chọn, ngoài scope hiện tại)

- **Diagram thật** thay code panel ở slide §1 (5-subsystem stack) và §3 (orchestrator/sub-agent flow) — hiện là ASCII trong code box; vẽ bằng SmartArt/Figma sẽ rõ hơn.
- **Screenshot demo** chèn vào slide 17/18 làm fallback tĩnh (phòng khi live hỏng).
- **Slide "Without vs With harness"** (ví dụ GET /users/:id) — đang nằm trong speaker notes §1; có thể tách thành 1 slide so sánh 2 cột nếu còn thời gian.

---

## Phương án thay thế: tạo deck bằng AI slide tool

Nếu muốn generate qua Gamma / Copilot / Stitch thay vì python-pptx, prompt mồi:

```
Tạo bộ slide 16:9 (~21 slide), 30 phút, chủ đề "AI Agent Harness: Architecture,
Operations & Building Agents with Claude Code". Theme: brand orange #ED7220,
chữ slate #0F172A, font Inter + code JetBrains Mono; content slide nền trắng,
section divider nền slate đậm #020617 với số chương cam lớn.

Cấu trúc + nội dung từng slide: <dán bảng "Bản đồ slide & timing" ở trên>
Mỗi content slide: 1 hook cam + 4–5 bullet ngắn + 1 code/example panel nền tối +
footnote nguồn. Speaker notes = talking points + timing. Giữ technical terms
tiếng Anh, hook/bullet tiếng Việt.
```

> Khuyến nghị: dùng `.pptx` đã generate (đúng theme + có notes + grounded) làm bản chính; AI tool chỉ dùng nếu cần restyle nhanh.
