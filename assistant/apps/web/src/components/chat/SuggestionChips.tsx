import type { Suggestion } from '@assistant/shared/suggestions';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (prompt: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <h2>Suggested next prompts</h2>
      <div className="chips">
        {suggestions.map((suggestion) => (
          <button key={suggestion.label} type="button" onClick={() => onSelect(suggestion.prompt)}>
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}
