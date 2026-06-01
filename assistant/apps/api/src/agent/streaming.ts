import { run } from '@openai/agents';
import type { StreamEvent } from '@assistant/shared/events';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';
import { initLlm } from './llm';
import { assistant } from './runtime';
import { buildCitations } from '../docs/citations';
import { checkInput } from './guardrails';
import { createAssistantContext } from './context';
import { buildAgentInput, type HistoryTurn } from './history';

const MAX_TURNS = 8;
const MAX_SUGGESTIONS = 3;

function toolName(item: any): string {
  return item?.rawItem?.name ?? item?.name ?? 'tool';
}

/** Pure mapper: one SDK stream event → one app StreamEvent (or null if not surfaced). */
export function mapStreamEvent(ev: any): StreamEvent | null {
  if (ev?.type === 'raw_model_stream_event') {
    const d = ev.data;
    if (d?.type === 'output_text_delta' && typeof d.delta === 'string') {
      return { type: 'message.delta', delta: d.delta };
    }
    if (d?.type === 'response_started') return { type: 'message.started' };
    return null;
  }
  if (ev?.type === 'run_item_stream_event') {
    switch (ev.name) {
      case 'tool_called':
        return { type: 'tool.started', tool: toolName(ev.item) };
      case 'tool_output':
        return { type: 'tool.completed', tool: toolName(ev.item) };
      case 'message_output_created':
        return { type: 'message.completed' };
      default:
        return null;
    }
  }
  return null;
}

/** Deterministic next-prompt suggestions from the docs actually cited (no extra LLM call). */
export function buildSuggestions(citations: Citation[]): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const c of citations) {
    if (seen.has(c.title)) continue;
    seen.add(c.title);
    out.push({ label: c.title, prompt: `Giải thích thêm về "${c.title}"` });
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

export interface StreamOptions {
  userLanguage?: string;
  history?: HistoryTurn[];
}

/** Drive a streamed agent run and yield typed app events. */
export async function* streamAssistant(
  message: string,
  opts: StreamOptions = {},
): AsyncGenerator<StreamEvent> {
  initLlm();

  const input = checkInput(message);
  if (input.tripwire) {
    yield { type: 'error', message: `input rejected: ${input.reason}` };
    yield { type: 'done' };
    return;
  }

  const context = createAssistantContext(opts.userLanguage);
  try {
    const input = buildAgentInput(opts.history ?? [], message);
    const result = await run(assistant.orchestrator, input as Parameters<typeof run>[1], {
      context,
      stream: true,
      maxTurns: MAX_TURNS,
    });

    for await (const ev of result) {
      const mapped = mapStreamEvent(ev);
      if (mapped) yield mapped;
    }
    await result.completed;

    const citations = buildCitations(context.reads);
    for (const citation of citations) yield { type: 'citation', citation };
    for (const suggestion of buildSuggestions(citations)) yield { type: 'suggestion', suggestion };
    yield { type: 'done' };
  } catch (err) {
    yield { type: 'error', message: err instanceof Error ? err.message : 'unknown error' };
    yield { type: 'done' };
  }
}
