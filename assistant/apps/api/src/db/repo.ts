import { asc, desc, eq } from 'drizzle-orm';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';
import type { ChatMessage, ConversationSummary } from '@assistant/shared/chat';
import type { ChatTrace } from '@assistant/shared/traces';
import { db } from './client';
import { conversations, messages, chatTraces, userFeedback } from './schema';
import { toConversationSummary, toMessageDto, toTraceDto } from './mappers';
import type { HistoryTurn } from '../agent/history';
import type { TraceSummary } from '../observability/trace';

export function deriveTitle(message: string): string {
  const t = message.trim().replace(/\s+/g, ' ');
  return t.length > 60 ? `${t.slice(0, 57)}...` : t || 'Cuộc trò chuyện';
}

export async function createConversation(title: string): Promise<string> {
  const [row] = await db.insert(conversations).values({ title }).returning({ id: conversations.id });
  return row!.id;
}

export async function conversationExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, id)).limit(1);
  return rows.length > 0;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const rows = await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  return rows.map(toConversationSummary);
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
  return rows.map(toMessageDto);
}

export async function getConversationTraces(conversationId: string): Promise<ChatTrace[]> {
  const rows = await db
    .select()
    .from(chatTraces)
    .where(eq(chatTraces.conversationId, conversationId))
    .orderBy(asc(chatTraces.createdAt));
  return rows.map(toTraceDto);
}

export async function getHistoryTurns(conversationId: string): Promise<HistoryTurn[]> {
  const rows = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
  return rows.map((r) => ({ role: r.role === 'assistant' ? 'assistant' : 'user', content: r.content }));
}

export interface AppendMessageInput {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  suggestions?: Suggestion[];
  traceId?: string;
}

export async function appendMessage(input: AppendMessageInput): Promise<string> {
  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      citationsJson: input.citations ?? null,
      suggestionsJson: input.suggestions ?? null,
      traceId: input.traceId ?? null,
    })
    .returning({ id: messages.id });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, input.conversationId));
  return row!.id;
}

export async function insertTrace(args: {
  conversationId: string;
  messageId?: string;
  summary: TraceSummary;
}): Promise<void> {
  const { conversationId, messageId, summary } = args;
  await db.insert(chatTraces).values({
    conversationId,
    messageId: messageId ?? null,
    intent: summary.intent ?? null,
    accessedDocsJson: summary.accessedDocs,
    toolCallsJson: summary.toolCalls,
    llmCallsJson: summary.llmCalls,
    citationCount: summary.citationCount,
    latencyMs: summary.latencyMs,
    status: summary.status,
    errorSummary: summary.errorSummary ?? null,
    regenerated: summary.regenerated,
  });
}

export async function messageExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, id)).limit(1);
  return rows.length > 0;
}

export async function insertFeedback(messageId: string, vote: 'up' | 'down'): Promise<void> {
  await db.insert(userFeedback).values({ messageId, vote });
}
