import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

export type ContentType =
  | 'lecture'
  | 'project'
  | 'skill'
  | 'reference'
  | 'core_doc'
  | 'template_doc';

export interface SourceFile {
  /** Absolute path on disk. */
  sourcePath: string;
  /** Path relative to repo root, POSIX separators. */
  relPath: string;
  contentType: ContentType;
  /** Filename without the .md extension. */
  slug: string;
  /** Academy route, e.g. /lectures/01-intro. Undefined for non-routed docs. */
  route?: string;
}

type Spec =
  | { kind: 'dir'; dir: string; contentType: ContentType; routeBase?: string }
  | { kind: 'file'; path: string; contentType: ContentType };

/** Fixed allowlist of indexable sources. Anything not listed here is never read. */
const SPECS: Spec[] = [
  { kind: 'dir', dir: 'academy/content/lectures', contentType: 'lecture', routeBase: '/lectures' },
  { kind: 'dir', dir: 'academy/content/projects', contentType: 'project', routeBase: '/projects' },
  { kind: 'dir', dir: 'academy/content/skills', contentType: 'skill', routeBase: '/skills' },
  { kind: 'dir', dir: 'academy/content/references', contentType: 'reference', routeBase: '/references' },
  { kind: 'dir', dir: 'docs', contentType: 'core_doc' }, // includes docs/AI-Agent-Harness.md (top-level only)
  { kind: 'file', path: 'templates/automation-test-harness-experimental/README.md', contentType: 'template_doc' },
  { kind: 'file', path: 'templates/automation-test-harness-experimental/AGENTS.md', contentType: 'template_doc' },
  { kind: 'file', path: 'templates/automation-test-harness-experimental/CLAUDE.md', contentType: 'template_doc' },
  { kind: 'file', path: 'templates/automation-test-harness-experimental/Template.md', contentType: 'template_doc' },
];

function toRel(repoRoot: string, abs: string): string {
  return relative(repoRoot, abs).split(sep).join('/');
}

function makeFile(repoRoot: string, abs: string, contentType: ContentType, routeBase?: string): SourceFile {
  const slug = basename(abs).replace(/\.md$/, '');
  return {
    sourcePath: abs,
    relPath: toRel(repoRoot, abs),
    contentType,
    slug,
    route: routeBase ? `${routeBase}/${slug}` : undefined,
  };
}

/** Enumerate every allowlisted markdown source under `repoRoot`. Non-recursive per directory. */
export function listSourceFiles(repoRoot: string): SourceFile[] {
  const out: SourceFile[] = [];
  for (const spec of SPECS) {
    if (spec.kind === 'file') {
      const abs = join(repoRoot, spec.path);
      if (existsSync(abs) && statSync(abs).isFile()) {
        out.push(makeFile(repoRoot, abs, spec.contentType));
      }
      continue;
    }
    const dirAbs = join(repoRoot, spec.dir);
    if (!existsSync(dirAbs) || !statSync(dirAbs).isDirectory()) continue;
    for (const name of readdirSync(dirAbs)) {
      if (!name.endsWith('.md')) continue;
      const abs = join(dirAbs, name);
      if (!statSync(abs).isFile()) continue; // non-recursive: skip subdirs
      out.push(makeFile(repoRoot, abs, spec.contentType, spec.routeBase));
    }
  }
  return out;
}
