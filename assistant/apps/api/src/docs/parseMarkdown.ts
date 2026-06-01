export interface Frontmatter {
  title?: string;
  description?: string;
  order?: number;
  duration?: string;
  tags?: string[];
}

export interface Section {
  /** Heading text, or null for the preamble before the first heading. */
  heading: string | null;
  /** Markdown heading level (1-6), or 0 for the preamble. */
  level: number;
  /** Raw text of the section, including its own heading line. */
  text: string;
  /** 1-based line numbers within the body (after frontmatter is stripped). */
  startLine: number;
  endLine: number;
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  sections: Section[];
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

function parseFrontmatter(block: string): Frontmatter {
  const meta: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (key === undefined || val === undefined) continue;
    val = val.trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }

  const tags = meta.tags
    ? meta.tags
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    title: meta.title,
    description: meta.description,
    order: meta.order !== undefined ? Number(meta.order) : undefined,
    duration: meta.duration,
    tags,
  };
}

export function parseMarkdown(input: string): ParsedMarkdown {
  // Normalize CRLF/CR to LF so frontmatter + heading parsing is line-ending agnostic.
  const raw = input.replace(/\r\n?/g, '\n');
  const fmMatch = raw.match(FRONTMATTER_RE);
  const fmBlock = fmMatch?.[1];
  const frontmatter = fmBlock !== undefined ? parseFrontmatter(fmBlock) : {};
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

  const lines = body.split('\n');
  const sections: Section[] = [];

  // Boundaries: line indexes (0-based) where a heading starts.
  const boundaries: { idx: number; level: number; heading: string }[] = [];
  lines.forEach((line, idx) => {
    const m = line.match(HEADING_RE);
    if (!m) return;
    const hashes = m[1];
    const heading = m[2];
    if (hashes === undefined || heading === undefined) return;
    boundaries.push({ idx, level: hashes.length, heading });
  });

  const pushSection = (
    heading: string | null,
    level: number,
    startIdx: number,
    endIdx: number,
  ) => {
    const text = lines.slice(startIdx, endIdx + 1).join('\n').trim();
    if (heading === null && text === '') return; // skip empty preamble
    sections.push({
      heading,
      level,
      text,
      startLine: startIdx + 1,
      endLine: endIdx + 1,
    });
  };

  const firstBoundary = boundaries[0];
  const firstHeadingIdx = firstBoundary ? firstBoundary.idx : lines.length;

  // Preamble before the first heading.
  pushSection(null, 0, 0, firstHeadingIdx - 1);

  // Heading-scoped sections.
  boundaries.forEach((b, i) => {
    const next = boundaries[i + 1];
    const endIdx = (next ? next.idx : lines.length) - 1;
    pushSection(b.heading, b.level, b.idx, endIdx);
  });

  return { frontmatter, sections };
}
