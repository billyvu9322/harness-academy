import type { ReactNode } from 'react';
import type { Citation } from '@assistant/shared/citations';
import { RelatedLinks } from './RelatedLinks';
import { MessageFeedback } from './MessageFeedback';

interface AssistantMessageProps {
  id: string;
  body: ReactNode;
  related?: Citation[];
  showFeedback?: boolean;
  animationDelay?: string;
  onVote?: (messageId: string, vote: 'up' | 'down') => void;
}

export function AssistantMessage({
  id,
  body,
  related = [],
  showFeedback = true,
  animationDelay,
  onVote,
}: AssistantMessageProps) {
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
      <div className="bg-surface-container-low border border-border-subtle text-text-ai px-5 py-4 rounded-xl font-body-md leading-relaxed shadow-sm">
        {body}
      </div>
      <RelatedLinks items={related} />
      {showFeedback ? <MessageFeedback messageId={id} onVote={onVote} /> : null}
    </div>
  );
}
