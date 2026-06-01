import type { ContentType } from './sources';
import type { DocEntry, DocIndex } from './index';

export interface GrepMatch {
  docId: string;
  title: string;
  route?: string;
  contentType: ContentType;
  heading: string | null;
  /** 1-based line number within the doc body. */
  lineNumber: number;
  /** The full matched line. */
  line: string;
}

export interface GrepOptions {
  contentTypes?: ContentType[];
  maxMatches?: number;
}

export interface DocSection {
  docId: string;
  title: string;
  route?: string;
  contentType: ContentType;
  /** Repo-relative source path (citation anchor). */
  sourcePath: string;
  heading: string | null;
  text: string;
}

const DEFAULT_MAX_MATCHES = 20;

/** Retrieval priority: academy content first, then the core harness doc, other notes, templates. */
function rank(entry: DocEntry): number {
  switch (entry.contentType) {
    case 'lecture':
    case 'project':
    case 'skill':
    case 'reference':
      return 0;
    case 'core_doc':
      return entry.slug === 'AI-Agent-Harness' ? 1 : 2;
    case 'template_doc':
      return 3;
    default:
      return 9;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compile(pattern: string): RegExp {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return new RegExp(escapeRegExp(pattern), 'i');
  }
}

/** Case-insensitive regex/keyword search over allowlisted doc sections, ranked by source priority. */
export function grepDocs(index: DocIndex, pattern: string, opts: GrepOptions = {}): GrepMatch[] {
  return grepDocsMulti(index, [pattern], opts);
}

/**
 * Like `grepDocs` but a line matches if ANY of the patterns hit (logical OR), in one ranked
 * pass. Used for bilingual recall: the grep tool expands a query into VN+EN variants
 * (see keywords.ts) and passes them all here. Each line is reported at most once even when
 * several patterns match it; global source-priority ranking is preserved.
 */
export function grepDocsMulti(index: DocIndex, patterns: string[], opts: GrepOptions = {}): GrepMatch[] {
  if (patterns.length === 0) return [];
  const res = patterns.map(compile);
  const maxMatches = opts.maxMatches ?? DEFAULT_MAX_MATCHES;
  const scope = opts.contentTypes
    ? index.filter((d) => opts.contentTypes!.includes(d.contentType))
    : index;

  const matches: { m: GrepMatch; r: number }[] = [];
  for (const entry of scope) {
    const r = rank(entry);
    for (const section of entry.sections) {
      const lines = section.text.split('\n');
      lines.forEach((line, i) => {
        if (!res.some((re) => re.test(line))) return;
        matches.push({
          r,
          m: {
            docId: entry.docId,
            title: entry.title,
            route: entry.route,
            contentType: entry.contentType,
            heading: section.heading,
            lineNumber: section.startLine + i,
            line: line.trim(),
          },
        });
      });
    }
  }

  // Stable sort by rank (Array.prototype.sort is stable in modern engines).
  matches.sort((a, b) => a.r - b.r);
  return matches.slice(0, maxMatches).map((x) => x.m);
}

/**
 * Return one doc section (or the whole body when `heading` is omitted) by docId.
 * Lookup is against the in-memory index only — an unknown/forged docId yields null,
 * so no arbitrary filesystem path can be read (path-traversal safe).
 */
export function readDocSection(
  index: DocIndex,
  docId: string,
  heading?: string,
): DocSection | null {
  const entry = index.find((d) => d.docId === docId);
  if (!entry) return null;

  const base = {
    docId: entry.docId,
    title: entry.title,
    route: entry.route,
    contentType: entry.contentType,
    sourcePath: entry.relPath,
  };

  if (heading === undefined) {
    return { ...base, heading: null, text: entry.sections.map((s) => s.text).join('\n\n') };
  }

  const section = entry.sections.find((s) => s.heading === heading);
  if (!section) return null;
  return { ...base, heading: section.heading, text: section.text };
}
