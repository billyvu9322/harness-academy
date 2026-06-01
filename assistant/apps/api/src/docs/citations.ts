import type { Citation } from '@assistant/shared/citations';
import type { DocSection } from './search';

/** Build a UI citation from a resolved doc section. */
export function toCitation(section: DocSection): Citation {
  return {
    title: section.title,
    sourcePath: section.sourcePath,
    ...(section.route ? { route: section.route } : {}),
    ...(section.heading ? { sectionHeading: section.heading } : {}),
  };
}

/**
 * Build a deduped citation list from the sections an agent actually read.
 * Dedupe key is docId + heading; first appearance wins. This makes citations
 * provenance-based (only what was read), not model-claimed.
 */
export function buildCitations(reads: DocSection[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const section of reads) {
    const key = `${section.docId}::${section.heading ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(toCitation(section));
  }
  return out;
}
