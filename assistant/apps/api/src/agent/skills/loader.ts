import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Skill {
  name: string;
  description: string;
  whenToUse?: string;
  /** Full markdown instruction body — only loaded into context via load_skill. */
  body: string;
}

/** The cheap part kept in the system prompt at all times. */
export interface SkillMeta {
  name: string;
  description: string;
  whenToUse?: string;
}

export type SkillRegistry = Map<string, Skill>;

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

/** Minimal single-line `key: value` frontmatter parser (quotes stripped). */
function parseFrontmatter(block: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (!m || m[1] === undefined || m[2] === undefined) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[m[1]] = val;
  }
  return meta;
}

/** Parse one SKILL.md file into a Skill, or null if it lacks a description. */
export function parseSkillFile(raw: string, fallbackName: string): Skill | null {
  const normalized = raw.replace(/\r\n?/g, '\n');
  const fm = normalized.match(FRONTMATTER_RE);
  const meta = fm?.[1] ? parseFrontmatter(fm[1]) : {};
  const body = fm ? normalized.slice(fm[0].length).trim() : normalized.trim();
  const description = meta.description;
  if (!description) return null;
  const skill: Skill = {
    name: meta.name ?? fallbackName,
    description,
    body,
  };
  if (meta.when_to_use) skill.whenToUse = meta.when_to_use;
  return skill;
}

/**
 * Read every `<root>/<dir>/SKILL.md`, parse it, and build the registry keyed by
 * skill name. Missing root → empty registry. Files without a description, or
 * unreadable files, are skipped (logged) so a bad skill never crashes boot.
 */
export function loadSkillRegistry(root: string): SkillRegistry {
  const registry: SkillRegistry = new Map();
  if (!existsSync(root)) return registry;

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(root, entry.name, 'SKILL.md');
    if (!existsSync(file)) continue;
    try {
      const skill = parseSkillFile(readFileSync(file, 'utf8'), entry.name);
      if (!skill) {
        console.warn(`[skills] skipped ${file}: missing description`);
        continue;
      }
      registry.set(skill.name, skill);
    } catch (err) {
      console.warn(`[skills] skipped ${file}:`, err);
    }
  }
  return registry;
}

/** Project the registry to the meta-only list injected into the system prompt. */
export function skillMetas(registry: SkillRegistry): SkillMeta[] {
  return [...registry.values()].map((s) => {
    const meta: SkillMeta = { name: s.name, description: s.description };
    if (s.whenToUse) meta.whenToUse = s.whenToUse;
    return meta;
  });
}
