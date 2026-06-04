import { Agent, run } from "@openai/agents";
import { initLlm } from "./llm";
import type { HistoryTurn } from "./history";

/** Cheap classifier-tier model — same one used by the relevance guardrail. */
const COMPACT_MODEL = "cx/gpt-5.4";

/** Run compaction only when the cumulative history exceeds this many characters. */
const COMPACT_THRESHOLD_CHARS = 12000;

/** How many of the most-recent turns to keep verbatim. Older turns get summarized. */
const KEEP_RECENT_TURNS = 6;

const INSTRUCTIONS = [
  "Bạn là History Compactor cho assistant harness-engineering.",
  "Tóm tắt các lượt hội thoại dưới đây thành 1 đoạn văn ngắn (≤500 từ) bằng tiếng Việt.",
  "Giữ lại:",
  "- Các câu hỏi chính của user theo trình tự xuất hiện.",
  "- Kết luận / dữ kiện chốt mà assistant đã đưa ra.",
  "- Tên skill, doc, khái niệm đã được tham chiếu (nếu có).",
  "Bỏ: ví dụ code dài, citation chi tiết, markdown formatting.",
  "Trả về thuần text, KHÔNG thêm tiêu đề/lời mở đầu.",
].join("\n");

let compactAgent: Agent | null = null;
function getCompactAgent(): Agent {
  if (!compactAgent) {
    compactAgent = new Agent({
      name: "History Compactor",
      model: COMPACT_MODEL,
      instructions: INSTRUCTIONS,
    });
  }
  return compactAgent;
}

function totalChars(history: HistoryTurn[]): number {
  let n = 0;
  for (const t of history) n += t.content.length;
  return n;
}

/** Fallback when the LLM call fails — mechanical truncation so we still shrink the payload. */
function mechanicalSummary(older: HistoryTurn[]): string {
  return older
    .map((t) => `${t.role}: ${t.content.replace(/\s+/g, " ").slice(0, 200)}`)
    .join(" | ");
}

/**
 * If the cumulative history is large, summarize all-but-the-last-N turns into a single
 * synthetic assistant message that prefixes the recent verbatim turns. Returns the original
 * history unchanged when below the threshold. Failures fall back to mechanical truncation
 * so the next agent run can never be blocked by a transient compactor error.
 */
export async function compactIfNeeded(
  history: HistoryTurn[],
): Promise<HistoryTurn[]> {
  if (history.length <= KEEP_RECENT_TURNS) return history;
  if (totalChars(history) <= COMPACT_THRESHOLD_CHARS) return history;

  const older = history.slice(0, -KEEP_RECENT_TURNS);
  const recent = history.slice(-KEEP_RECENT_TURNS);
  const transcript = older.map((t) => `${t.role}: ${t.content}`).join("\n\n");

  let summary = "";
  try {
    initLlm();
    const result = await run(getCompactAgent(), transcript);
    summary = String(result.finalOutput ?? "").trim();
  } catch {
    // Swallow — fall through to mechanical summary below.
  }
  if (!summary) summary = mechanicalSummary(older);

  return [
    {
      role: "assistant",
      content: `[Tóm tắt ${older.length} lượt trước đó]: ${summary}`,
    },
    ...recent,
  ];
}
