import type { Citation } from '@assistant/shared/citations';

interface RelatedLinksProps {
  items: Citation[];
}

export function RelatedLinks({ items }: RelatedLinksProps) {
  if (items.length === 0) return null;
  const label = items.map((item) => item.title).join(' · ');
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      <div className="flex items-center gap-1.5 bg-surface-container-high border border-border-subtle px-3 py-1.5 rounded-full cursor-pointer hover:border-primary transition-colors">
        <span className="material-symbols-outlined text-[14px] text-text-muted">link</span>
        <span className="text-label-sm text-on-surface">Related: {label}</span>
      </div>
    </div>
  );
}
