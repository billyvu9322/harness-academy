import type { Citation } from '@assistant/shared/citations';
import { dedupeCitationsByDoc, academyHref } from '../../lib/citations';

const ACADEMY_BASE = import.meta.env.VITE_ACADEMY_BASE_URL ?? 'http://localhost:5173';

interface RelatedLinksProps {
  items: Citation[];
}

const PILL =
  'flex items-center gap-1.5 bg-surface-container-high border border-border-subtle px-3 py-1.5 rounded-full text-label-sm text-on-surface transition-colors';

export function RelatedLinks({ items }: RelatedLinksProps) {
  if (items.length === 0) return null;
  const docs = dedupeCitationsByDoc(items);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <span className="text-label-sm text-text-muted">Related:</span>
      {docs.map((doc) => {
        const key = doc.route ?? doc.sourcePath;
        const inner = (
          <>
            <span className="material-symbols-outlined text-[14px] text-text-muted">link</span>
            <span>{doc.title}</span>
          </>
        );
        return doc.route ? (
          <a
            key={key}
            href={academyHref(doc.route, ACADEMY_BASE)}
            target="_blank"
            rel="noreferrer"
            className={`${PILL} cursor-pointer hover:border-primary hover:text-primary`}
          >
            {inner}
          </a>
        ) : (
          <span key={key} className={PILL} title={doc.sourcePath}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}
