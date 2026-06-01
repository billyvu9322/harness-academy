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
    <section className="w-full">
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-forge-label mb-3">
        Next prompts:
      </div>
      <div className="flex gap-3 flex-wrap">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSelect(suggestion.prompt)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface-variant text-[13px] font-medium rounded-lg whitespace-nowrap hover:bg-surface-container-high hover:text-forge-orange transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}
