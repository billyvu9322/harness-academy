# -*- coding: utf-8 -*-
"""
Build the seminar deck:
  "AI Agent Harness: Architecture, Operations & Building Agents with Claude Code"

30-minute talk. Theme mirrors the Harness Academy site:
  brand orange #ED7220, slate text, Inter + JetBrains Mono,
  light content slides, dark slate section dividers + code panels.

Content is grounded in the repo (AI-Agent-Harness.md, academy lectures/skills,
assistant/, templates/automation-test-harness-experimental/). Source files are
cited in slide footnotes; talking points + timing live in the speaker notes.

Run:  python build_deck.py
Out:  AI-Agent-Harness-Seminar.pptx  (next to this script)
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ---------------------------------------------------------------- palette
ORANGE      = RGBColor(0xED, 0x72, 0x20)  # brand-500
ORANGE_DARK = RGBColor(0xDE, 0x59, 0x16)  # brand-600
ORANGE_DEEP = RGBColor(0xB8, 0x43, 0x14)  # brand-700
DARKEST     = RGBColor(0x76, 0x2E, 0x16)  # brand-900
ORANGE_50   = RGBColor(0xFE, 0xF7, 0xEE)  # brand-50
SLATE950    = RGBColor(0x02, 0x06, 0x17)
SLATE900    = RGBColor(0x0F, 0x17, 0x2A)
SLATE800    = RGBColor(0x1E, 0x29, 0x3B)
SLATE600    = RGBColor(0x47, 0x55, 0x69)
SLATE500    = RGBColor(0x64, 0x74, 0x8B)
SLATE200    = RGBColor(0xE2, 0xE8, 0xF0)
SLATE100    = RGBColor(0xF1, 0xF5, 0xF9)
SLATE50     = RGBColor(0xF8, 0xFA, 0xFC)
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)

SANS = "Inter"
MONO = "JetBrains Mono"

EMU_W = Inches(13.333)
EMU_H = Inches(7.5)

prs = Presentation()
prs.slide_width = EMU_W
prs.slide_height = EMU_H
BLANK = prs.slide_layouts[6]

# ---------------------------------------------------------------- helpers
def slide():
    return prs.slides.add_slide(BLANK)

def bg(s, color):
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = color

def rect(s, x, y, w, h, color, line=None):
    shp = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(1)
    shp.shadow.inherit = False
    return shp

def txt(s, x, y, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
        space_after=6, line_spacing=1.05):
    """runs: list of paragraphs; each paragraph = list of (text, size, color, bold, font)."""
    tb = s.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after)
        p.space_before = Pt(0)
        p.line_spacing = line_spacing
        for (t, size, color, bold, font) in para:
            r = p.add_run()
            r.text = t
            r.font.size = Pt(size)
            r.font.color.rgb = color
            r.font.bold = bold
            r.font.name = font
    return tb

def bullets(s, x, y, w, h, items, size=17, color=SLATE800, gap=9, bullet="—  "):
    tb = s.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        p.line_spacing = 1.06
        r = p.add_run(); r.text = bullet
        r.font.size = Pt(size); r.font.color.rgb = ORANGE_DARK; r.font.bold = True; r.font.name = SANS
        r2 = p.add_run(); r2.text = it
        r2.font.size = Pt(size); r2.font.color.rgb = color; r2.font.name = SANS
    return tb

def notes(s, text):
    s.notes_slide.notes_text_frame.text = text

def codebox(s, x, y, w, h, title, lines):
    rect(s, x, y, w, h, SLATE900)
    rect(s, x, y, Inches(0.07), h, ORANGE)          # left accent
    tb = s.shapes.add_textbox(x + Inches(0.22), y + Inches(0.14), w - Inches(0.4), h - Inches(0.28))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.space_after = Pt(6)
    r = p.add_run(); r.text = title
    r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = ORANGE; r.font.name = MONO
    for ln in lines:
        p = tf.add_paragraph(); p.space_after = Pt(3); p.line_spacing = 1.04
        r = p.add_run(); r.text = ln
        r.font.size = Pt(12); r.font.color.rgb = SLATE100; r.font.name = MONO
    return tb

def source_note(s, text):
    txt(s, Inches(0.7), Inches(7.02), Inches(12), Inches(0.4),
        [[("Source: ", 10, ORANGE_DARK, True, MONO), (text, 10, SLATE500, False, MONO)]])

def kicker(s, text):
    """small orange uppercase label top-left of content slides."""
    txt(s, Inches(0.7), Inches(0.42), Inches(10), Inches(0.4),
        [[(text, 12, ORANGE_DARK, True, SANS)]])

def content_header(s, title, hook):
    rect(s, 0, 0, Inches(0.18), EMU_H, ORANGE)      # left brand bar
    txt(s, Inches(0.7), Inches(0.78), Inches(12), Inches(1.0),
        [[(title, 30, SLATE900, True, SANS)]])
    if hook:
        txt(s, Inches(0.7), Inches(1.62), Inches(12), Inches(0.8),
            [[(hook, 15.5, ORANGE_DEEP, False, SANS)]], line_spacing=1.08)

def fbox(s, x, y, w, h, tag, title, body, accent, fill=SLATE50, tcol=SLATE900, bcol=SLATE600):
    rect(s, x, y, w, h, fill)
    rect(s, x, y, w, Inches(0.1), accent)
    tb = s.shapes.add_textbox(x + Inches(0.16), y + Inches(0.22), w - Inches(0.3), h - Inches(0.34))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.space_after = Pt(4); p.line_spacing = 1.0
    r = p.add_run(); r.text = tag; r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = accent; r.font.name = SANS
    p = tf.add_paragraph(); p.space_after = Pt(4); p.line_spacing = 1.02
    r = p.add_run(); r.text = title; r.font.size = Pt(14.5); r.font.bold = True; r.font.color.rgb = tcol; r.font.name = SANS
    if body:
        p = tf.add_paragraph(); p.space_after = Pt(0); p.line_spacing = 1.04
        r = p.add_run(); r.text = body; r.font.size = Pt(11.5); r.font.color.rgb = bcol; r.font.name = SANS
    return tb

def darkcallout(s, x, y, w, h, tag, fileline, body, accent):
    rect(s, x, y, w, h, SLATE900)
    rect(s, x, y, Inches(0.07), h, accent)
    tb = s.shapes.add_textbox(x + Inches(0.2), y + Inches(0.16), w - Inches(0.34), h - Inches(0.3))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.space_after = Pt(5); p.line_spacing = 1.0
    r = p.add_run(); r.text = tag; r.font.size = Pt(10); r.font.bold = True; r.font.color.rgb = accent; r.font.name = MONO
    p = tf.add_paragraph(); p.space_after = Pt(4); p.line_spacing = 1.02
    r = p.add_run(); r.text = fileline; r.font.size = Pt(13); r.font.bold = True; r.font.color.rgb = SLATE100; r.font.name = MONO
    p = tf.add_paragraph(); p.space_after = Pt(0); p.line_spacing = 1.05
    r = p.add_run(); r.text = body; r.font.size = Pt(11); r.font.color.rgb = SLATE200; r.font.name = SANS
    return tb

def harrow(s, x, ycenter, w=Inches(0.34), h=Inches(0.42), color=ORANGE):
    shp = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x, ycenter - h // 2, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = color; shp.line.fill.background()
    shp.shadow.inherit = False
    return shp

# ---------------------------------------------------------------- 1. title
s = slide(); bg(s, SLATE950)
rect(s, 0, Inches(6.9), EMU_W, Inches(0.6), ORANGE)
rect(s, Inches(0.9), Inches(1.5), Inches(0.9), Inches(0.9), ORANGE)
txt(s, Inches(0.92), Inches(1.62), Inches(0.86), Inches(0.7),
    [[("H", 34, WHITE, True, MONO)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
txt(s, Inches(2.0), Inches(1.55), Inches(10.5), Inches(0.7),
    [[("HARNESS ACADEMY  ·  SEMINAR", 14, ORANGE, True, SANS)]], anchor=MSO_ANCHOR.MIDDLE)
txt(s, Inches(0.9), Inches(2.7), Inches(11.6), Inches(2.2),
    [[("AI Agent Harness", 52, WHITE, True, SANS)],
     [("Architecture, Operations & Building Agents with Claude Code", 26, SLATE200, False, SANS)]],
    line_spacing=1.05, space_after=10)
txt(s, Inches(0.9), Inches(5.5), Inches(11.6), Inches(1.0),
    [[("30 phút  ·  6 chủ đề lý thuyết  +  2 live demo", 16, ORANGE, True, MONO)],
     [("Assistant Harness Academy   ·   Harness Template: Automation Test", 14, SLATE500, False, MONO)]],
    space_after=6)
notes(s, "MỞ ĐẦU (0:00–0:30). Một câu hook: 'Model giỏi mà fail trong repo này, thành công repo khác — "
          "vấn đề không phải model, vấn đề là HARNESS.' Giới thiệu: hôm nay đi qua 6 trụ cột của harness "
          "engineering rồi demo 2 harness thật được build bằng Claude Code.")

# ---------------------------------------------------------------- 2. agenda
s = slide(); bg(s, WHITE)
content_header(s, "Agenda — 30 phút", "Sáu trụ cột của harness, rồi thấy chúng chạy thật trong hai demo.")
rows = [
    ("1", "What Is Harness Engineering?", "~3'"),
    ("2", "Context Engineering: The Working Memory Budget", "~3'"),
    ("3", "Orchestration", "~3'"),
    ("4", "Constraints, Guardrails & Safe Autonomy", "~3'"),
    ("5", "Specs, Agent Files & Workflow Design", "~3'"),
    ("6", "Evals & Observability", "~3'"),
    ("D", "Demo: Assistant Harness Academy  +  Harness Template (Automation Test)", "~8'"),
]
y = 2.6
for num, label, dur in rows:
    rect(s, Inches(0.7), Inches(y), Inches(0.55), Inches(0.55), ORANGE if num != "D" else SLATE900)
    txt(s, Inches(0.7), Inches(y), Inches(0.55), Inches(0.55),
        [[(num, 18, WHITE, True, MONO)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    txt(s, Inches(1.45), Inches(y), Inches(9.6), Inches(0.55),
        [[(label, 17, SLATE800, num == "D", SANS)]], anchor=MSO_ANCHOR.MIDDLE)
    txt(s, Inches(11.1), Inches(y), Inches(1.5), Inches(0.55),
        [[(dur, 14, SLATE500, True, MONO)]], align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
    y += 0.62
notes(s, "AGENDA (0:30–1:00). Theo nhịp ~3 phút mỗi chủ đề lý thuyết = 18', demo 8', mở/đóng 4'. "
          "Nhấn: lý thuyết xong sẽ thấy ngay trong demo — không phải slideware.")

# ---------------------------------------------------------------- 3. throughline
s = slide(); bg(s, WHITE)
content_header(s, "Built with Claude Code", "Ba artifact thật trong repo này — đều là harness, đều build bằng Claude Code.")
cards = [
    ("academy/", "Tài liệu Harness Academy", "Vite + React. 16 lectures + skills. Nguồn corpus cho Assistant.", ORANGE),
    ("assistant/", "Assistant Harness", "Single-orchestrator agent: grounded Q&A, citations, SSE, eval. Embed widget vào academy.", ORANGE_DARK),
    ("templates/…-test", "Harness Template: Automation Test", "Playwright harness: intake → approve → generate → trace. Kỷ luật test bằng AI.", ORANGE_DEEP),
]
x = 0.7
for tag, title, body, col in cards:
    rect(s, Inches(x), Inches(2.7), Inches(3.85), Inches(3.4), SLATE50)
    rect(s, Inches(x), Inches(2.7), Inches(3.85), Inches(0.12), col)
    txt(s, Inches(x + 0.25), Inches(2.95), Inches(3.4), Inches(0.5),
        [[(tag, 15, col, True, MONO)]])
    txt(s, Inches(x + 0.25), Inches(3.5), Inches(3.4), Inches(0.9),
        [[(title, 18, SLATE900, True, SANS)]], line_spacing=1.05)
    txt(s, Inches(x + 0.25), Inches(4.5), Inches(3.4), Inches(1.5),
        [[(body, 13.5, SLATE600, False, SANS)]], line_spacing=1.1)
    x += 4.07
source_note(s, "academy/  ·  assistant/AGENTS.md  ·  templates/automation-test-harness-experimental/")
notes(s, "THROUGHLINE (1:00–2:00). Mọi thứ hôm nay không phải lý thuyết suông — ba artifact này nằm trong "
          "cùng một repo và đều được build bằng Claude Code. Hai cái sau là demo cuối buổi. "
          "Claude Code BẢN THÂN nó là một harness: đọc CLAUDE.md/AGENTS.md, có tool file/shell/test, "
          "skills, subagents, hooks, MCP — chạy trong repo thật nên artifact thành system of record.")

# ---------------------------------------------------------------- section divider helper
def divider(num, title, sub):
    s = slide(); bg(s, SLATE950)
    rect(s, Inches(0.9), Inches(2.55), Inches(2.4), Inches(0.14), ORANGE)
    txt(s, Inches(0.9), Inches(2.85), Inches(2.5), Inches(2.0),
        [[(num, 120, ORANGE, True, MONO)]])
    txt(s, Inches(3.4), Inches(3.0), Inches(9.0), Inches(2.2),
        [[(title, 40, WHITE, True, SANS)],
         [(sub, 18, SLATE500, False, SANS)]], line_spacing=1.05, space_after=12)
    return s

# ================================================================ SECTION 1
s = divider("01", "What Is Harness\nEngineering?", "Model cung cấp reasoning. Harness cung cấp kỷ luật.")
notes(s, "Chuyển mục. Câu chốt: model là động cơ; harness là khung gầm + vô-lăng + phanh + đồng hồ.")

s = slide(); bg(s, WHITE)
content_header(s, "What Is Harness Engineering?",
    "Nếu model giỏi fail repo này nhưng thành công repo khác — vấn đề là harness, không phải model.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "Kỷ luật thiết kế / test / cải thiện hệ thống điều khiển quanh LLM.",
    "5 subsystem: instruction · tool · environment · state · feedback.",
    "Lỗi agent = behavior gap, không phải reasoning: mất context, overreach, claim done sớm, dirty state, no observability.",
    "Control plane (intent, approval, trace, recovery) vs execution plane (file/shell risky work).",
    "Repo là system of record: decision/plan/state/trace commit vào file, không sống trong chat.",
], size=16.5)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "5-SUBSYSTEM HARNESS MODEL", [
    "instruction →  AGENTS.md + docs/",
    "tool        →  Read/Edit/Bash + MCP",
    "environment →  runtime pin + lockfile",
    "state       →  repo artifact + PROGRESS.md",
    "feedback    →  test + lint + e2e + logs",
    "",
    "quality = task done",
    "        + trajectory quality",
])
source_note(s, "AI-Agent-Harness.md §2,§4,§8  ·  academy/content/lectures/02-harness-la-gi.md")
notes(s, "SECTION 1 (2:00–5:00). ĐỊNH NGHĨA: harness engineering = kỷ luật thiết kế/kiểm thử/cải thiện hệ "
          "thống điều khiển quanh LLM. Năm subsystem là khung phân tích: khi agent fail, hỏi tầng nào hỏng — "
          "thiếu context? thiếu tool? environment lệch? mất state? thiếu feedback?  "
          "VÍ DỤ: 'Add GET /users/:id'. Không harness: model viết → claim done → bạn chạy test → fail → lặp. "
          "Có harness: skill load schema+routes → plan (route→handler→test→migration) → hook PostToolUse chạy "
          "test ngay → verification skill check pass → hook SessionEnd dọn tmp + gợi ý commit. "
          "Kết quả: code chạy + bằng chứng + git sạch. "
          "Chốt: Claude Code đã là harness sẵn — phần còn lại của buổi là cách vận hành nó có kỷ luật.")

# ================================================================ SECTION 2
s = divider("02", "Context Engineering", "The Working Memory Budget — context window là tài nguyên hữu hạn.")
notes(s, "Chuyển mục. Ẩn dụ: context window = bàn làm việc nhỏ. Bày hết hồ sơ lên bàn = không còn chỗ tư duy.")

s = slide(); bg(s, WHITE)
content_header(s, "Context Engineering: Working Memory Budget",
    "Quản lý ngân sách context để agent không mất quyết định khi compaction.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "Progressive disclosure: load context theo phase + risk lane, không maximize.",
    "Risk lane: Tiny ~2K · Normal ~5K · High-risk ~10K token harness context.",
    "Repo là system of record: plan file + commit + PR description = state qua nhiều session.",
    "Compaction-aware: chat history KHÔNG survive reset → mọi decision phải lưu ngoài context window.",
    "Skills load theo description match — chỉ activate khi relevant, không phí token.",
], size=16.5)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "MONO vs PROGRESSIVE", [
    "# monolithic CLAUDE.md",
    "5000 dòng ≈ 20K tok / message",
    "× 50 message ≈ 1,000,000 tok",
    "          (chỉ riêng instruction!)",
    "",
    "# progressive disclosure",
    "index   < 100 dòng  (~100 tok)",
    "skill   < 200 dòng  (load khi cần)",
    "plan    < 300 dòng  (on-demand)",
    "→ ~90% waste cắt bỏ",
])
source_note(s, "AI-Agent-Harness.md L672  ·  lectures/03,04,05,12  ·  skills/01-skill-anatomy.md")
notes(s, "SECTION 2 (5:00–8:00). Ba chiến lược: (1) progressive disclosure — 3 lớp: metadata mỗi turn ~50 tok, "
          "full body khi relevant, bundled file on-demand. (2) repo as system of record — plan file + commit + "
          "PR description sống sót qua reset; todo list chỉ giúp session hiện tại. (3) compaction-aware — harness "
          "tự nén history khi gần đầy, nên ghi state ra repo ở mỗi checkpoint; reset xong agent đọc plan file là "
          "bắt nhịp lại. CON SỐ ĐẮT GIÁ: CLAUDE.md 5000 dòng tốn ~1M token chỉ cho instruction qua 50 lượt chat. "
          "OPEN ISSUE để thảo luận: chưa có cơ chế chuẩn để agent tự đo 'context sắp đầy / load không tối ưu' và tự tune.")

# ================================================================ SECTION 3
s = divider("03", "Orchestration", "Một agent ôm hết = context đầy, hallucinate. Tách orchestrator & sub-agent.")
notes(s, "Chuyển mục. Ẩn dụ: orchestrator = nhạc trưởng giữ tổng phổ; sub-agent = nhạc công trả về 'đoạn đã chơi', không trả cả bản nhạc thô.")

s = slide(); bg(s, WHITE)
content_header(s, "Orchestration",
    "Control plane điều phối query loop; execution plane chỉ chạy tool được phép.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "Query loop 5 phần: nhận input → đọc stream → điều phối tool (xin phép, song song/tuần tự) → khôi phục lỗi → điều kiện dừng.",
    "Orchestrator giữ {task, summaries, next}; sub-agent trả SUMMARY, không trả raw output.",
    "Lợi: context isolation · parallel execution · specialization. Giới hạn: ≤3–5 agent, ≤5'/task, 1 mục tiêu/agent, ≤2 tầng.",
    "Input guardrail bắt lỗi sớm; output guardrail yêu cầu grounding hoặc regenerate.",
    "Tool policy: read/grep rộng; write/delete/deploy cần xin phép; log call → context.reads.",
], size=15.5)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "assistant: HarnessOrchestrator", [
    "Agent SDK loop",
    "  ├─ checkInput()  guardrail",
    "  ├─ tools:",
    "  │    list_docs",
    "  │    grep_docs   (VN+EN expand)",
    "  │    read_doc_section → reads[]",
    "  │    harness_blueprint (gated)",
    "  ├─ mapStreamEvent → SSE",
    "  └─ buildCitations(context.reads)",
])
source_note(s, "lectures/13,14  ·  assistant/apps/api/src/agent/harnessAssistant.ts  ·  AI-Agent-Harness.md §5.2,§6.4")
notes(s, "SECTION 3 (8:00–11:00). Orchestration là lớp control plane quản query loop: quyết input nào hợp lệ, "
          "tool nào chạy song song vs tuần tự, khi nào xin phép, khôi phục lỗi ra sao. PATTERN orchestrator/sub-agent: "
          "orchestrator dispatch Researcher (đọc 50 file → summary 200 từ) + Implementer (code → diff) + Verifier "
          "(test → pass/fail); orchestrator KHÔNG ôm 50 file raw, chỉ giữ summary. Demo Assistant sẽ cho thấy "
          "loop này chạy thật: timeline hiện từng tool call. OPEN ISSUE: khi nào sub-agent nên tự regenerate vs "
          "chỉ trả summary lỗi cho orchestrator xử lý — ảnh hưởng token & quality.")

# ================================================================ SECTION 4
s = divider("04", "Constraints, Guardrails\n& Safe Autonomy", "Agent fail vì thiếu kỷ luật giữ scope, không vì thiếu reasoning.")
notes(s, "Chuyển mục. Guardrail nằm ở control plane (harness), KHÔNG ở model weights. Khác permission: permission = tool nào có; guardrail = hành vi nào bị chặn.")

s = slide(); bg(s, WHITE)
content_header(s, "Constraints, Guardrails & Safe Autonomy",
    "Scope lock · finish gate · circuit breaker · error là main path.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "Scope Lock: feature list khớp yêu cầu; explicit 'do NOT'; diff >20 file cho bugfix = cờ đỏ.",
    "Finish Gate: done = bằng chứng (test output, trace), KHÔNG phải lời hứa. DoD gồm typecheck/lint/test/e2e.",
    "Error là first-class: 5 pattern (context overflow, truncation, tool interrupt, infinite hook, failed compaction).",
    "Circuit breaker: same tool+input >3 lần → block; hook depth >5 → warn; retry limit theo loại lỗi.",
    "Recovery minh bạch: { status, summary, artifacts, next_actions, recovery_hint } — không silent fix.",
], size=15.5)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "FINISH GATE (Definition of Done)", [
    "□ feature list: mọi item ☑",
    "□ npm test        → all green",
    "□ npm run typecheck → pass",
    "□ npm run lint    → pass",
    "□ diff == feature list?",
    "□ evidence dán vào response",
    "──────────────────────────",
    "CHỈ KHI ĐỦ → claim done",
])
source_note(s, "lectures/07,15  ·  assistant/apps/api/src/agent/guardrails.ts  ·  AI-Agent-Harness.md §7.3,§7.4,§9.5")
notes(s, "SECTION 4 (11:00–14:00). Guardrail = pattern chặn overreach / under-finish / silent error. "
          "Đối phó self-evaluation bias bằng external evaluator hoặc verification skill riêng (agent tự chấm thì "
          "thiên vị). Risk lane intake: Tiny (docs) / Normal (story + approval) / High-risk (auth, data model, "
          "migration) — context và bằng chứng scale theo lane. Demo Template sẽ cho thấy 'never weaken assertions / "
          "no arbitrary sleep / no skip without blocker' được codify thành REVIEW_CHECKLIST, không phải lời khuyên. "
          "OPEN ISSUE: protocol escalation khi high-risk scenario cần đổi schema giữa chừng (planner→generator→"
          "evaluator) chưa được document.")

# ================================================================ SECTION 5
s = divider("05", "Specs, Agent Files\n& Workflow Design", "Instruction & context layer — load dần, không load cả bách khoa.")
notes(s, "Chuyển mục. AGENTS.md không phải encyclopedia, nó là mục lục (table of contents) trỏ tới docs/skills.")

s = slide(); bg(s, WHITE)
content_header(s, "Specs, Agent Files & Workflow Design",
    "AGENTS.md là index, feature list là primitive, init phase đi trước action.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "AGENTS.md / CLAUDE.md = index <100 dòng: mục đích, stack version, 3–4 command, Definition of Done.",
    "Feature list là primitive của intent: checkbox atomic, verifiable, concrete — thiếu nó thì không verify được.",
    "Init phase bắt buộc trước action: đọc memory → git state → active plan → confirm scope với user.",
    "Skill triggerability qua description: 'Use when schema change. Keywords: schema, migration, ALTER TABLE'.",
    "Context routing theo phase: intake → planning → implementation → validation.",
], size=15.5)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "PROGRESSIVE DISCLOSURE (3 tier)", [
    "tier 1  (mỗi turn)",
    "  index 100 tok + skill names",
    "tier 2  (khi relevant)",
    "  SKILL.md body 200–1000 tok",
    "tier 3  (on-demand)",
    "  script / reference / full doc",
    "",
    "frontmatter:",
    "  description: Use when …",
    "  keywords: [schema, migration]",
])
source_note(s, "lectures/04,06,08  ·  academy/content/skills/01-skill-anatomy.md  ·  AGENTS.md")
notes(s, "SECTION 5 (14:00–17:00). Đây là tầng instruction của harness. KEY: feature list là primitive — đơn vị "
          "nhỏ nhất của intent mà vẫn verify được; không có nó thì 'done' vô nghĩa. Init phase tách riêng vì nó "
          "deterministic: đọc file/command, làm rõ scope, tiết kiệm token — bỏ init = agent lao vào làm sai "
          "convention. Skill anatomy: frontmatter description chính là trigger signal load vào system prompt mỗi "
          "turn, phải ngắn mà rõ. OPEN ISSUE: context hand-off giữa planner→generator→evaluator — spec do planner "
          "viết nên đi vào context của generator hay lưu riêng?")

# ================================================================ SECTION 6
s = divider("06", "Evals & Observability", "Agent tự tin ≠ bằng chứng. Dữ liệu là bằng chứng: traces, citations, evals.")
notes(s, "Chuyển mục. Câu chốt: bạn không 'tin' agent đúng — bạn ĐO nó đúng. Eval = test suite cho agent; observability = hộp đen chuyến bay.")

s = slide(); bg(s, WHITE)
content_header(s, "Evals & Observability",
    "Xác thực hành vi agent bằng bằng chứng và trace, không bằng dự đoán.")
bullets(s, Inches(0.7), Inches(2.5), Inches(7.0), Inches(4.2), [
    "Evals = golden-question suite: chạy agent trên câu hỏi tiêu chuẩn, LLM-judge chấm 0–5 theo rubric.",
    "Baseline merge gate: pass rate ≥70% & avg score ≥3.5 — không đạt thì không merge.",
    "Citations là provenance: buildCitations() chỉ trả section agent THỰC SỰ read — không fake được.",
    "Output guardrail: bắt buộc ≥1 citation, hoặc nói rõ corpus không cover; fail → regenerate 1 lần.",
    "Trace summary = mini-eval: accessedDocs, toolCalls, citationCount, latency, status, regenerated → chấm trajectory.",
], size=15)
codebox(s, Inches(8.0), Inches(2.5), Inches(4.6), Inches(3.9), "B7 EVAL GATE", [
    "for q in GOLDEN_QUESTIONS:",
    "  ans  = run(agent, q)",
    "  judge = llmJudge(ans, rubric) # 0–5",
    "  ok = judge.pass",
    "     and hasCitation(ans)",
    "     and matchesExpectedDoc(ans)",
    "──────────────────────────",
    "BASELINE = { passRate ≥ 0.70,",
    "             avgScore ≥ 3.5 }",
])
source_note(s, "lectures/10,11  ·  assistant/apps/api/src/evals/{goldenQuestions,score,runEvals}.ts  ·  docs/citations.ts")
notes(s, "SECTION 6 (17:00–20:00). Hai trụ: EVAL (chủ động) + OBSERVABILITY (bị động ghi nhận). Eval B7 chạy 6 câu "
          "golden, kết hợp LLM-judge (rubric 0–5) + deterministic checks (có citation? đúng doc? đủ keyword?). "
          "Citations provenance-based là bất biến cốt lõi: chỉ section được read_doc_section mới được cite — model "
          "không thể bịa nguồn. Mode gating (B8): blueprint tool chỉ gọi được trong harness-design mode → verify "
          "guardrail thực thi. OPEN ISSUE hay để thảo luận: feedback loop tự động trace → phát hiện pattern lỗi lặp "
          "→ tự đề xuất sửa docs/schema/test vẫn chưa có; hiện vẫn là con người đọc trace.")

# ================================================================ DEMO divider
s = slide(); bg(s, SLATE950)
rect(s, Inches(0.9), Inches(2.7), Inches(2.4), Inches(0.14), ORANGE)
txt(s, Inches(0.9), Inches(2.95), Inches(11.5), Inches(2.2),
    [[("LIVE DEMO", 56, WHITE, True, SANS)],
     [("Lý thuyết, giờ chạy thật — hai harness build bằng Claude Code.", 18, SLATE500, False, SANS)]],
    line_spacing=1.05, space_after=12)
notes(s, "CHUYỂN SANG DEMO (20:00). Nhắc khán giả: mọi nguyên tắc vừa nói — grounding, timeline, guardrail, "
          "checklist, JSONL trace — sắp thấy chạy thật. Mở sẵn terminal + browser trước khi bấm slide này.")

# ---------------------------------------------------------------- Demo 1 (flow diagram)
s = slide(); bg(s, WHITE)
content_header(s, "Demo 1 — Assistant: kiến trúc harness",
    "Câu hỏi đi qua các tầng harness để ra câu trả lời có dẫn nguồn.")
# pipeline: 5 stages
stages = [
    ("CÂU HỎI", "Người dùng hỏi", "trong academy / widget", ORANGE),
    ("GUARDRAIL VÀO", "Chặn từ sớm", "off-corpus · injection", ORANGE_DARK),
    ("ORCHESTRATOR", "Giữ mục tiêu", "điều phối từng bước", ORANGE_DEEP),
    ("TRA CỨU TÀI LIỆU", "Chỉ trong corpus", "tìm → đọc đúng mục", ORANGE_DARK),
    ("TRẢ LỜI", "Kèm Citation", "guardrail ra ép dẫn nguồn", ORANGE),
]
bw, bh, gap, x0, y0 = 2.06, 2.0, 0.41, 0.70, 2.65
for i, (tag, title, body, col) in enumerate(stages):
    x = x0 + i * (bw + gap)
    fbox(s, Inches(x), Inches(y0), Inches(bw), Inches(bh), tag, title, body, col)
    if i < len(stages) - 1:
        harrow(s, Inches(x + bw + 0.02), Inches(y0 + bh / 2))
# cross-cutting band
txt(s, Inches(0.7), Inches(5.0), Inches(12), Inches(0.4),
    [[("Xuyên suốt mọi lượt", 12, ORANGE_DARK, True, SANS)]])
rect(s, Inches(0.70), Inches(5.4), Inches(5.85), Inches(1.15), SLATE50)
rect(s, Inches(0.70), Inches(5.4), Inches(0.1), Inches(1.15), SLATE600)
txt(s, Inches(0.95), Inches(5.55), Inches(5.5), Inches(0.95),
    [[("State & lịch sử hội thoại", 14, SLATE900, True, SANS)],
     [("Postgres lưu hội thoại + feedback → resume qua session", 12, SLATE600, False, SANS)]], space_after=3, line_spacing=1.05)
rect(s, Inches(6.79), Inches(5.4), Inches(5.85), Inches(1.15), SLATE50)
rect(s, Inches(6.79), Inches(5.4), Inches(0.1), Inches(1.15), DARKEST)
txt(s, Inches(7.04), Inches(5.55), Inches(5.5), Inches(0.95),
    [[("Observability — trace mỗi lượt", 14, SLATE900, True, SANS)],
     [("ghi: tài liệu đã đọc · các bước · độ trễ · trạng thái", 12, SLATE600, False, SANS)]], space_after=3, line_spacing=1.05)
source_note(s, "assistant/AGENTS.md (Architecture & Request Flow)")
notes(s, "DEMO 1 (20:00–24:30, ~4.5'). KHÔNG đi vào kỹ thuật — dùng sơ đồ để giải thích KIẾN TRÚC harness của "
          "Assistant, rồi cho chạy thật minh hoạ. "
          "Đọc sơ đồ trái→phải: (1) người dùng hỏi (trong academy hoặc widget). (2) GUARDRAIL VÀO chặn câu off-corpus "
          "hoặc injection ngay từ đầu. (3) ORCHESTRATOR giữ mục tiêu, điều phối từng bước — không tự bịa. "
          "(4) TRA CỨU TÀI LIỆU: agent chỉ được tìm + đọc trong corpus nội bộ, không ra internet. "
          "(5) TRẢ LỜI kèm CITATION; guardrail ra bắt buộc phải có dẫn nguồn, nếu không thì làm lại. "
          "BĂNG DƯỚI = xuyên suốt: State (Postgres lưu hội thoại/feedback để resume) + Observability (mỗi lượt ghi "
          "trace: đọc tài liệu nào, mấy bước, độ trễ). "
          "CHỐT: đây chính là 5 trụ cột vừa nói — guardrail, orchestration, context/corpus, state, observability — "
          "ghép lại thành 1 hệ. Chạy live: hỏi 1 câu, chỉ cho khán giả thấy câu trả lời + citation truy về academy.")

# ---------------------------------------------------------------- Demo 2 (structure mapping)
s = slide(); bg(s, WHITE)
content_header(s, "Demo 2 — Harness Template: cấu trúc áp dụng",
    "Mỗi phase do một thành phần harness điều khiển — file control-plane, không phải lời khuyên.")
phases = [
    ("1 · INTAKE", "Phân risk lane", "STATE", ".harness/records.jsonl", "ghi type · summary · lane · status", SLATE600),
    ("2 · CONTEXT", "Load đúng tài liệu", "INSTRUCTION", "CONTEXT_RULES.md", "Normal lane = docs + spec + fixtures", ORANGE),
    ("3 · GENERATE", "Sinh test từ scenario", "TOOL POLICY", "subagent test-generator", "no shell · stop = chỉ từ scenario approved", ORANGE_DARK),
    ("4 · REVIEW", "Phê duyệt trước nhận", "GUARDRAIL", "REVIEW_CHECKLIST.md", "no sleep · no weak assertion · no skip", ORANGE_DEEP),
    ("5 · RUN & TRACE", "Chạy + ghi kết quả", "FEEDBACK", "Playwright trace + records", "outcome: completed / failed / blocked", DARKEST),
]
bw, gap, x0 = 2.06, 0.41, 0.70
py, ph = 2.55, 1.35
cy, ch = 4.15, 2.05
for i, (ptitle, psub, tag, fileline, body, col) in enumerate(phases):
    x = x0 + i * (bw + gap)
    fbox(s, Inches(x), Inches(py), Inches(bw), Inches(ph), ptitle, psub, "", col)
    darkcallout(s, Inches(x), Inches(cy), Inches(bw), Inches(ch), tag, fileline, body, col)
    if i < len(phases) - 1:
        harrow(s, Inches(x + bw + 0.02), Inches(py + ph / 2), w=Inches(0.34), h=Inches(0.38))
source_note(s, "templates/automation-test-harness-experimental/{AGENTS.md, docs/harness/*, scripts/bin/harness-cli.mjs}")
notes(s, "DEMO 2 (24:30–28:30, ~4'). KHÔNG technical — dùng sơ đồ để chỉ CẤU TRÚC: harness áp các thành phần vào "
          "automation test ra sao. Mỗi cột = 1 phase (hàng trên) + thành phần harness điều khiển nó (hộp tối dưới). "
          "(1) INTAKE → STATE: mọi yêu cầu ghi vào records.jsonl, phân risk lane. 'Harness bắt đầu bằng intake, "
          "không phải code.' (2) CONTEXT → INSTRUCTION: CONTEXT_RULES.md route đúng tài liệu theo phase (Normal lane "
          "= product docs + approved spec + fixtures, không phải cả repo). (3) GENERATE → TOOL POLICY: subagent "
          "test-generator bị giới hạn tool, no shell, stop condition = chỉ sinh code từ scenario đã duyệt = safe "
          "autonomy. (4) REVIEW → GUARDRAIL: REVIEW_CHECKLIST.md codify 'no arbitrary sleep / no weakened assertion "
          "/ no skip' thành gate có TÊN để reviewer từ chối. (5) RUN & TRACE → FEEDBACK: chạy Playwright, trace .zip, "
          "ghi outcome; lỗi lặp ⇒ harness issue (sửa CONTEXT_RULES/skill) vs test issue (test-healer). "
          "CHỐT: cùng 5 trụ cột của Assistant, nhưng đóng gói thành FILE trong repo — đó là 'repo as system of record'. "
          "Có thể mở nhanh records.jsonl + REVIEW_CHECKLIST.md cho khán giả thấy file thật.")

# ---------------------------------------------------------------- Open issues
s = slide(); bg(s, WHITE)
content_header(s, "Open Issues — để buổi sau sâu hơn",
    "Sáu khoảng trống thật trong repo, đáng đào tiếp.")
items = [
    ("Failure attribution", "Decision tree gán lỗi theo tầng (context/tool/env/state/feedback) — repo nói ablation nhưng chưa có checklist."),
    ("Context self-tuning", "Chưa có cơ chế agent tự đo 'context sắp đầy / load chưa tối ưu' và auto-compact theo risk lane."),
    ("Sub-agent regenerate", "Khi nào sub-agent tự regenerate output ungrounded vs trả summary lỗi cho orchestrator?"),
    ("Multi-agent re-approval", "Protocol escalation khi high-risk scenario cần đổi schema giữa planner→generator→evaluator."),
    ("Context hand-off", "Spec do planner viết nên vào context của generator hay lưu riêng?"),
    ("Trace → auto-fix loop", "Trace lỗi lặp → tự phát hiện pattern → đề xuất sửa docs/schema/test (hiện vẫn thủ công)."),
]
y = 2.5
for i, (t, b) in enumerate(items):
    col = 0.7 if i < 3 else 6.85
    yy = 2.5 + (i % 3) * 1.45
    rect(s, Inches(col), Inches(yy), Inches(0.1), Inches(1.2), ORANGE)
    txt(s, Inches(col + 0.25), Inches(yy), Inches(5.6), Inches(1.3),
        [[(t, 16, SLATE900, True, SANS)],
         [(b, 12.5, SLATE600, False, SANS)]], line_spacing=1.05, space_after=4)
source_note(s, "Tổng hợp từ openIssue của từng section trong harvest.")
notes(s, "OPEN ISSUES (28:30–29:15). Đây là phần tạo thảo luận — sáu câu hỏi thật chưa có đáp án trong repo. "
          "Mời khán giả chọn 1–2 cái họ quan tâm để đào sâu, hoặc dùng làm backlog cho harness tiếp theo.")

# ---------------------------------------------------------------- Takeaways
s = slide(); bg(s, SLATE950)
rect(s, 0, 0, Inches(0.18), EMU_H, ORANGE)
txt(s, Inches(0.7), Inches(0.7), Inches(12), Inches(1.0),
    [[("Key Takeaways", 34, WHITE, True, SANS)]])
takeaways = [
    "Model = reasoning. Harness = kỷ luật + observable execution. Lỗi thường ở harness, không ở model.",
    "Context là ngân sách: progressive disclosure + repo as system of record + compaction-aware.",
    "Orchestrator giữ summary, sub-agent trả summary — context isolation = scale.",
    "Done = bằng chứng (test/trace), không phải lời hứa. Guardrail sống ở control plane.",
    "Citations provenance-based + golden-question evals = niềm tin có thể ĐO.",
]
bullets(s, Inches(0.7), Inches(1.9), Inches(12), Inches(4.0), takeaways, size=18, color=SLATE200, gap=14)
txt(s, Inches(0.7), Inches(6.5), Inches(12), Inches(0.6),
    [[("Claude Code đã là harness — phần của bạn là vận hành nó có kỷ luật.", 16, ORANGE, True, SANS)]])
notes(s, "TAKEAWAYS (29:15–29:45). Năm câu mang về. Nhấn câu cuối: công cụ đã có, khác biệt nằm ở kỷ luật vận hành.")

# ---------------------------------------------------------------- Thanks
s = slide(); bg(s, SLATE950)
rect(s, 0, Inches(6.9), EMU_W, Inches(0.6), ORANGE)
txt(s, Inches(0.9), Inches(2.6), Inches(11.5), Inches(2.0),
    [[("Cảm ơn — Q&A", 48, WHITE, True, SANS)],
     [("AI Agent Harness: Architecture, Operations & Building Agents with Claude Code", 18, SLATE200, False, SANS)]],
    line_spacing=1.1, space_after=12)
txt(s, Inches(0.9), Inches(5.0), Inches(11.5), Inches(1.5),
    [[("Tài liệu:  AI-Agent-Harness.md  ·  academy/content/  ·  assistant/AGENTS.md", 15, ORANGE, True, MONO)],
     [("Sample harness:  templates/automation-test-harness-experimental/", 15, SLATE500, False, MONO)]],
    space_after=8)
notes(s, "Q&A (29:45–30:00+). Dẫn lại Open Issues nếu khán giả im. Để slide tài liệu mở để mọi người chụp.")

# ---------------------------------------------------------------- save
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AI-Agent-Harness-Seminar.pptx")
prs.save(out)
print("Saved:", out, "| slides:", len(prs.slides._sldIdLst))
