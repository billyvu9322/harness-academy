import { useState } from 'react';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';

interface ChatStreamState {
  isLoading: boolean;
  message: string;
  citations: Citation[];
  suggestions: Suggestion[];
  error: string | null;
  submit: (prompt: string) => Promise<void>;
}

export function useChatStream(): ChatStreamState {
  const [isLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function submit(prompt: string) {
    void prompt;
    setMessage('');
    setCitations([]);
    setSuggestions([]);
    setError('Chat behavior is not implemented yet. This is scaffold only.');
  }

  return {
    isLoading,
    message,
    citations,
    suggestions,
    error,
    submit,
  };
}
