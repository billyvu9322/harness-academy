/**
 * Bilingual (VN ↔ EN) keyword expansion for cross-lingual retrieval (B8).
 *
 * The corpus is mostly English technical text with Vietnamese lesson prose; a Vietnamese
 * query often shares no surface tokens with the English source. Each group below lists
 * equivalent terms across both languages — `expandQuery` adds the siblings of any term it
 * finds in the query so `grep_docs` can match the source regardless of the query's language.
 */
const TERM_GROUPS: string[][] = [
  ['verification gate', 'cổng xác minh', 'cổng kiểm chứng', 'xác minh'],
  ['feature list', 'danh sách tính năng'],
  ['orchestrator', 'bộ điều phối', 'điều phối'],
  ['sub-agent', 'subagent', 'agent con', 'tác tử con'],
  ['clean state', 'trạng thái sạch'],
  ['heartbeat', 'query loop', 'nhịp tim', 'vòng lặp truy vấn'],
  ['harness', 'khung agent'],
  ['context', 'ngữ cảnh', 'bối cảnh'],
  ['session', 'phiên làm việc'],
  ['guardrail', 'rào chắn', 'lan can bảo vệ'],
  ['workflow', 'quy trình', 'luồng công việc'],
  ['retrieval', 'truy hồi'],
  ['skill', 'kỹ năng'],
  ['prompt', 'lời nhắc'],
];

/**
 * Expand a search pattern into bilingual variants. The original pattern is always first;
 * for every known term that appears in the query, its cross-language siblings are appended.
 * Returns a deduped (case-insensitive) list. Unknown patterns return `[pattern]` unchanged.
 */
export function expandQuery(pattern: string): string[] {
  const lower = pattern.toLowerCase();
  const out: string[] = [pattern];
  const seen = new Set<string>([lower]);

  for (const group of TERM_GROUPS) {
    const hit = group.some((term) => lower.includes(term.toLowerCase()));
    if (!hit) continue;
    for (const term of group) {
      const key = term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(term);
    }
  }
  return out;
}
