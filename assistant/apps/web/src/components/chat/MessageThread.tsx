import { Fragment, type ReactNode } from 'react';
import type { Citation } from '@assistant/shared/citations';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import type { TimelineStep } from '../../features/chat/agentEvent';

export type Turn =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      body: ReactNode;
      related?: Citation[];
      showFeedback?: boolean;
      /** Live docs-access/tool status while streaming; null when finished (U4). */
      status?: string | null;
      /** Server-assigned message id, captured from the stream; required to submit feedback (U6). */
      serverMessageId?: string;
      /** Live agent timeline accumulated from the stream (U7); absent on restored turns. */
      timeline?: TimelineStep[];
      /** True once the turn has finished, collapsing the timeline to a summary (U7). */
      timelineDone?: boolean;
      /** Wall-clock duration of the turn in ms, used for the "Done in Ns" summary (U7). */
      timelineDurationMs?: number;
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
                serverMessageId={turn.serverMessageId}
                body={turn.body}
                related={turn.related}
                showFeedback={turn.showFeedback}
                status={turn.status}
                timeline={turn.timeline}
                timelineDone={turn.timelineDone}
                timelineDurationMs={turn.timelineDurationMs}
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
