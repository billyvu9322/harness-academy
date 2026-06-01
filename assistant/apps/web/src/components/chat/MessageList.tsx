interface MessageListProps {
  message: string;
  error: string | null;
}

export function MessageList({ message, error }: MessageListProps) {
  return (
    <section className="panel">
      <h2>Conversation</h2>
      {error ? <p className="error">{error}</p> : null}
      <div className="message-box">{message || 'No messages yet.'}</div>
    </section>
  );
}
