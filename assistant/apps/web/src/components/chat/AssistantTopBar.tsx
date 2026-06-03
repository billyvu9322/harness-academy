import { useState } from "react";
import type { ConversationSummary } from "@assistant/shared/chat";
import { HistoryPanel } from "./HistoryPanel";

interface AssistantTopBarProps {
  /** When provided (embedded widget), the close button calls this; otherwise it is hidden. */
  onClose?: () => void;
  /** Resets the thread and starts a fresh conversation. Hidden when omitted. */
  onNewChat?: () => void;
  /** This browser's past conversations, for the history dropdown. */
  history?: ConversationSummary[];
  /** Id of the conversation currently shown, highlighted in the list. */
  activeConversationId?: string | null;
  /** Load a stored conversation into the thread. */
  onSelectConversation?: (id: string) => void;
  /** Drop the local history index. */
  onClearHistory?: () => void;
  /** Re-fetch summaries; called when the dropdown opens. */
  onRefreshHistory?: () => void;
}

export function AssistantTopBar({
  onClose,
  onNewChat,
  history = [],
  activeConversationId = null,
  onSelectConversation,
  onClearHistory,
  onRefreshHistory,
}: AssistantTopBarProps = {}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const toggleHistory = () => {
    setHistoryOpen((prev) => {
      const next = !prev;
      if (next) onRefreshHistory?.();
      return next;
    });
  };

  return (
    <header className="flex justify-between items-center h-14 px-4 w-full bg-surface-container-lowest border-b border-border-subtle sticky top-0 z-50">
      <div className="flex items-center gap-2 text-label-caps font-label-caps font-bold text-on-surface">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <h3 className="font-headline-lg">Assistant</h3>
      </div>
      <div className="flex items-center gap-4">
        {onNewChat ? (
          <button
            type="button"
            aria-label="New chat"
            title="Cuộc trò chuyện mới"
            onClick={onNewChat}
            className="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0"
          >
            edit_square
          </button>
        ) : null}
        <button
          type="button"
          aria-label="History"
          aria-expanded={historyOpen}
          onClick={toggleHistory}
          className={`material-symbols-outlined transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0 ${
            historyOpen ? "text-primary" : "text-text-muted hover:text-primary"
          }`}
        >
          history
        </button>
        {onClose ? (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0"
          >
            close
          </button>
        ) : null}
      </div>
      <HistoryPanel
        open={historyOpen}
        items={history}
        activeId={activeConversationId}
        onSelect={(id) => {
          onSelectConversation?.(id);
          setHistoryOpen(false);
        }}
        onClear={() => onClearHistory?.()}
        onClose={() => setHistoryOpen(false)}
      />
    </header>
  );
}
