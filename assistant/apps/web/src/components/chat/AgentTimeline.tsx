import { useState } from 'react';
import type { TimelineStep } from '../../features/chat/agentEvent';

interface AgentTimelineProps {
  steps: TimelineStep[];
  done: boolean;
  durationMs?: number;
}

/** A small running pulse / done check indicator for a single timeline row. */
function StepIndicator({ status }: { status: TimelineStep['status'] }) {
  if (status === 'running') {
    return (
      <span
        className="inline-block w-2 h-2 rounded-full bg-forge-orange animate-pulse shrink-0"
        aria-hidden
      />
    );
  }
  return (
    <span className="material-symbols-outlined text-[14px] text-text-muted shrink-0" aria-hidden>
      check
    </span>
  );
}

/** One row: indicator + label, with muted detail and result when present. */
function StepRow({ step }: { step: TimelineStep }) {
  return (
    <li className="flex items-center gap-2 text-[12px] font-mono">
      <StepIndicator status={step.status} />
      <span className="text-text-ai">{step.label}</span>
      {step.detail ? <span className="text-text-muted truncate">· {step.detail}</span> : null}
      {step.result ? <span className="text-text-muted truncate">· {step.result}</span> : null}
    </li>
  );
}

function StepList({ steps }: { steps: TimelineStep[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {steps.map((step) => (
        <StepRow key={step.id} step={step} />
      ))}
    </ul>
  );
}

/**
 * Live agent timeline (U7). While streaming it shows the step list; once done it
 * collapses to a one-line "Done in Ns · k steps" summary that expands on click.
 */
export function AgentTimeline({ steps, done, durationMs }: AgentTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  if (!done) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-1.5">
        <StepList steps={steps} />
      </div>
    );
  }

  const seconds = typeof durationMs === 'number' ? Math.max(0, Math.round(durationMs / 1000)) : null;
  const summary =
    seconds !== null
      ? `Done in ${seconds}s · ${steps.length} steps`
      : `Done · ${steps.length} steps`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 text-[12px] font-mono text-text-muted hover:text-text-ai transition-colors self-start"
      >
        <span
          className="material-symbols-outlined text-[14px]"
          style={{ transform: expanded ? 'rotate(90deg)' : undefined }}
          aria-hidden
        >
          chevron_right
        </span>
        <span>{summary}</span>
      </button>
      {expanded ? <StepList steps={steps} /> : null}
    </div>
  );
}
