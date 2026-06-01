import type { ChatRequest } from '@assistant/shared/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function postChatMessage(input: ChatRequest): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function listConversations(): Promise<{ conversations: unknown[] }> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`);
  return response.json() as Promise<{ conversations: unknown[] }>;
}
