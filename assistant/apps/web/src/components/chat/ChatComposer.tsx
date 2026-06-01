import { FormEvent } from 'react';
import { useChatUiStore } from '../../stores/chatUiStore';

interface ChatComposerProps {
  isLoading?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}

export function ChatComposer({ isLoading = false, onSubmit }: ChatComposerProps) {
  const draft = useChatUiStore((state) => state.draft);
  const setDraft = useChatUiStore((state) => state.setDraft);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || isLoading) return;
    setDraft('');
    await onSubmit(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-5 relative focus-within:border-forge-orange focus-within:ring-1 focus-within:ring-forge-orange transition-all shadow-sm"
    >
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="What would you like to know?"
        disabled={isLoading}
        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[18px] leading-7 text-on-surface resize-none min-h-[160px] p-0 disabled:opacity-60"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit(event as unknown as FormEvent);
          }
        }}
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={isLoading || !draft.trim()}
        className="absolute bottom-4 right-4 text-forge-orange transition-transform active:scale-95 hover:bg-forge-orange/10 p-1 rounded-full disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">arrow_right_alt</span>
      </button>
    </form>
  );
}
