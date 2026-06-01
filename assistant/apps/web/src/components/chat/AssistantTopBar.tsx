export function AssistantTopBar() {
  return (
    <header className="flex justify-between items-center h-14 px-4 w-full bg-surface-container-lowest border-b border-border-subtle sticky top-0 z-50">
      <div className="flex items-center gap-2 text-label-caps font-label-caps font-bold text-on-surface">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        Assistant
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Open in new window"
          className="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0"
        >
          open_in_new
        </button>
        <button
          type="button"
          aria-label="History"
          className="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0"
        >
          history
        </button>
        <button
          type="button"
          aria-label="Close"
          className="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0"
        >
          close
        </button>
      </div>
    </header>
  );
}
