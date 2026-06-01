export interface GuardResult {
  tripwire: boolean;
  reason?: 'empty' | 'too_long' | 'injection' | 'no_citation' | 'external_claim';
}

const MAX_INPUT_CHARS = 4000;

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
