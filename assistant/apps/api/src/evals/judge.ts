/**
 * LLM-judge primitives (pure). The live call lives in runEvals.ts — these build the
 * prompt and parse the verdict, so both are unit-testable without the router.
 */

export interface JudgePromptArgs {
  question: string;
  rubric: string;
  answer: string;
  language?: string;
}

export interface JudgeMessages {
  system: string;
  user: string;
}

export interface JudgeVerdict {
  /** 0..5 quality score against the rubric. */
  score: number;
  /** Final pass decision. */
  pass: boolean;
  reason: string;
  /** False when the model output could not be parsed as a verdict. */
  parsed: boolean;
}

/** Score at or above which an answer passes when the model omits an explicit boolean. */
const PASS_THRESHOLD = 4;

export function buildJudgePrompt(args: JudgePromptArgs): JudgeMessages {
  const lang = args.language ?? 'the user language';
  const system = [
    'You are an evaluator grading an AI assistant that answers questions about',
    'AI agent harness engineering using an internal documentation corpus.',
    'The rubric lists the MINIMUM points a correct answer must convey — it is not exhaustive.',
    'Score on: (1) does the answer cover the rubric points, (2) is it on-topic and coherent,',
    `(3) is it written in ${lang}.`,
    'Do NOT lower the score for additional accurate, on-topic detail beyond the rubric —',
    'the answer is drawn from a corpus you cannot see, so treat extra relevant detail as grounded.',
    'Penalize only: missing rubric points, off-topic content, internal contradictions, or',
    'specific invented facts (e.g. fake numbers/names) that read as clearly fabricated.',
    'Respond with a SINGLE JSON object and nothing else:',
    '{"score": <integer 0-5>, "pass": <true|false>, "reason": "<short reason>"}.',
    'pass must be true when score >= 4.',
  ].join(' ');

  const user = [
    `QUESTION:\n${args.question}`,
    `RUBRIC (what a correct answer must convey):\n${args.rubric}`,
    `ASSISTANT ANSWER:\n${args.answer}`,
  ].join('\n\n');

  return { system, user };
}

const FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/i;

function extractJson(raw: string): unknown | null {
  const fenced = raw.match(FENCE_RE);
  const body = fenced?.[1] ?? raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

export function parseJudgeVerdict(raw: string): JudgeVerdict {
  const obj = extractJson(raw);
  if (!obj || typeof obj !== 'object') {
    return { score: 0, pass: false, reason: 'unparseable judge output', parsed: false };
  }
  const record = obj as Record<string, unknown>;
  const score = clampScore(record.score);
  const pass = typeof record.pass === 'boolean' ? record.pass : score >= PASS_THRESHOLD;
  const reason = typeof record.reason === 'string' ? record.reason : '';
  return { score, pass, reason, parsed: true };
}
