import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ensureWidgetElement, loadWidgetScript, openWidget } from "@/lib/widgetLoader";

const WIDGET_SRC = "/assistant-widget.js";
const API_BASE_URL =
  (import.meta.env.VITE_ASSISTANT_API_URL as string | undefined) ?? "http://localhost:3001";

/** The current doc's heading is the most useful context label; fall back to the page title. */
function currentDocTitle(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const h1 = document.querySelector("main h1")?.textContent?.trim();
  return h1 && h1.length > 0 ? h1 : document.title;
}

/** Header button that lazy-loads and opens the embedded assistant, scoped to the current doc. */
export function AskAssistantButton() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    setLoading(true);
    try {
      await loadWidgetScript(WIDGET_SRC);
      const el = ensureWidgetElement({
        apiBaseUrl: API_BASE_URL,
        academyRoute: location.pathname,
        academyTitle: currentDocTitle(),
      });
      openWidget(el);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được trợ lý");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z" />
        </svg>
        {loading ? "Đang mở…" : "Ask Assistant"}
      </button>
      {error ? (
        <span className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
