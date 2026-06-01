import type { ChatMessage } from '@assistant/shared/chat';
import type { Turn } from '../../components/chat/MessageThread';

/**
 * Map server-persisted chat messages back into the `Turn` union the thread renders.
 *
 * Assistant turns keep `serverMessageId` so feedback (U6) works on restored answers,
 * and intentionally omit `status` since a restored answer is already finished (U4).
 */
export function messagesToTurns(messages: ChatMessage[]): Turn[] {
  return messages.map((message) => {
    if (message.role === 'user') {
      return { id: message.id, role: 'user', text: message.content };
    }
    return {
      id: message.id,
      role: 'assistant',
      body: message.content,
      related: message.citations,
      showFeedback: true,
      serverMessageId: message.id,
    };
  });
}
