import { FormEvent, KeyboardEvent } from 'react';
import { useChatUiStore } from '../../stores/chatUiStore';

interface ChatFollowUpComposerProps {
  isLoading?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}

export function ChatFollowUpComposer({ isLoading = false, onSubmit }: ChatFollowUpComposerProps) {
  const draft = useChatUiStore((state) => state.draft);
  const setDraft = useChatUiStore((state) => state.setDraft);

  async function submit() {
    const value = draft.trim();
    if (!value || isLoading) return;
    setDraft('');
    await onSubmit(value);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl px-gutter pb-6 pt-2">
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask follow up"
          disabled={isLoading}
          className="w-full bg-input-bg border border-border-subtle rounded-xl pl-11 pr-14 py-3.5 text-body-lg text-on-surface placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none shadow-sm disabled:opacity-60"
        />
        <div className="absolute right-3 flex items-center">
          <button
            type="submit"
            aria-label="Send"
            disabled={isLoading || !draft.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              arrow_upward
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
