import { useEffect, useRef, useState } from "react";
import type { Citation } from "@assistant/shared/citations";
import type { Suggestion } from "@assistant/shared/suggestions";
import type { Turn } from "../../components/chat/MessageThread";
import {
  getConversationMessages,
  postChatMessage,
  postFeedback,
} from "./chatApi";
import { messagesToTurns } from "./restore";
import { readSseStream } from "../../lib/sse";
import { nextStatus, STATUS_THINKING } from "../../lib/agentStatus";
import {
  toAgentEvent,
  reduceAgentEvent,
  type TimelineStep,
} from "./agentEvent";

/** Stable localStorage key for the persisted conversation id (U5 restore). */
const CONVERSATION_ID_KEY = "harness.conversationId";

function loadStoredConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONVERSATION_ID_KEY);
}

function persistConversationId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONVERSATION_ID_KEY, id);
}

function clearStoredConversationId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONVERSATION_ID_KEY);
}

interface ChatStreamState {
  isLoading: boolean;
  turns: Turn[];
  suggestions: Suggestion[];
  error: string | null;
  submit: (prompt: string) => Promise<void>;
  vote: (messageId: string, vote: "up" | "down") => void;
  newChat: () => void;
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

/**
 * Resolve on the next paint frame. The SSE consumer awaits this between events so React
 * commits and the browser paints each timeline step / text delta as it arrives — instead
 * of draining the whole stream in one synchronous task (auto-batched into a single commit
 * that only shows up at `done`). rAF self-throttles to ~60fps, so a burst of buffered
 * events replays as a smooth animation rather than flooding renders.
 */
function nextPaint(): Promise<void> {
  if (typeof requestAnimationFrame === "undefined") return Promise.resolve();
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function useChatStream(): ChatStreamState {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);

  // On mount, restore the previous conversation from the server (U5). Runs once;
  // only seeds when the thread is empty so we never clobber an in-progress session.
  useEffect(() => {
    const storedId = loadStoredConversationId();
    if (!storedId) return;

    let cancelled = false;
    void (async () => {
      try {
        const { messages } = await getConversationMessages(storedId);
        if (cancelled) return;
        conversationId.current = storedId;
        const restored = messagesToTurns(messages);
        // Guard against overwriting a conversation the user already started.
        setTurns((prev) => (prev.length === 0 ? restored : prev));
      } catch {
        // Unknown/expired id or transient failure: drop it and start fresh, never crash.
        clearStoredConversationId();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(prompt: string) {
    setError(null);
    setSuggestions([]);
    setIsLoading(true);

    const userId = genId();
    const assistantId = genId();
    setTurns((prev) => [
      ...prev,
      { id: userId, role: "user", text: prompt },
      {
        id: assistantId,
        role: "assistant",
        body: "",
        related: [],
        status: STATUS_THINKING,
      },
    ]);

    let body = "";
    let status: string | null = STATUS_THINKING;
    const related: Citation[] = [];
    const collectedSuggestions: Suggestion[] = [];
    // U7: accumulate the live agent timeline for this turn and time the whole turn.
    let timeline: TimelineStep[] = [];
    const startedAt = Date.now();

    const patchAssistant = (
      next: Partial<Extract<Turn, { role: "assistant" }>>,
    ) => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId && t.role === "assistant"
            ? { ...t, ...next }
            : t,
        ),
      );
    };

    try {
      const response = await postChatMessage({
        message: prompt,
        mode: "academy",
        ...(conversationId.current
          ? { conversationId: conversationId.current }
          : {}),
      });
      const cid = response.headers.get("X-Conversation-Id");
      if (cid) {
        conversationId.current = cid;
        // Persist so a reload can restore this thread from the server (U5).
        persistConversationId(cid);
      }
      if (!response.ok || !response.body)
        throw new Error(`stream failed (${response.status})`);

      for await (const ev of readSseStream(response)) {
        // Did this event change anything the user sees? Only then do we spend a paint frame.
        let dirty = false;
        switch (ev.type) {
          case "message.delta":
            body += ev.delta;
            patchAssistant({ body });
            dirty = true;
            break;
          case "citation":
            related.push(ev.citation);
            patchAssistant({ related: [...related] });
            dirty = true;
            break;
          case "assistant_message.related":
            // The server message id arrives here; capture it so feedback can target the stored row.
            patchAssistant({ serverMessageId: ev.messageId });
            break;
          case "suggestion":
            collectedSuggestions.push(ev.suggestion);
            break;
          case "error":
            setError(ev.message);
            break;
          case "done":
            break;
          default:
            break;
        }
        // Drive the inline tool/docs-access status off the same event stream (U4).
        const updated = nextStatus(status, ev);
        if (updated !== status) {
          status = updated;
          patchAssistant({ status });
          dirty = true;
        }
        // Drive the agent timeline off the same stream (U7).
        const agentEv = toAgentEvent(ev);
        if (agentEv) {
          const nextTimeline = reduceAgentEvent(timeline, agentEv);
          if (nextTimeline !== timeline) {
            timeline = nextTimeline;
            patchAssistant({ timeline });
            dirty = true;
          }
        }
        if (dirty) await nextPaint();
      }
      patchAssistant({ status: null, showFeedback: true });
      setSuggestions(collectedSuggestions);
    } catch (err) {
      patchAssistant({ status: null });
      setError(
        err instanceof Error ? err.message : "Đã có lỗi khi gọi assistant.",
      );
    } finally {
      setIsLoading(false);
      // Collapse the timeline to its summary regardless of how the turn ended (U7).
      patchAssistant({
        timelineDone: true,
        timelineDurationMs: Date.now() - startedAt,
      });
    }
  }

  // Start a fresh conversation: drop the in-memory thread and the persisted id so the
  // next submit creates a brand-new server conversation. Returns the UI to the welcome view.
  function newChat() {
    conversationId.current = undefined;
    clearStoredConversationId();
    setTurns([]);
    setSuggestions([]);
    setError(null);
  }

  function vote(messageId: string, value: "up" | "down") {
    // Fire-and-forget: the button already reflects the choice optimistically. Surface
    // failures via the shared error banner but never let a rejection crash the UI.
    void postFeedback(messageId, value).catch((err) => {
      setError(err instanceof Error ? err.message : "Không gửi được phản hồi.");
    });
  }

  return { isLoading, turns, suggestions, error, submit, vote, newChat };
}
