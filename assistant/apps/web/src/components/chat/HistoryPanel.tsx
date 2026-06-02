import { useEffect, useRef } from "react";
import type { ConversationSummary } from "@assistant/shared/chat";

interface HistoryPanelProps {
  open: boolean;
  items: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * Dropdown list of this browser's past conversations, anchored under the header's history
 * button. Click a row to load that session; "clear" drops the local index (server rows are
 * kept). Closes on outside click or Escape.
 */
export function HistoryPanel({
  open,
  items,
  activeId,
  onSelect,
  onClear,
  onClose,
}: HistoryPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // composedPath() pierces the shadow root — inside the embedded widget's Shadow DOM,
      // e.target is retargeted to the host element, so contains(e.target) would always be
      // false and close the panel on the very click that should select a row.
      if (ref.current && !e.composedPath().includes(ref.current)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Lịch sử trò chuyện"
      className="absolute right-2 top-12 z-[60] w-80 max-w-[calc(100vw-24px)] rounded-xl border border-border-subtle bg-surface-container-low shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
        <span className="text-label-caps text-[12px] font-bold tracking-wide text-on-surface">
          History
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={items.length === 0}
          className="text-[13px] text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:hover:text-text-muted bg-transparent border-0 p-0 cursor-pointer"
        >
          clear
        </button>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-text-muted">
          Chưa có cuộc trò chuyện nào.
        </p>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-surface-container ${
                  item.id === activeId ? "bg-surface-container" : ""
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px] text-text-muted shrink-0 mt-0.5"
                  aria-hidden
                >
                  history
                </span>
                <span className="text-[13px] leading-snug text-on-surface line-clamp-2">
                  {item.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
