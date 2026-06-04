import { run } from "@openai/agents";
import type { StreamEvent } from "@assistant/shared/events";
import type { Citation } from "@assistant/shared/citations";
import type { Suggestion } from "@assistant/shared/suggestions";
import { initLlm } from "./llm";
import { assistant } from "./runtime";
import { buildCitations } from "../docs/citations";
import { checkInput, friendlyReason } from "./guardrails";
import { classifyInput, refusalFor } from "./relevance";
import { createAssistantContext, type AssistantContext } from "./context";
import { buildAgentInput, type HistoryTurn } from "./history";

const MAX_TURNS = 8;
const MAX_SUGGESTIONS = 3;

function toolName(item: any): string {
  return item?.rawItem?.name ?? item?.name ?? "tool";
}

function safeParseArgs(raw: unknown): Record<string, any> {
  if (typeof raw !== "string")
    return raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Human-readable detail for a tool.started event, from its call arguments. */
function buildToolDetail(
  name: string,
  args: Record<string, any>,
): string | undefined {
  switch (name) {
    case "grep_docs":
      return typeof args.pattern === "string" ? args.pattern : undefined;
    case "read_doc_section":
      return typeof args.docId === "string"
        ? args.heading
          ? `${args.docId} · ${args.heading}`
          : args.docId
        : undefined;
    case "harness_blueprint":
      return typeof args.workflow === "string" ? args.workflow : undefined;
    case "list_docs":
      return Array.isArray(args.contentTypes) && args.contentTypes.length
        ? args.contentTypes.join(", ")
        : undefined;
    case "load_skill":
      return typeof args.name === "string" ? args.name : undefined;
    default:
      return undefined;
  }
}

/** Small summary for a tool.completed event, from its output (never the full payload). */
function buildToolSummary(name: string, output: any): string | undefined {
  if (Array.isArray(output)) {
    const unit =
      name === "grep_docs"
        ? "matches"
        : name === "list_docs"
          ? "docs"
          : "results";
    return `${output.length} ${unit}`;
  }
  if (output && typeof output === "object") {
    if (output.found === false) return "not found";
    if (name === "read_doc_section")
      return `section: ${output.heading ?? "whole doc"}`;
    if (name === "harness_blueprint" && Array.isArray(output.sections)) {
      return `${output.sections.length} sections`;
    }
  }
  return undefined;
}

/** Pure mapper: one SDK stream event → one app StreamEvent (or null if not surfaced). */
export function mapStreamEvent(ev: any): StreamEvent | null {
  if (ev?.type === "raw_model_stream_event") {
    const d = ev.data;
    if (d?.type === "output_text_delta" && typeof d.delta === "string") {
      return { type: "message.delta", delta: d.delta };
    }
    if (d?.type === "response_started") return { type: "message.started" };
    return null;
  }
  if (ev?.type === "run_item_stream_event") {
    const raw = ev.item?.rawItem;
    const name = toolName(ev.item);
    const callId: string = raw?.callId ?? name;
    switch (ev.name) {
      case "tool_called": {
        const detail = buildToolDetail(name, safeParseArgs(raw?.arguments));
        return detail
          ? { type: "tool.started", tool: name, callId, detail }
          : { type: "tool.started", tool: name, callId };
      }
      case "tool_output": {
        const summary = buildToolSummary(name, ev.item?.output);
        return summary
          ? { type: "tool.completed", tool: name, callId, summary }
          : { type: "tool.completed", tool: name, callId };
      }
      case "message_output_created":
        return { type: "message.completed" };
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
  /** Caller-owned context so it can read reads/toolCalls for a trace after the stream ends. */
  context?: AssistantContext;
  /** Abort signal: when fired (client disconnect / Stop button) the agent run is cancelled
   *  and the generator exits without yielding further events. */
  signal?: AbortSignal;
}

/** Drive a streamed agent run and yield typed app events. */
export async function* streamAssistant(
  message: string,
  opts: StreamOptions = {},
): AsyncGenerator<StreamEvent> {
  initLlm();

  const input = checkInput(message);
  if (input.tripwire) {
    // Friendly Vietnamese message + machine-readable code so the UI can branch
    // (e.g. surface a "Bắt đầu chat mới" CTA when the per-message cap is hit).
    const code =
      input.reason === "too_long" ||
      input.reason === "empty" ||
      input.reason === "injection"
        ? input.reason
        : "unknown";
    yield { type: "error", message: friendlyReason(input.reason), code };
    yield { type: "done" };
    return;
  }

  // Relevance/safety classifier (cheap pre-pass). Refuse off-topic / injection here
  // so the expensive tool loop never runs. Fails open to SAFE on any classifier error.
  const label = await classifyInput(message);
  if (label !== "SAFE") {
    yield {
      type: "error",
      message: refusalFor(label),
      code: label === "OFF_TOPIC" ? "off_topic" : "injection",
    };
    yield { type: "done" };
    return;
  }

  const context =
    opts.context ?? createAssistantContext({ userLanguage: opts.userLanguage });

  // Early exit if the caller aborted before we even started the agent run.
  if (opts.signal?.aborted) return;

  try {
    const input = buildAgentInput(opts.history ?? [], message);
    const result = await run(
      assistant.orchestrator,
      input as Parameters<typeof run>[1],
      {
        context,
        stream: true,
        maxTurns: MAX_TURNS,
        signal: opts.signal,
      },
    );

    for await (const ev of result) {
      // Abort: stop forwarding events. The SDK also rejects `result.completed` on signal,
      // but checking here lets us bail out the moment between deltas.
      if (opts.signal?.aborted) return;
      const mapped = mapStreamEvent(ev);
      if (mapped) {
        yield mapped;
      }
    }

    await result.completed;

    const citations = buildCitations(context.reads);

    for (const citation of citations) {
      yield { type: "citation", citation };
    }

    for (const suggestion of buildSuggestions(citations)) {
      yield { type: "suggestion", suggestion };
    }

    yield { type: "done" };
  } catch (err) {
    // Aborts surface as DOMException/Error("aborted") from the SDK — swallow silently so the
    // caller can finalize the partial response without a spurious error frame.
    if (opts.signal?.aborted) return;
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "unknown error",
    };

    yield { type: "done" };
  }
}
