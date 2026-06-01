interface WelcomeExamplesProps {
  onPick: (prompt: string) => void;
}

const CATEGORIES = ['AGENTS.md', 'State Mgmt', 'Verification', 'Init Phase'] as const;

const QUESTIONS = [
  'What is a harness and why does it matter for AI agents?',
  'How do I design init.sh for multi-session continuity?',
  "What's the difference between feature_list.json and AGENTS.md?",
] as const;

export function WelcomeExamples({ onPick }: WelcomeExamplesProps) {
  return (
    <div className="w-full">
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-forge-label mb-4">
        Examples:
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
        {CATEGORIES.map((category, index) => {
          const active = index === 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onPick(`Explain ${category}`)}
              className={
                active
                  ? 'flex items-center gap-2 px-4 py-2 bg-forge-orange text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-sm'
                  : 'flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface-variant text-[13px] font-medium rounded-lg whitespace-nowrap hover:bg-surface-container-high transition-colors'
              }
            >
              {category}
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        {QUESTIONS.map((question) => (
          <p
            key={question}
            onClick={() => onPick(question)}
            className="text-forge-text text-[14px] leading-[1.6] cursor-pointer hover:text-forge-orange hover:underline transition-colors font-medium"
          >
            {question}
          </p>
        ))}
      </div>
    </div>
  );
}
