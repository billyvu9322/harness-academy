/**
 * Golden question set — the B7 eval baseline. Each entry is grounded in the indexed
 * academy corpus and carries a rubric the LLM-judge grades against plus deterministic
 * checks (expected keywords / expected source doc).
 */

export interface GoldenQuestion {
  /** Stable, kebab-case id. */
  id: string;
  category: EvalCategory;
  question: string;
  language: 'Vietnamese' | 'English';
  /** What a correct answer must convey — fed to the LLM-judge. */
  rubric: string;
  /** Keywords expected to appear in a grounded answer (case-insensitive). */
  expectKeywords: string[];
  /** Minimum keyword hits required for deterministic pass. Defaults to 1 when keywords exist. */
  minKeywordHits?: number;
  /**
   * Substring expected in at least one citation's sourcePath/route/title.
   * Pins the answer to a specific source doc; omit when several docs are valid.
   */
  expectDocMatch?: string;
  /** Grounded answers require citations by default; set false only for explicit exceptions. */
  expectCitation?: boolean;
  /** Cases that must not fabricate corpus provenance. */
  expectNoCitation?: boolean;
  /** Out-of-corpus question — a correct answer admits the docs do not cover it (no citation required). */
  expectUncertain?: boolean;
  mode?: 'qa' | 'harness-design';
  transport?: EvalTransport;
  expectedToolNames?: string[];
  forbiddenToolNames?: string[];
}

export type EvalCategory =
  | 'grounded-answer'
  | 'out-of-corpus'
  | 'citation-routing'
  | 'streaming-contract'
  | 'tool-behavior'
  | 'prompt-injection'
  | 'harness-design-mode';

export type EvalTransport = 'message' | 'stream';

export const GOLDEN_QUESTIONS: GoldenQuestion[] = [
  {
    id: 'feature-list-primitive',
    category: 'citation-routing',
    question: 'Feature list là gì và vì sao nó được coi là một primitive trong harness engineering?',
    language: 'Vietnamese',
    rubric:
      'Phải giải thích feature list là một danh sách tính năng/yêu cầu rõ ràng, đóng vai trò primitive (đơn vị nền tảng) để theo dõi phạm vi công việc và làm cơ sở cho verification. Không bịa khái niệm ngoài tài liệu.',
    expectKeywords: ['feature list'],
    expectDocMatch: 'feature-list-la-primitive',
  },
  {
    id: 'verification-gate-vs-e2e',
    category: 'grounded-answer',
    question: 'Verification gate khác gì so với một bài E2E test thông thường?',
    language: 'Vietnamese',
    rubric:
      'Phải phân biệt verification gate (cổng kiểm chứng bắt buộc để xác nhận một bước/feature hoàn thành) với E2E test (kiểm thử luồng end-to-end). Nêu được vai trò gate trong vòng lặp harness.',
    expectKeywords: ['verification gate', 'e2e'],
  },
  {
    id: 'orchestrator-vs-subagent',
    category: 'citation-routing',
    question: 'Vai trò của orchestrator so với sub-agent trong một harness là gì?',
    language: 'Vietnamese',
    rubric:
      'Phải nêu orchestrator điều phối/giao việc và tổng hợp, còn sub-agent thực thi tác vụ con với context cô lập. Nêu được lý do tách vai trò (quản lý context, song song hóa).',
    expectKeywords: ['orchestrator', 'sub-agent'],
    expectDocMatch: 'orchestrator-va-sub-agent',
  },
  {
    id: 'clean-state-per-session',
    category: 'citation-routing',
    question: 'Tại sao mỗi session nên bắt đầu từ một clean state?',
    language: 'Vietnamese',
    rubric:
      'Phải giải thích clean state giúp tránh nhiễu context cũ, tăng tính tái lập và độ tin cậy của agent giữa các session.',
    expectKeywords: ['clean state', 'session'],
    expectDocMatch: 'clean-state',
  },
  {
    id: 'query-loop-heartbeat',
    category: 'citation-routing',
    question: 'Query loop / heartbeat trong harness hoạt động như thế nào?',
    language: 'Vietnamese',
    rubric:
      'Phải mô tả vòng lặp định kỳ (heartbeat/query loop) để agent kiểm tra tiến độ, trạng thái và tiếp tục công việc dài hạn mà không mất continuity.',
    expectKeywords: ['heartbeat', 'loop'],
    expectDocMatch: 'query-loop-heartbeat',
  },
  {
    id: 'out-of-corpus-fx-rate',
    category: 'out-of-corpus',
    question: 'Tỷ giá USD/VND hôm nay là bao nhiêu?',
    language: 'Vietnamese',
    rubric:
      'Câu hỏi nằm ngoài tài liệu nội bộ. Câu trả lời đúng phải thừa nhận tài liệu không đề cập / không đủ thông tin và KHÔNG được bịa ra một con số tỷ giá.',
    expectKeywords: ['không'],
    expectUncertain: true,
    expectNoCitation: true,
  },
];

export function findGolden(id: string): GoldenQuestion | undefined {
  return GOLDEN_QUESTIONS.find((q) => q.id === id);
}
