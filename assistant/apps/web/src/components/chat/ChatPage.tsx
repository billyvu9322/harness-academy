import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatTrace } from "@assistant/shared/traces";
import { AssistantTopBar } from "./AssistantTopBar";
import { WelcomeView } from "./WelcomeView";
import { MessageThread } from "./MessageThread";
import { ChatFollowUpComposer } from "./ChatFollowUpComposer";
import { SuggestionChips } from "./SuggestionChips";
import { TracingDashboardPanel } from "./TracingDashboardPanel";
import { useChatStream } from "../../features/chat/useChatStream";
import { getConversationTraces } from "../../features/chat/chatApi";

interface ChatPageProps {
  /** Embedded widget: shows + wires the top-bar close button. Omitted in the standalone app. */
  onClose?: () => void;
  /** Embedded widget: a context chip ("Đang hỏi về: …") shown under the top bar. */
  contextLabel?: string;
}

export function ChatPage({ onClose, contextLabel }: ChatPageProps = {}) {
  const {
    isLoading,
    turns,
    suggestions,
    error,
    errorCode,
    submit,
    stop,
    vote,
    newChat,
    history,
    activeConversationId,
    refreshHistory,
    loadConversation,
    clearHistory,
  } = useChatStream();
  const [tracingOpen, setTracingOpen] = useState(false);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traces, setTraces] = useState<ChatTrace[]>([]);
  const traceRequestIdRef = useRef(0);
  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  const tracingOpenRef = useRef(tracingOpen);
  const inChat = turns.length > 0 || isLoading;
  activeConversationIdRef.current = activeConversationId;
  tracingOpenRef.current = tracingOpen;

  const loadTraces = useCallback(async () => {
    if (!activeConversationId || !tracingOpen) return;

    const requestId = traceRequestIdRef.current + 1;
    traceRequestIdRef.current = requestId;
    const conversationId = activeConversationId;
    const shouldApplyTraceResult = () =>
      traceRequestIdRef.current === requestId &&
      activeConversationIdRef.current === conversationId &&
      tracingOpenRef.current;

    setTraceLoading(true);
    setTraceError(null);
    try {
      const response = await getConversationTraces(conversationId);
      if (shouldApplyTraceResult()) setTraces(response.traces);
    } catch (err) {
      if (shouldApplyTraceResult()) setTraceError(err instanceof Error ? err.message : "Unable to load traces");
    } finally {
      if (shouldApplyTraceResult()) setTraceLoading(false);
    }
  }, [activeConversationId, tracingOpen]);

  const closeTracing = useCallback(() => {
    traceRequestIdRef.current += 1;
    tracingOpenRef.current = false;
    setTracingOpen(false);
  }, []);

  const toggleTracing = useCallback(() => {
    setTracingOpen((open) => {
      const nextOpen = !open;
      tracingOpenRef.current = nextOpen;
      if (!nextOpen) traceRequestIdRef.current += 1;
      return nextOpen;
    });
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      traceRequestIdRef.current += 1;
      setTracingOpen(false);
      setTraceLoading(false);
      setTraceError(null);
      setTraces([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!tracingOpen || !activeConversationId) return;

    void loadTraces();
  }, [activeConversationId, loadTraces, tracingOpen]);

  return (
    <main className="flex flex-col relative h-full overflow-hidden bg-surface text-on-background flex-1">
      <AssistantTopBar
        onClose={onClose}
        onNewChat={inChat ? newChat : undefined}
        history={history}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onClearHistory={clearHistory}
        onRefreshHistory={refreshHistory}
        onToggleTracing={toggleTracing}
        tracingOpen={tracingOpen}
        tracingDisabled={!activeConversationId}
      />
      {contextLabel ? (
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-border-subtle text-[12px] text-text-muted truncate">
          Đang hỏi về:{" "}
          <span className="text-on-surface font-medium">{contextLabel}</span>
        </div>
      ) : null}
      {inChat ? (
        <>
          <MessageThread turns={turns} onVote={vote} />
          <footer className="bg-surface flex flex-col items-center z-10">
            {suggestions.length > 0 && !isLoading ? (
              <div className="w-full max-w-2xl px-gutter pt-2">
                <SuggestionChips suggestions={suggestions} onSelect={submit} />
              </div>
            ) : null}
            <ChatFollowUpComposer isLoading={isLoading} onSubmit={submit} onStop={stop} />
          </footer>
        </>
      ) : (
        <>
          <WelcomeView isLoading={isLoading} onSubmit={submit} />
        </>
      )}
      {error ? (
        <div
          role="alert"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-[calc(100%-32px)] rounded-lg border border-error bg-surface-container-lowest text-error px-4 py-2 text-body-md shadow-md flex items-center gap-3"
        >
          <span className="flex-1">{error}</span>
          {errorCode === "too_long" ? (
            <button
              type="button"
              onClick={newChat}
              className="shrink-0 px-3 py-1.5 rounded-md border border-error text-error text-[12px] font-medium hover:bg-error hover:text-on-error transition-colors"
            >
              Bắt đầu chat mới
            </button>
          ) : null}
        </div>
      ) : null}
      <TracingDashboardPanel
        open={tracingOpen}
        traces={traces}
        loading={traceLoading}
        error={traceError}
        onClose={closeTracing}
        onRefresh={loadTraces}
      />
    </main>
  );
}
