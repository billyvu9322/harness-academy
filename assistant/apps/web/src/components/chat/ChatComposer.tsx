import { useState } from 'react';

interface ChatComposerProps {
  isLoading: boolean;
  initialValue?: string;
  onSubmit: (value: string) => Promise<void> | void;
}

export function ChatComposer({ isLoading, initialValue = '', onSubmit }: ChatComposerProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="panel composer"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value.trim()) {
          return;
        }
        await onSubmit(value.trim());
      }}
    >
      <label htmlFor="prompt">Ask assistant</label>
      <textarea
        id="prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        placeholder="Ask about harness engineering materials..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Scaffold response' : 'Send'}
      </button>
    </form>
  );
}
