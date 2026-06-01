import type { AssistantContext } from '../agent/context';
import { buildCitations } from '../docs/citations';

export interface TraceSummary {
  intent?: string;
  accessedDocs: string[];
  toolCalls: string[];
  citationCount: number;
  latencyMs: number;
  status: 'ok' | 'error';
  errorSummary?: string;
  regenerated: boolean;
}

export interface BuildTraceArgs {
  context: Pick<AssistantContext, 'reads' | 'toolCalls'>;
  latencyMs: number;
  status: 'ok' | 'error';
  regenerated: boolean;
  intent?: string;
  error?: string;
}

/** Pure: derive a per-turn trace summary from run context + timing. */
export function buildTraceSummary(args: BuildTraceArgs): TraceSummary {
  const accessedDocs = [...new Set(args.context.reads.map((r) => r.docId))];
  return {
    intent: args.intent,
    accessedDocs,
    toolCalls: args.context.toolCalls,
    citationCount: buildCitations(args.context.reads).length,
    latencyMs: args.latencyMs,
    status: args.status,
    errorSummary: args.error,
    regenerated: args.regenerated,
  };
}
