import { AssistantTopBar } from "./AssistantTopBar";
import { WelcomeView } from "./WelcomeView";
import { MessageThread } from "./MessageThread";
import { ChatFollowUpComposer } from "./ChatFollowUpComposer";
import { SuggestionChips } from "./SuggestionChips";
import { useChatStream } from "../../features/chat/useChatStream";

interface ChatPageProps {
  /** Embedded widget: shows + wires the top-bar close button. Omitted in the standalone app. */
  onClose?: () => void;
  /** Embedded widget: a context chip ("Đang hỏi về: …") shown under the top bar. */
  contextLabel?: string;
}

export function ChatPage({ onClose, contextLabel }: ChatPageProps = {}) {
  const { isLoading, turns, suggestions, error, submit, vote, newChat } =
    useChatStream();
  const inChat = turns.length > 0 || isLoading;

  return (
    <main className="flex flex-col relative h-full overflow-hidden bg-surface text-on-background flex-1">
      <AssistantTopBar onClose={onClose} onNewChat={inChat ? newChat : undefined} />
      {contextLabel ? (
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-border-subtle text-[12px] text-text-muted truncate">
          Đang hỏi về:{" "}
          <span className="text-on-surface font-medium">{contextLabel}</span>
        </div>
      ) : null}
      {inChat ? (
        <>
          <MessageThread turns={turns} onVote={vote} />
          <footer className="bg-surface flex flex-col items-center z-10">
            {suggestions.length > 0 && !isLoading ? (
              <div className="w-full max-w-2xl px-gutter pt-2">
                <SuggestionChips suggestions={suggestions} onSelect={submit} />
              </div>
            ) : null}
            <ChatFollowUpComposer isLoading={isLoading} onSubmit={submit} />
          </footer>
        </>
      ) : (
        <>
          <WelcomeView isLoading={isLoading} onSubmit={submit} />
        </>
      )}
      {error ? (
        <div
          role="alert"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-[calc(100%-32px)] rounded-lg border border-error bg-surface-container-lowest text-error px-4 py-2 text-body-md shadow-md"
        >
          {error}
        </div>
      ) : null}
    </main>
  );
}
