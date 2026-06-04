import { FormEvent } from "react";
import { useChatUiStore } from "../../stores/chatUiStore";

/** Hard cap mirrors the server-side per-message guardrail (MAX_INPUT_CHARS = 64000). */
const HARD_CHAR_LIMIT = 64000;
/** Soft threshold: show the live counter once the draft passes this length. */
const SOFT_CHAR_LIMIT = 50000;

interface ChatComposerProps {
  isLoading?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}

export function ChatComposer({
  isLoading = false,
  onSubmit,
}: ChatComposerProps) {
  const draft = useChatUiStore((state) => state.draft);
  const setDraft = useChatUiStore((state) => state.setDraft);
  const overLimit = draft.length > HARD_CHAR_LIMIT;
  const showCounter = draft.length >= SOFT_CHAR_LIMIT;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || isLoading || overLimit) return;
    setDraft("");
    await onSubmit(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-5 relative focus-within:border-forge-orange focus-within:ring-1 focus-within:ring-forge-orange transition-all shadow-sm"
    >
      <textarea
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Bạn muốn hỏi gì?"
        disabled={isLoading}
        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[18px] leading-7 text-on-surface resize-none min-h-[160px] p-0 disabled:opacity-60"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit(event as unknown as FormEvent);
          }
        }}
      />
      {showCounter ? (
        <div
          className={`absolute bottom-4 left-5 text-[11px] font-mono ${
            overLimit ? 'text-error' : 'text-text-muted'
          }`}
        >
          {draft.length.toLocaleString('vi-VN')} / {HARD_CHAR_LIMIT.toLocaleString('vi-VN')}
          {overLimit ? ' · quá dài, rút gọn' : null}
        </div>
      ) : null}
      <button
        type="submit"
        aria-label="Send"
        disabled={isLoading || !draft.trim() || overLimit}
        className="absolute bottom-4 right-4 text-forge-orange transition-transform active:scale-95 hover:bg-forge-orange/10 p-1 rounded-full disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">
          arrow_right_alt
        </span>
      </button>
    </form>
  );
}
