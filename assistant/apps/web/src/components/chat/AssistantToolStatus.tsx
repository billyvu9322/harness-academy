interface AssistantToolStatusProps {
  /** Current status label; when null/empty the indicator is hidden. */
  label?: string | null;
}

/** Inline, live docs-access/tool status shown while the assistant turn is streaming (U4). */
export function AssistantToolStatus({ label }: AssistantToolStatusProps) {
  if (!label) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-text-muted text-[12px] font-mono"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-forge-orange animate-pulse" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
