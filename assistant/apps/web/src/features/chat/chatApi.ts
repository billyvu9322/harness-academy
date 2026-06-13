import type {
  ChatMessage,
  ChatRequest,
  ConversationSummary,
  FeedbackRequest,
} from '@assistant/shared/chat';
import type { ConversationTracesResponse } from '@assistant/shared/traces';
import { getApiBaseUrl } from '../../lib/runtimeConfig';

export async function postChatMessage(
  input: ChatRequest,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    signal,
  });
}

export async function postFeedback(messageId: string, vote: 'up' | 'down'): Promise<void> {
  const body: FeedbackRequest = { vote };
  const response = await fetch(`${getApiBaseUrl()}/api/messages/${messageId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`feedback failed (${response.status})`);
  }
}

export async function getConversationMessages(
  conversationId: string,
): Promise<{ conversationId: string; messages: ChatMessage[] }> {
  const response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error(`messages fetch failed (${response.status})`);
  }
  return response.json() as Promise<{ conversationId: string; messages: ChatMessage[] }>;
}

export async function getConversationTraces(
  conversationId: string,
): Promise<ConversationTracesResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/traces`);
  if (!response.ok) {
    throw new Error(`traces fetch failed (${response.status})`);
  }
  return response.json() as Promise<ConversationTracesResponse>;
}

export async function listConversations(): Promise<{ conversations: ConversationSummary[] }> {
  const response = await fetch(`${getApiBaseUrl()}/api/conversations`);
  if (!response.ok) {
    throw new Error(`conversations fetch failed (${response.status})`);
  }
  return response.json() as Promise<{ conversations: ConversationSummary[] }>;
}
