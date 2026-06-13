import type { ChatTrace, LlmCallTrace } from "@assistant/shared/traces";
import { useEffect, useRef } from "react";

interface TracingDashboardPanelProps {
  open: boolean;
  traces: ChatTrace[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatLatency(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${value}ms`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function sanitizeDisplayText(value: string): string {
  const redacted = value
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[REDACTED]")
    .replace(
      /Authorization:\s*Bearer\s+[^\s,;]+/gi,
      "Authorization: Bearer [REDACTED]",
    )
    .replace(/api\s*key\s*[:=]?\s*[^\s,;]+/gi, "api key [REDACTED]")
    .replace(
      /\b(token|secret|password|x-api-key)=([^\s&;,]+)/gi,
      "$1=[REDACTED]",
    );

  return redacted.length > 500 ? `${redacted.slice(0, 500)}...` : redacted;
}

function sumTokens(call: LlmCallTrace): number {
  return call.totalTokens ?? (call.inputTokens ?? 0) + (call.outputTokens ?? 0);
}

function getSummary(traces: ChatTrace[]) {
  const llmCalls = traces.flatMap((trace) => trace.llmCalls);
  const totalLatency = traces.reduce((sum, trace) => sum + trace.latencyMs, 0);
  const averageLatency =
    traces.length > 0 ? Math.round(totalLatency / traces.length) : 0;

  return {
    traceCount: traces.length,
    llmCallCount: llmCalls.length,
    totalTokens: llmCalls.reduce((sum, call) => sum + sumTokens(call), 0),
    cachedInputTokens: llmCalls.reduce(
      (sum, call) => sum + (call.cachedInputTokens ?? 0),
      0,
    ),
    averageLatency,
  };
}

export function orderTracesByCreatedAtDesc(traces: ChatTrace[]): ChatTrace[] {
  return [...traces].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function StatusBadge({
  status,
}: {
  status: ChatTrace["status"] | LlmCallTrace["status"];
}) {
  const isOk = status === "ok";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        isOk ? "bg-green-100 text-green-700" : "bg-error-container text-error"
      }`}
    >
      {status}
    </span>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container-low p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-on-surface">{value}</div>
    </div>
  );
}

function ChipList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <span className="text-[12px] text-text-muted">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-full border border-border-subtle bg-surface-container px-2 py-0.5 text-[12px] text-text-ai"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function DocsList({ docs }: { docs: string[] }) {
  if (docs.length === 0) {
    return (
      <span className="text-[12px] text-text-muted">No docs accessed</span>
    );
  }

  return (
    <ul className="flex flex-col gap-1 text-[12px] text-text-ai">
      {docs.map((doc, index) => (
        <li key={`${doc}-${index}`} className="truncate font-mono" title={doc}>
          {doc}
        </li>
      ))}
    </ul>
  );
}

function LlmCallCard({ call }: { call: LlmCallTrace }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] font-bold text-on-surface">
          {call.endpoint}
        </span>
        {call.model ? (
          <span className="text-[12px] text-text-muted">{call.model}</span>
        ) : null}
        <StatusBadge status={call.status} />
        <span className="text-[12px] text-text-muted">
          {formatLatency(call.latencyMs)}
        </span>
        {call.stream !== undefined ? (
          <span className="text-[12px] text-text-muted">
            stream: {call.stream ? "yes" : "no"}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-text-muted sm:grid-cols-4">
        <span>input {formatNumber(call.inputTokens ?? 0)}</span>
        <span>output {formatNumber(call.outputTokens ?? 0)}</span>
        <span>total {formatNumber(sumTokens(call))}</span>
        <span>cached {formatNumber(call.cachedInputTokens ?? 0)}</span>
      </div>

      {call.requestId ? (
        <div
          className="mt-2 truncate font-mono text-[11px] text-text-muted"
          title={call.requestId}
        >
          requestId {call.requestId}
        </div>
      ) : null}

      {call.errorSummary ? (
        <div className="mt-2 rounded-md bg-error-container px-2 py-1 text-[12px] text-error">
          {sanitizeDisplayText(call.errorSummary)}
        </div>
      ) : null}
    </div>
  );
}

