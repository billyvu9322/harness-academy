import type { Citation } from '@assistant/shared/citations';

/** Collapse per-section citations to one entry per source doc (key = route ?? sourcePath). */
export function dedupeCitationsByDoc(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    const key = c.route ?? c.sourcePath;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** Build an absolute link into the academy app for a routed citation. */
export function academyHref(route: string, base: string): string {
  return `${base.replace(/\/$/, '')}${route}`;
}
