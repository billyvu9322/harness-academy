import { useRef, useState } from 'react';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';
import type { Turn } from '../../components/chat/MessageThread';
import { postChatMessage } from './chatApi';
import { readSseStream } from '../../lib/sse';

interface ChatStreamState {
  isLoading: boolean;
  turns: Turn[];
  suggestions: Suggestion[];
  error: string | null;
  submit: (prompt: string) => Promise<void>;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function useChatStream(): ChatStreamState {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);

  async function submit(prompt: string) {
    setError(null);
    setSuggestions([]);
    setIsLoading(true);

    const userId = genId();
    const assistantId = genId();
    setTurns((prev) => [
      ...prev,
      { id: userId, role: 'user', text: prompt },
      { id: assistantId, role: 'assistant', body: '', related: [] },
    ]);

    let body = '';
    const related: Citation[] = [];
    const collectedSuggestions: Suggestion[] = [];

    const patchAssistant = (next: Partial<Extract<Turn, { role: 'assistant' }>>) => {
      setTurns((prev) =>
        prev.map((t) => (t.id === assistantId && t.role === 'assistant' ? { ...t, ...next } : t)),
      );
    };

    try {
      const response = await postChatMessage({
        message: prompt,
        mode: 'academy',
        ...(conversationId.current ? { conversationId: conversationId.current } : {}),
      });
      const cid = response.headers.get('X-Conversation-Id');
      if (cid) conversationId.current = cid;
      if (!response.ok || !response.body) throw new Error(`stream failed (${response.status})`);

      for await (const ev of readSseStream(response)) {
        switch (ev.type) {
          case 'message.delta':
            body += ev.delta;
            patchAssistant({ body });
            break;
          case 'citation':
            related.push(ev.citation);
            patchAssistant({ related: [...related] });
            break;
          case 'suggestion':
            collectedSuggestions.push(ev.suggestion);
            break;
          case 'error':
            setError(ev.message);
            break;
          case 'done':
            break;
          default:
            break;
        }
      }
      patchAssistant({ showFeedback: true });
      setSuggestions(collectedSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi khi gọi assistant.');
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, turns, suggestions, error, submit };
}