function TraceCard({ trace }: { trace: ChatTrace }) {
  return (
    <article className="rounded-xl border border-border-subtle bg-surface-container-low p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[12px] text-text-muted">
            {formatDate(trace.createdAt)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <StatusBadge status={trace.status} />
            <span>{formatLatency(trace.latencyMs)}</span>
            <span>{trace.citationCount} citations</span>
            {trace.regenerated ? (
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-primary">
                regenerated
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {trace.errorSummary ? (
        <div className="mt-3 rounded-md bg-error-container px-2 py-1 text-[12px] text-error">
          {sanitizeDisplayText(trace.errorSummary)}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Tool calls
          </div>
          <ChipList items={trace.toolCalls} emptyLabel="No tool calls" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Accessed docs
          </div>
          <DocsList docs={trace.accessedDocs} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          LLM calls
        </div>
        {trace.llmCalls.length === 0 ? (
          <span className="text-[12px] text-text-muted">
            No LLM calls recorded
          </span>
        ) : (
          trace.llmCalls.map((call, index) => (
            <LlmCallCard key={`${trace.id}-${index}`} call={call} />
          ))
        )}
      </div>
    </article>
  );
}

function PanelState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-container-low p-6 text-center text-[13px] text-text-muted">
      {children}
    </div>
  );
}

export function TracingDashboardPanel({
  open,
  traces,
  loading,
  error,
  onClose,
  onRefresh,
}: TracingDashboardPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const summary = getSummary(traces);
  const orderedTraces = orderTracesByCreatedAtDesc(traces);

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-black/20"
      role="presentation"
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tracing dashboard"
        className="flex h-full w-full max-w-3xl flex-col border-l border-border-subtle bg-surface-container-lowest shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2 text-on-surface">
            <span
              className="material-symbols-outlined text-primary"
              aria-hidden
            >
              monitoring
            </span>
            <div>
              <h2 className="font-headline-lg text-base font-bold">
                Tracing dashboard
              </h2>
              <p className="text-[12px] text-text-muted">
                Per-turn observability, no prompt bodies or payloads.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="material-symbols-outlined inline-flex items-center justify-center rounded-full border-0 bg-transparent p-0 text-text-muted transition-colors hover:text-primary disabled:opacity-40 cursor-pointer"
              aria-label="Refresh traces"
              title="Refresh traces"
            >
              refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              ref={closeButtonRef}
              className="material-symbols-outlined inline-flex items-center justify-center rounded-full border-0 bg-transparent p-0 text-text-muted transition-colors hover:text-primary cursor-pointer"
              aria-label="Close tracing dashboard"
              title="Close"
            >
              close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <PanelState>
              <span
                className="material-symbols-outlined mb-2 text-error"
                aria-hidden
              >
                error
              </span>
              <div className="mb-3 text-error">
                {sanitizeDisplayText(error)}
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="min-h-11 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
              >
                Retry
              </button>
            </PanelState>
          ) : loading ? (
            <PanelState>
              <span
                className="material-symbols-outlined mb-2 animate-spin text-primary"
                aria-hidden
              >
                progress_activity
              </span>
              Loading traces...
            </PanelState>
          ) : traces.length === 0 ? (
            <PanelState>
              <span
                className="material-symbols-outlined mb-2 text-text-muted"
                aria-hidden
              >
                query_stats
              </span>
              No traces recorded for this conversation yet.
            </PanelState>
          ) : (
            <div className="flex flex-col gap-4">
              <section
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
                aria-label="Trace summary"
              >
                <SummaryCard
                  label="Traces"
                  value={formatNumber(summary.traceCount)}
                />
                <SummaryCard
                  label="LLM calls"
                  value={formatNumber(summary.llmCallCount)}
                />
                <SummaryCard
                  label="Tokens"
                  value={formatNumber(summary.totalTokens)}
                />
                <SummaryCard
                  label="Cached"
                  value={formatNumber(summary.cachedInputTokens)}
                />
                <SummaryCard
                  label="Avg latency"
                  value={formatLatency(summary.averageLatency)}
                />
              </section>

              <section className="flex flex-col gap-3" aria-label="Trace list">
                {orderedTraces.map((trace) => (
                  <TraceCard key={trace.id} trace={trace} />
                ))}
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
