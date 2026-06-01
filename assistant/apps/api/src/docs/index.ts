import { readFileSync } from 'node:fs';
import { listSourceFiles, type ContentType, type SourceFile } from './sources';
import { parseMarkdown, type Frontmatter, type Section } from './parseMarkdown';

export interface DocEntry {
  /** Stable id = repo-relative path (unique). */
  docId: string;
  slug: string;
  title: string;
  description?: string;
  route?: string;
  contentType: ContentType;
  sourcePath: string;
  relPath: string;
  frontmatter: Frontmatter;
  sections: Section[];
}

export type DocIndex = DocEntry[];

export interface DocTocEntry {
  docId: string;
  slug: string;
  title: string;
  route?: string;
  contentType: ContentType;
  /** Heading outline (preamble excluded). */
  headings: string[];
}

function toEntry(file: SourceFile): DocEntry {
  const raw = readFileSync(file.sourcePath, 'utf8');
  const { frontmatter, sections } = parseMarkdown(raw);
  return {
    docId: file.relPath,
    slug: file.slug,
    title: frontmatter.title ?? file.slug,
    description: frontmatter.description,
    route: file.route,
    contentType: file.contentType,
    sourcePath: file.sourcePath,
    relPath: file.relPath,
    frontmatter,
    sections,
  };
}

/** Read + parse every allowlisted source into an in-memory index. */
export function buildDocIndex(repoRoot: string): DocIndex {
  return listSourceFiles(repoRoot).map(toEntry);
}

/** TOC view for the `list_docs` tool. Optionally filter by content type. */
export function listDocs(index: DocIndex, contentTypes?: ContentType[]): DocTocEntry[] {
  const filtered = contentTypes
    ? index.filter((d) => contentTypes.includes(d.contentType))
    : index;
  return filtered.map((d) => ({
    docId: d.docId,
    slug: d.slug,
    title: d.title,
    route: d.route,
    contentType: d.contentType,
    headings: d.sections.filter((s) => s.heading !== null).map((s) => s.heading as string),
  }));
}
