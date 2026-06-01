import type { ChatMessage, ConversationSummary } from '@assistant/shared/chat';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';

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
  citationsJson: Citation[] | null;
  suggestionsJson: Suggestion[] | null;
  traceId: string | null;
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
    citations: row.citationsJson ?? [],
    suggestions: row.suggestionsJson ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}
