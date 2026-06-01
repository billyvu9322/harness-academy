import { AssistantTopBar } from './AssistantTopBar';
import { AssistantStatusBar } from './AssistantStatusBar';
import { WelcomeView } from './WelcomeView';
import { MessageThread } from './MessageThread';
import { ChatFollowUpComposer } from './ChatFollowUpComposer';
import { SuggestionChips } from './SuggestionChips';
import { useChatStream } from '../../features/chat/useChatStream';

export function ChatPage() {
  const { isLoading, turns, suggestions, error, submit } = useChatStream();
  const inChat = turns.length > 0 || isLoading;

  return (
    <main className="flex flex-col relative h-screen overflow-hidden bg-surface text-on-background flex-1">
      <AssistantTopBar />
      {inChat ? (
        <>
          <MessageThread turns={turns} />
          <footer className="bg-surface flex flex-col items-center z-10">
            {suggestions.length > 0 && !isLoading ? (
              <div className="w-full max-w-2xl px-gutter pt-2">
                <SuggestionChips suggestions={suggestions} onSelect={submit} />
              </div>
            ) : null}
            <ChatFollowUpComposer isLoading={isLoading} onSubmit={submit} />
            <AssistantStatusBar variant="chat" />
          </footer>
        </>
      ) : (
        <>
          <WelcomeView isLoading={isLoading} onSubmit={submit} />
          <AssistantStatusBar variant="welcome" />
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
