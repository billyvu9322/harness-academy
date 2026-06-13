import type { ChatMessage, ConversationSummary } from '@assistant/shared/chat';
import { citationSchema, type Citation } from '@assistant/shared/citations';
import { suggestionSchema, type Suggestion } from '@assistant/shared/suggestions';
import { llmCallTraceSchema, type ChatTrace } from '@assistant/shared/traces';
import { z } from 'zod';

const stringArraySchema = z.array(z.string());
const llmCallsJsonSchema = z.array(llmCallTraceSchema);
const citationsJsonSchema = z.array(citationSchema);
const suggestionsJsonSchema = z.array(suggestionSchema);

function parseStringArray(value: unknown): string[] {
  const parsed = stringArraySchema.safeParse(value ?? []);
  return parsed.success ? parsed.data : [];
}

function parseLlmCalls(value: unknown): ChatTrace['llmCalls'] {
  const parsed = llmCallsJsonSchema.safeParse(value ?? []);
  return parsed.success ? parsed.data : [];
}

function parseCitations(value: unknown): Citation[] {
  const parsed = citationsJsonSchema.safeParse(value ?? []);
  return parsed.success ? parsed.data : [];
}

function parseSuggestions(value: unknown): Suggestion[] {
  const parsed = suggestionsJsonSchema.safeParse(value ?? []);
  return parsed.success ? parsed.data : [];
}

export interface ConversationRow {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  citationsJson: unknown | null;
  suggestionsJson: unknown | null;
  traceId: string | null;
  createdAt: Date;
}

export interface TraceRow {
  id: string;
  conversationId: string;
  messageId: string | null | undefined;
  intent: string | null | undefined;
  accessedDocsJson: unknown | null | undefined;
  toolCallsJson: unknown | null | undefined;
  llmCallsJson: unknown | null | undefined;
  citationCount: number;
  latencyMs: number;
  status: string;
  errorSummary: string | null | undefined;
  regenerated: boolean;
  createdAt: Date;
}

export function toConversationSummary(row: ConversationRow): ConversationSummary {
  return { id: row.id, title: row.title, updatedAt: row.updatedAt.toISOString() };
}

export function toMessageDto(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    citations: parseCitations(row.citationsJson),
    suggestions: parseSuggestions(row.suggestionsJson),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toTraceDto(row: TraceRow): ChatTrace {
  return {
    id: row.id,
    messageId: row.messageId ?? null,
    accessedDocs: parseStringArray(row.accessedDocsJson),
    toolCalls: parseStringArray(row.toolCallsJson),
    llmCalls: parseLlmCalls(row.llmCallsJson),
    citationCount: row.citationCount,
    latencyMs: row.latencyMs,
    status: row.status === 'error' ? 'error' : 'ok',
    errorSummary: row.errorSummary ?? null,
    regenerated: row.regenerated,
    createdAt: row.createdAt.toISOString(),
  };
}
