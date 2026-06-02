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

Hiện tại **22 slide** (đã apply adoption set). Đã bỏ chrome theo yêu cầu: kicker "HARNESS ACADEMY", dòng "30 minutes", source-note dưới mỗi slide, slide "Built with Claude Code". §1 đổi tên → "What a Harness Actually is ?".

| # | Slide | Nội dung lõi |
|---|-------|--------------|
| 1 | Title | "AI Agent Harness" (đã trim chrome) |
| 2 | Agenda | 6 trụ cột + demo (bỏ duration column) |
| 3 | **Poll — Why do agents fail?** | A–E, reveal "failures live in the Harness, not the Model" (NEW) |
| 4 | **Harness ≠ Model** | Model (brain) vs Harness (OS); Agent = Model + Harness (NEW) |
| 5 | §1 divider | What a Harness Actually is ? |
| 6 | §1 content | 5-subsystem · behavior gap · control/execution plane · repo as SoR |
| 7 | §2 divider | Context Engineering |
| 8 | §2 content | Context = RAM · Agent Memory (working/long-term/knowledge) · 1M-token waste |
| 9 | §3 divider | Orchestration |
| 10 | §3 content | human-team Planner→Dev→Tester · query loop · orchestrator/sub-agent |
| 11 | §4 divider | Constraints, Guardrails & Safe Autonomy |
| 12 | §4 content | **Done vs Really Done** (Done = Evidence) · scope lock · circuit breaker |
| 13 | §5 divider | Specs, Agent Files & Workflow Design |
| 14 | §5 content | without/with AGENTS.md · index · feature list primitive · init phase |
| 15 | §6 divider | Evals & Observability |
| 16 | §6 content | **Software Test → Agent Test** (Evals = Unit Tests for Agents) · provenance citations |
| 17 | DEMO divider | chuyển sang demo |
| 18 | Demo 1 | Sơ đồ kiến trúc harness Assistant (+ notes failure-first) |
| 19 | Demo 2 | Sơ đồ cấu trúc → Template Automation Test (+ notes before/after) |
| 20 | Tooling | 6 free repo tiết kiệm token + orchestrate (superpowers / everything-claude-code) |
| 21 | Takeaways | 5 câu mang về |
| 22 | Thanks / Q&A | "intern with root access" + tài liệu |

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

## Tooling (slide 19 — save tokens & orchestrate)

Free Claude Code repos. **Cắt token:** `vercel-labs/agent-browser` (Chrome qua accessibility tree, ~82% ít token) · `rtk-ai/rtk` (nén output lệnh dev, ~20–30%) · `juliusbrussee/caveman` (skill output ngắn) · `tirth8205/code-review-graph` (AST map, tới 49× ít token). **Đo usage:** `Gronsten/claude-usage-monitor` (token realtime 5h window) · `phuryn/claude-usage` (lịch sử session/day/week). **Orchestrate:** `superpowers` · `everything-claude-code` (bundle skills/subagents/hooks). Handle 2 repo orchestrator chưa verify owner.

## Open Issues (đã cắt khỏi deck — giữ ở đây để xem lại / backlog)

Sáu khoảng trống thật trong repo. Không còn là slide, nhưng giữ nguyên để cân nhắc đưa lại hoặc dùng làm chủ đề thảo luận / backlog harness sau.

1. **Failure attribution** — decision tree gán lỗi theo tầng (context / tool / env / state / feedback). Repo nói "ablation" nhưng chưa có checklist cụ thể.
2. **Context self-tuning** — chưa có cơ chế agent tự đo "context sắp đầy / load chưa tối ưu" và auto-compact theo risk lane.
3. **Sub-agent regenerate** — khi nào sub-agent tự regenerate output ungrounded vs trả summary lỗi cho orchestrator? Ảnh hưởng token + quality.
4. **Multi-agent re-approval** — protocol escalation khi high-risk scenario cần đổi schema giữa planner → generator → evaluator.
5. **Context hand-off** — spec do planner viết: nên đi vào context của generator hay lưu riêng?
6. **Trace → auto-fix loop** — trace lỗi lặp → tự phát hiện pattern → đề xuất sửa docs/schema/test (hiện vẫn thủ công, con người đọc trace).

> Liên quan / mở rộng: `docs/Viblo-Harness-Engineering.md` §7 (gap so với cross-vendor: eval single-step/multi-turn, computational-before-inferential, "success is silent").

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
