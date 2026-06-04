import type { StreamEvent } from "@assistant/shared/events";
import { STATUS_ANSWERING } from "../../lib/agentStatus";

/**
 * Internal, UI-shaped events for the agent timeline (U7). These normalize the raw
 * SSE stream into just the transitions the timeline cares about, so the reducer
 * never has to know about citations, retrieval, per-turn message.started, etc.
 */
export type AgentEvent =
  | { type: "tool_start"; name: string; detail?: string; eventId: string }
  | { type: "tool_done"; eventId: string; result?: string }
  | { type: "text_start" }
  | { type: "text_delta"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** A single rendered row in the agent timeline. */
export interface TimelineStep {
  /** For tool steps this is the callId/eventId; for the text step it is TEXT_STEP_ID. */
  id: string;
  kind: "tool" | "text";
  label: string;
  detail?: string;
  result?: string;
  status: "running" | "done";
}

/** Stable id for the single "Generating response" text step. */
export const TEXT_STEP_ID = "__text__";

const TOOL_LABELS: Record<string, string> = {
  list_docs: "Listing docs",
  grep_docs: "Searching docs",
  read_doc_section: "Reading section",
  harness_blueprint: "Drafting blueprint",
};

/** Friendly label for a tool name; unknown tools fall back to the raw name. */
export function toolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool;
}

/**
 * load_skill is rendered as `Skill '<name>' loaded` so the timeline reads as a
 * narrative line rather than a generic tool call. The skill name arrives as the
 * tool's `detail` (args.name from the backend); when missing we degrade to the
 * plain tool label.
 */
function loadSkillLabel(detail: string | undefined): string {
  return detail ? `Skill '${detail}' loaded` : toolLabel("load_skill");
}

/**
 * Adapt a raw stream event into a timeline AgentEvent, or null when the event is
 * irrelevant to the timeline. Note: message.started fires once per LLM turn (several
 * per answer) so it is intentionally ignored — the text step is derived from the first
 * message.delta inside the reducer.
 */
export function toAgentEvent(ev: StreamEvent): AgentEvent | null {
  switch (ev.type) {
    case "tool.started":
      if (ev.tool === "load_skill") {
        return {
          type: "tool_start",
          name: loadSkillLabel(ev.detail),
          eventId: ev.callId,
        };
      }
      return {
        type: "tool_start",
        name: toolLabel(ev.tool),
        detail: ev.detail,
        eventId: ev.callId,
      };
    case "tool.completed":
      return { type: "tool_done", eventId: ev.callId, result: ev.summary };
    case "message.delta":
      return { type: "text_delta", delta: ev.delta };
    case "done":
      return { type: "done" };
    case "error":
      return { type: "error", message: ev.message };
    default:
      // message.started, message.completed, retrieval.completed, citation,
      // assistant_message.related, suggestion — none drive the timeline.
      return null;
  }
}

/** Mark every still-running step as done (used on done/error). */
function finishRunning(steps: TimelineStep[]): TimelineStep[] {
  return steps.map((s) =>
    s.status === "running" ? { ...s, status: "done" } : s,
  );
}

/**
 * Pure reducer that folds an AgentEvent into the timeline. Always returns a new array.
 * Tool start/done are paired strictly by eventId (callId) so a repeated tool — e.g.
 * grep_docs twice — closes the correct step rather than the first one with that label.
 */
export function reduceAgentEvent(
  steps: TimelineStep[],
  ev: AgentEvent,
): TimelineStep[] {
  switch (ev.type) {
    case "tool_start":
      return [
        ...steps,
        {
          id: ev.eventId,
          kind: "tool",
          label: ev.name,
          detail: ev.detail,
          status: "running",
        },
      ];
    case "tool_done": {
      const target = steps.find((s) => s.id === ev.eventId);
      // A done with no matching start is ignored gracefully.
      if (!target) return steps;
      return steps.map((s) =>
        s.id === ev.eventId ? { ...s, status: "done", result: ev.result } : s,
      );
    }
    case "text_start":
    case "text_delta": {
      // The first text delta (or an explicit text_start) seeds the single text step.
      if (steps.some((s) => s.id === TEXT_STEP_ID)) return steps;
      return [
        ...steps,
        {
          id: TEXT_STEP_ID,
          kind: "text",
          label: STATUS_ANSWERING,
          status: "running",
        },
      ];
    }
    case "done":
    case "error":
      return finishRunning(steps);
    default:
      return steps;
  }
}
