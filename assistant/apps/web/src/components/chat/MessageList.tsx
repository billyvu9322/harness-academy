interface MessageListProps {
  message: string;
  error: string | null;
}

export function MessageList({ message, error }: MessageListProps) {
  return (
    <section className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="font-headline text-title-md text-on-surface mb-3">Conversation</h2>
      {error ? <p className="text-error text-body-md mb-3">{error}</p> : null}
      <div className="min-h-[96px] whitespace-pre-wrap rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-md text-on-surface">
        {message || 'No messages yet.'}
      </div>
    </section>
  );
}
