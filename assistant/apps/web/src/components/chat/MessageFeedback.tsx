import { useState } from 'react';

interface MessageFeedbackProps {
  messageId: string;
  onVote?: (messageId: string, vote: 'up' | 'down') => void;
}

export function MessageFeedback({ messageId, onVote }: MessageFeedbackProps) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  function vote(value: 'up' | 'down') {
    setVoted(value);
    onVote?.(messageId, value);
  }

  return (
    <div className="flex items-center gap-4 mt-2 px-1">
      <span className="text-label-sm text-text-muted">Was this answer useful?</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Useful"
          aria-pressed={voted === 'up'}
          onClick={() => vote('up')}
          className={`material-symbols-outlined transition-colors text-[18px] bg-transparent border-0 p-0 cursor-pointer ${
            voted === 'up' ? 'text-primary' : 'text-text-muted hover:text-primary'
          }`}
        >
          thumb_up
        </button>
        <button
          type="button"
          aria-label="Not useful"
          aria-pressed={voted === 'down'}
          onClick={() => vote('down')}
          className={`material-symbols-outlined transition-colors text-[18px] bg-transparent border-0 p-0 cursor-pointer ${
            voted === 'down' ? 'text-primary' : 'text-text-muted hover:text-primary'
          }`}
        >
          thumb_down
        </button>
      </div>
    </div>
  );
}
