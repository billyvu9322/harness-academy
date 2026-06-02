interface WelcomeExamplesProps {
  onPick: (prompt: string) => void;
}

const CATEGORIES = [
  { label: 'AGENTS.md', prompt: 'AGENTS.md là gì và dùng để làm gì?' },
  { label: 'Quản lý state', prompt: 'Agent quản lý state giữa các session như thế nào?' },
  { label: 'Verification', prompt: 'Verification gate là gì?' },
  { label: 'Init phase', prompt: 'Init phase trong harness là gì?' },
] as const;

const QUESTIONS = [
  'Harness là gì và vì sao quan trọng với AI agent?',
  'Làm sao thiết kế init.sh để giữ continuity qua nhiều session?',
  'feature_list.json khác AGENTS.md ở điểm nào?',
] as const;

export function WelcomeExamples({ onPick }: WelcomeExamplesProps) {
  return (
    <div className="w-full">
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-forge-label mb-4">
        Gợi ý:
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
        {CATEGORIES.map((category, index) => {
          const active = index === 0;
          return (
            <button
              key={category.label}
              type="button"
              onClick={() => onPick(category.prompt)}
              className={
                active
                  ? 'flex items-center gap-2 px-4 py-2 bg-forge-orange text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-sm'
                  : 'flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface-variant text-[13px] font-medium rounded-lg whitespace-nowrap hover:bg-surface-container-high transition-colors'
              }
            >
              {category.label}
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
