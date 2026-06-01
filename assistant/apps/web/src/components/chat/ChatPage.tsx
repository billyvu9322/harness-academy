import { ChatComposer } from './ChatComposer';
import { MessageList } from './MessageList';
import { CitationList } from './CitationList';
import { SuggestionChips } from './SuggestionChips';
import { useChatStream } from '../../features/chat/useChatStream';

export function ChatPage() {
  const { isLoading, message, citations, suggestions, error, submit } = useChatStream();

  return (
    <main className="page stack">
      <header className="panel hero">
        <h1>Harness Academy Assistant</h1>
        <p>Monorepo scaffold. API and UI shells only.</p>
      </header>
      <ChatComposer isLoading={isLoading} onSubmit={submit} />
      <MessageList message={message} error={error} />
      <CitationList citations={citations} />
      <SuggestionChips suggestions={suggestions} onSelect={(prompt) => void submit(prompt)} />
    </main>
  );
}
