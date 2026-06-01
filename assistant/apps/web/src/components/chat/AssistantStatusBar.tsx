interface AssistantStatusBarProps {
  version?: string;
  variant?: 'welcome' | 'chat';
}

export function AssistantStatusBar({ version = 'v1.4.2', variant = 'welcome' }: AssistantStatusBarProps) {
  const suffix = variant === 'welcome' ? 'Encrypted AI Core Active' : 'AI Core Active';
  return (
    <footer className="w-full h-10 px-6 flex items-center justify-start border-t border-border-subtle bg-surface-container-lowest shrink-0">
      <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest">
        Forge Terminal Environment {version} — {suffix}
      </p>
    </footer>
  );
}
