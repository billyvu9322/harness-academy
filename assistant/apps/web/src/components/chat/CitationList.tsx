import type { Citation } from '@assistant/shared/citations';

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="font-headline text-title-md text-on-surface mb-3">Citations</h2>
      <ul className="space-y-3">
        {citations.map((citation, index) => (
          <li
            key={`${citation.sourcePath}-${index}`}
            className="rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-md"
          >
            <strong className="block text-on-surface">{citation.title}</strong>
            <div className="text-text-muted text-[12px] font-mono uppercase tracking-widest mt-1">
              {citation.sourcePath}
            </div>
            {citation.sectionHeading ? (
              <div className="text-on-surface-variant text-[13px] mt-1">{citation.sectionHeading}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
