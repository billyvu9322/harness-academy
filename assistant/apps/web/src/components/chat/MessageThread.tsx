import { Fragment, type ReactNode } from 'react';
import type { Citation } from '@assistant/shared/citations';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

export type Turn =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      body: ReactNode;
      related?: Citation[];
      showFeedback?: boolean;
    };

interface MessageThreadProps {
  turns: Turn[];
  onVote?: (messageId: string, vote: 'up' | 'down') => void;
}

function delayFor(index: number): string | undefined {
  if (index === 0) return undefined;
  const seconds = Math.min(index * 0.1, 0.3);
  return `${seconds}s`;
}

export function MessageThread({ turns, onVote }: MessageThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-2xl px-gutter py-8 flex flex-col gap-8">
        {turns.map((turn, index) => (
          <Fragment key={turn.id}>
            {turn.role === 'user' ? (
              <UserMessage text={turn.text} animationDelay={delayFor(index)} />
            ) : (
              <AssistantMessage
                id={turn.id}
                body={turn.body}
                related={turn.related}
                showFeedback={turn.showFeedback}
                animationDelay={delayFor(index)}
                onVote={onVote}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
