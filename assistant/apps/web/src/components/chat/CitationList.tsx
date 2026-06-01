import type { Citation } from '@assistant/shared/citations';

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <h2>Citations</h2>
      <ul className="stack">
        {citations.map((citation, index) => (
          <li key={`${citation.sourcePath}-${index}`}>
            <strong>{citation.title}</strong>
            <div>{citation.sourcePath}</div>
            {citation.sectionHeading ? <div>{citation.sectionHeading}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
