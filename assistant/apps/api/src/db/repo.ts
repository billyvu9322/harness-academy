import { asc, desc, eq } from 'drizzle-orm';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';
import type { ChatMessage, ConversationSummary } from '@assistant/shared/chat';
import { db } from './client';
import { conversations, messages } from './schema';
import { toConversationSummary, toMessageDto } from './mappers';
import type { HistoryTurn } from '../agent/history';

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
