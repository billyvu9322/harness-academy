// Auto-glob all markdown content as raw strings.
// Vite import.meta.glob with `as: 'raw'` returns string content.
import { parseDoc, type Doc } from '@/lib/parseDoc'

const lectureFiles = import.meta.glob('/content/lectures/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const projectFiles = import.meta.glob('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const skillFiles = import.meta.glob('/content/skills/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const referenceFiles = import.meta.glob('/content/references/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function buildCollection(files: Record<string, string>): Doc[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const filename = path.split('/').pop()!.replace(/\.md$/, '')
      return parseDoc(filename, raw)
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export const lectures = buildCollection(lectureFiles)
export const projects = buildCollection(projectFiles)
export const skills = buildCollection(skillFiles)
export const references = buildCollection(referenceFiles)

export type { Doc }
