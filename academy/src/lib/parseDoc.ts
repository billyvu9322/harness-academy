export interface Doc {
  slug: string
  title: string
  description: string
  order?: number
  tags?: string[]
  duration?: string
  body: string
}

// Minimal YAML frontmatter parser (key: value lines only, no nesting).
export function parseDoc(slug: string, raw: string): Doc {
  // Normalize CRLF/CR line endings to LF. Without this, a trailing \r on each
  // frontmatter line breaks the per-line regex (`.` does not match \r, and `$`
  // without the `m` flag requires true end-of-input), so every value becomes
  // null and `title` silently falls back to `slug`.
  raw = raw.replace(/\r\n?/g, '\n')
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  let body = raw
  const meta: Record<string, string> = {}

  if (fmMatch) {
    body = raw.slice(fmMatch[0].length)
    const lines = fmMatch[1].split('\n')
    for (const line of lines) {
      const m = line.match(/^([\w-]+)\s*:\s*(.+)$/)
      if (!m) continue
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      meta[m[1]] = val
    }
  }

  const tags = meta.tags
    ? meta.tags
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    order: meta.order ? Number(meta.order) : undefined,
    duration: meta.duration,
    tags,
    body: body.trim(),
  }
}
