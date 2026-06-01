import type { ReactNode } from 'react';
import type { Citation } from '@assistant/shared/citations';
import { RelatedLinks } from './RelatedLinks';
import { MessageFeedback } from './MessageFeedback';
import { AssistantToolStatus } from './AssistantToolStatus';
import { AgentTimeline } from './AgentTimeline';
import { Markdown } from './Markdown';
import type { TimelineStep } from '../../features/chat/agentEvent';

interface AssistantMessageProps {
  id: string;
  /** Server-assigned id used for feedback; absent until the stream reports it (U6). */
  serverMessageId?: string;
  body: ReactNode;
  related?: Citation[];
  showFeedback?: boolean;
  status?: string | null;
  /** Live agent timeline (U7); when it has steps we prefer it over the single-line tool status. */
  timeline?: TimelineStep[];
  timelineDone?: boolean;
  timelineDurationMs?: number;
  animationDelay?: string;
  onVote?: (messageId: string, vote: 'up' | 'down') => void;
}

export function AssistantMessage({
  serverMessageId,
  body,
  related = [],
  showFeedback = true,
  status,
  timeline,
  timelineDone = false,
  timelineDurationMs,
  animationDelay,
  onVote,
}: AssistantMessageProps) {
  const hasBody = typeof body === 'string' ? body.trim().length > 0 : body != null;
  // Once the timeline has any steps it supersedes the single-line tool status, so we
  // never show two live indicators at once. The status still covers the brief window
  // before the first event arrives.
  const hasTimeline = (timeline?.length ?? 0) > 0;
  return (
    <div
      className="flex flex-col gap-3 message-transition"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="flex items-center gap-2 text-primary">
        <span
          className="material-symbols-outlined text-[16px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="font-label-caps text-[11px] tracking-widest opacity-70 uppercase">Response</span>
      </div>
      {hasTimeline ? (
        <AgentTimeline steps={timeline ?? []} done={timelineDone} durationMs={timelineDurationMs} />
      ) : (
        <AssistantToolStatus label={status} />
      )}
      {hasBody ? (
        <div className="bg-surface-container-low border border-border-subtle text-text-ai px-5 py-4 rounded-xl font-body-md leading-relaxed shadow-sm">
          {typeof body === 'string' ? <Markdown content={body} /> : body}
        </div>
      ) : null}
      <RelatedLinks items={related} />
      {showFeedback && serverMessageId ? (
        <MessageFeedback messageId={serverMessageId} onVote={onVote} />
      ) : null}
    </div>
  );
}
