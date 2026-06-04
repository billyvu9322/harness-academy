export type GuardReason =
  | 'empty'
  | 'too_long'
  | 'injection'
  | 'no_citation'
  | 'external_claim';

export interface GuardResult {
  tripwire: boolean;
  reason?: GuardReason;
}

/** Friendly Vietnamese refusal text for a tripwire reason — surfaced to end users. */
export function friendlyReason(reason: GuardReason | undefined): string {
  switch (reason) {
    case 'empty':
      return 'Câu hỏi trống. Hãy nhập nội dung trước khi gửi.';
    case 'too_long':
      return 'Câu hỏi quá dài. Hãy rút gọn câu hỏi hoặc bắt đầu cuộc trò chuyện mới (New chat) để tiếp tục.';
    case 'injection':
      return 'Yêu cầu bị từ chối vì lý do an toàn.';
    case 'external_claim':
    case 'no_citation':
      return 'Câu trả lời không bám tài liệu nội bộ. Hãy thử diễn đạt lại câu hỏi.';
    default:
      return 'Yêu cầu không hợp lệ.';
  }
}

// Per-message cap (single user turn). Set high because long history is handled separately
// by compactIfNeeded() in compact.ts — this guardrail must NOT trip on an aggregate of
// many turns. Anything over this for a single message is almost certainly a paste-bomb.
const MAX_INPUT_CHARS = 64000;

// System-override / prompt-injection attempts (VN + EN).
const INJECTION_RE =
  /\b(ignore|disregard|override|bỏ qua|phớt lờ)\b[\s\S]{0,40}(instruction|instructions|chỉ dẫn|hướng dẫn|prompt|rule|rules)/i;

// Claims sourced from outside the local corpus — phase 1 bans web/external knowledge.
const EXTERNAL_RE = /\b(wikipedia|google|stack\s?overflow|the internet|trên mạng|theo wikipedia)\b/i;

// Explicit uncertainty / "not covered" answers are allowed without a citation.
const UNCERTAINTY_RE =
  /(không đề cập|không đủ|không bao gồm|tài liệu nội bộ không|chưa được đề cập|do not cover|not covered|insufficient|không tìm thấy)/i;

const pass: GuardResult = { tripwire: false };

/** Input guardrail check (pure). Wrapped into an SDK inputGuardrail by the agent. */
export function checkInput(message: string): GuardResult {
  if (message.trim().length === 0) return { tripwire: true, reason: 'empty' };
  if (message.length > MAX_INPUT_CHARS) return { tripwire: true, reason: 'too_long' };
  if (INJECTION_RE.test(message)) return { tripwire: true, reason: 'injection' };
  return pass;
}

/** Output guardrail check (pure). Wrapped into an SDK outputGuardrail by the agent. */
export function checkOutput(args: { answer: string; citationCount: number }): GuardResult {
  const { answer, citationCount } = args;
  if (EXTERNAL_RE.test(answer)) return { tripwire: true, reason: 'external_claim' };
  if (citationCount > 0) return pass;
  if (UNCERTAINTY_RE.test(answer)) return pass;
  return { tripwire: true, reason: 'no_citation' };
}
