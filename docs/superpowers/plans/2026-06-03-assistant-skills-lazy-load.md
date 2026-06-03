# Assistant Skills Lazy-Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Claude-Code-style lazy-loaded "skills" to the Assistant agent — only skill name+description sit in the system prompt; the model pulls a skill's full body on demand via a `load_skill` tool.

**Architecture:** A boot-time loader parses `SKILL.md` files into an in-memory registry. `createAssistant` closes over that registry: `buildSystemPrompt` injects a meta-only block (name+description), and a `load_skill` tool returns a skill's full body when called, recording it on `AssistantContext.loadedSkills`. The streaming path inherits this for free (shared orchestrator).

**Tech Stack:** TypeScript, `@openai/agents` (`tool`, zod), Fastify, Vitest. Run all commands from `assistant/apps/api`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `assistant/apps/api/src/agent/skills/loader.ts` | Read `SKILLS_ROOT`, parse each `SKILL.md`, build `SkillRegistry`. Own minimal single-line frontmatter parser. |
| `assistant/apps/api/src/agent/skills/loader.test.ts` | Loader unit tests against committed fixtures. |
| `assistant/apps/api/src/agent/skills/__fixtures__/good/SKILL.md` | Valid fixture skill. |
| `assistant/apps/api/src/agent/skills/__fixtures__/broken/SKILL.md` | Malformed fixture (no description) — must be skipped. |
| `assistant/apps/api/src/agent/skills/loadSkillTool.ts` | `load_skill` tool factory over a registry. |
| `assistant/apps/api/src/agent/skills/loadSkillTool.test.ts` | Tool unit tests. |
| `assistant/apps/api/src/agent/context.ts` | Add `loadedSkills: string[]`. |
| `assistant/apps/api/src/agent/prompts.ts` | Add `skills?` option + meta-only block. |
| `assistant/apps/api/src/agent/prompts.test.ts` | Assert names+descriptions present, bodies absent (lazy contract). |
| `assistant/apps/api/src/config/env.ts` | Add `SKILLS_ROOT` (default `<cwd>/skills`). |
| `assistant/apps/api/src/agent/harnessAssistant.ts` | Wire registry → instructions + `load_skill` tool. |
| `assistant/apps/api/skills/concept-explainer/SKILL.md` | Real skill content. |
| `assistant/apps/api/skills/harness-blueprint-guide/SKILL.md` | Real skill content. |

---

## Task 1: Add `loadedSkills` to AssistantContext

**Files:**
- Modify: `assistant/apps/api/src/agent/context.ts`

- [ ] **Step 1: Add the field to the interface**

In `AssistantContext`, after `toolCalls`:

```ts
  /** Skill names loaded this run via load_skill — for observability. */
  loadedSkills: string[];
```

- [ ] **Step 2: Initialize it in the factory**

In `createAssistantContext`'s returned object, after `toolCalls: [],`:

```ts
    loadedSkills: [],
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add assistant/apps/api/src/agent/context.ts
git commit -m "feat(assistant): track loadedSkills on AssistantContext"
```

---

## Task 2: Skill loader

**Files:**
- Create: `assistant/apps/api/src/agent/skills/__fixtures__/good/SKILL.md`
- Create: `assistant/apps/api/src/agent/skills/__fixtures__/broken/SKILL.md`
- Create: `assistant/apps/api/src/agent/skills/loader.ts`
- Test: `assistant/apps/api/src/agent/skills/loader.test.ts`

- [ ] **Step 1: Create the valid fixture**

`assistant/apps/api/src/agent/skills/__fixtures__/good/SKILL.md`:

```markdown
---
name: fixture-skill
description: A fixture skill used by loader tests.
when_to_use: When the loader test runs.
---

# Fixture body

SECRET_BODY_MARKER do work here.
```

- [ ] **Step 2: Create the malformed fixture (no description)**

`assistant/apps/api/src/agent/skills/__fixtures__/broken/SKILL.md`:

```markdown
---
name: broken-skill
---

# No description in frontmatter, must be skipped.
```

- [ ] **Step 3: Write the failing test**

`assistant/apps/api/src/agent/skills/loader.test.ts`:

```ts
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadSkillRegistry, skillMetas } from './loader';

const FIXTURES = resolve(__dirname, '__fixtures__');

describe('loadSkillRegistry', () => {
  test('parses a valid SKILL.md into the registry', () => {
    const reg = loadSkillRegistry(FIXTURES);
    const skill = reg.get('fixture-skill');
    expect(skill).toBeDefined();
    expect(skill!.description).toBe('A fixture skill used by loader tests.');
    expect(skill!.whenToUse).toBe('When the loader test runs.');
    expect(skill!.body).toContain('SECRET_BODY_MARKER');
  });

  test('skips a skill with no description (does not throw)', () => {
    const reg = loadSkillRegistry(FIXTURES);
    expect(reg.has('broken-skill')).toBe(false);
  });

  test('returns an empty registry for a missing root', () => {
    const reg = loadSkillRegistry(resolve(FIXTURES, 'does-not-exist'));
    expect(reg.size).toBe(0);
  });

  test('skillMetas returns name + description + whenToUse only (no body)', () => {
    const metas = skillMetas(loadSkillRegistry(FIXTURES));
    const meta = metas.find((m) => m.name === 'fixture-skill');
    expect(meta).toEqual({
      name: 'fixture-skill',
      description: 'A fixture skill used by loader tests.',
      whenToUse: 'When the loader test runs.',
    });
    expect(JSON.stringify(metas)).not.toContain('SECRET_BODY_MARKER');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run loader`
Expected: FAIL — `Cannot find module './loader'`.

- [ ] **Step 5: Implement the loader**

`assistant/apps/api/src/agent/skills/loader.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run loader`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add assistant/apps/api/src/agent/skills/loader.ts assistant/apps/api/src/agent/skills/loader.test.ts assistant/apps/api/src/agent/skills/__fixtures__
git commit -m "feat(assistant): skill loader + registry (frontmatter parse)"
```

---

## Task 3: `load_skill` tool

**Files:**
- Create: `assistant/apps/api/src/agent/skills/loadSkillTool.ts`
- Test: `assistant/apps/api/src/agent/skills/loadSkillTool.test.ts`

- [ ] **Step 1: Write the failing test**

`assistant/apps/api/src/agent/skills/loadSkillTool.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { resolveLoadSkill } from './loadSkillTool';
import type { SkillRegistry } from './loader';
import { createAssistantContext } from '../context';

function registry(): SkillRegistry {
  return new Map([
    ['demo', { name: 'demo', description: 'd', body: 'BODY_TEXT' }],
  ]);
}

describe('resolveLoadSkill', () => {
  test('returns the body and records the name for a known skill', () => {
    const ctx = createAssistantContext();
    const out = resolveLoadSkill(registry(), 'demo', ctx);
    expect(out).toEqual({ found: true, name: 'demo', body: 'BODY_TEXT' });
    expect(ctx.loadedSkills).toEqual(['demo']);
  });

  test('returns found:false + available names for an unknown skill', () => {
    const ctx = createAssistantContext();
    const out = resolveLoadSkill(registry(), 'nope', ctx);
    expect(out).toEqual({ found: false, available: ['demo'] });
    expect(ctx.loadedSkills).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run loadSkillTool`
Expected: FAIL — `Cannot find module './loadSkillTool'`.

- [ ] **Step 3: Implement the tool**

`assistant/apps/api/src/agent/skills/loadSkillTool.ts`:

```ts
import { tool } from '@openai/agents';
import { z } from 'zod';
import type { AssistantContext } from '../context';
import type { SkillRegistry } from './loader';

export type LoadSkillResult =
  | { found: true; name: string; body: string }
  | { found: false; available: string[] };

/** Pure resolver — looked up by name, records the load on context. Unit-tested directly. */
export function resolveLoadSkill(
  registry: SkillRegistry,
  name: string,
  context: AssistantContext | undefined,
): LoadSkillResult {
  const skill = registry.get(name);
  if (!skill) return { found: false, available: [...registry.keys()] };
  context?.loadedSkills?.push(skill.name);
  return { found: true, name: skill.name, body: skill.body };
}

/** Build the SDK tool over a registry. */
export function createLoadSkillTool(registry: SkillRegistry) {
  return tool({
    name: 'load_skill',
    description:
      'Nạp hướng dẫn chi tiết của một skill theo tên (tên lấy từ danh sách KỸ NĂNG trong system prompt). Gọi TRƯỚC khi trả lời khi câu hỏi khớp một skill.',
    parameters: z.object({
      name: z.string().describe('Tên skill cần nạp, đúng như trong danh sách KỸ NĂNG.'),
    }),
    execute: async ({ name }, runContext) =>
      resolveLoadSkill(registry, name, runContext?.context as AssistantContext | undefined),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run loadSkillTool`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add assistant/apps/api/src/agent/skills/loadSkillTool.ts assistant/apps/api/src/agent/skills/loadSkillTool.test.ts
git commit -m "feat(assistant): load_skill tool (progressive disclosure)"
```

---

## Task 4: Inject skill meta into the system prompt

**Files:**
- Modify: `assistant/apps/api/src/agent/prompts.ts`
- Test: `assistant/apps/api/src/agent/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `assistant/apps/api/src/agent/prompts.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt skills block', () => {
  const skills = [
    { name: 'concept-explainer', description: 'Giải thích khái niệm.', whenToUse: 'Hỏi "là gì".' },
  ];

  test('includes skill name + description and the load_skill directive', () => {
    const p = buildSystemPrompt({ skills });
    expect(p).toContain('concept-explainer');
    expect(p).toContain('Giải thích khái niệm.');
    expect(p).toContain('load_skill');
  });

  test('omits the skills block entirely when there are no skills', () => {
    const p = buildSystemPrompt({ skills: [] });
    expect(p).not.toContain('load_skill');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run prompts`
Expected: FAIL — prompt has no `load_skill` text.

- [ ] **Step 3: Implement the block**

In `assistant/apps/api/src/agent/prompts.ts`:

Add the import at the top:

```ts
import type { SkillMeta } from './skills/loader';
```

Add to `PromptOptions`:

```ts
  /** Meta-only skill list (name + description). Bodies are loaded lazily via load_skill. */
  skills?: SkillMeta[];
```

Add this helper above `buildSystemPrompt`:

```ts
function buildSkillsBlock(skills: SkillMeta[]): string {
  const lines = skills.map(
    (s) => `- ${s.name}: ${s.description}${s.whenToUse ? ` (${s.whenToUse})` : ''}`,
  );
  return [
    'KỸ NĂNG CHUYÊN BIỆT (skills) — chỉ nạp khi cần:',
    'Khi câu hỏi khớp mô tả một skill dưới đây, GỌI tool `load_skill` với đúng tên skill để nạp hướng dẫn chi tiết TRƯỚC khi trả lời. Không đoán nội dung skill khi chưa nạp.',
    ...lines,
  ].join('\n');
}
```

In `buildSystemPrompt`'s returned array, add as the final spread (after the corrective line):

```ts
    ...(opts.skills && opts.skills.length ? ['', buildSkillsBlock(opts.skills)] : []),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run prompts`
Expected: PASS (2 tests). This proves the lazy contract — only meta is in the prompt.

- [ ] **Step 5: Commit**

```bash
git add assistant/apps/api/src/agent/prompts.ts assistant/apps/api/src/agent/prompts.test.ts
git commit -m "feat(assistant): inject skill meta block into system prompt"
```

---

## Task 5: `SKILLS_ROOT` env

**Files:**
- Modify: `assistant/apps/api/src/config/env.ts`

- [ ] **Step 1: Add to the zod schema**

In `envSchema`, after the `DOCS_ROOT` block:

```ts
  // Root holding skill packets (<root>/<name>/SKILL.md). Defaults to apps/api/skills.
  SKILLS_ROOT: z.string().min(1).default(resolve(process.cwd(), 'skills')),
```

- [ ] **Step 2: Pass it through `parseEnv`**

In the object returned by `parseEnv`, after `DOCS_ROOT: env.DOCS_ROOT,`:

```ts
    SKILLS_ROOT: env.SKILLS_ROOT,
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add assistant/apps/api/src/config/env.ts
git commit -m "feat(assistant): SKILLS_ROOT env (default apps/api/skills)"
```

---

## Task 6: Wire registry into the orchestrator

**Files:**
- Modify: `assistant/apps/api/src/agent/harnessAssistant.ts`

- [ ] **Step 1: Add imports**

After the existing `./guardrails` import:

```ts
import { loadSkillRegistry, skillMetas } from "./skills/loader";
import { createLoadSkillTool } from "./skills/loadSkillTool";
```

- [ ] **Step 2: Build the registry inside `createAssistant`**

At the top of `createAssistant`, before `const orchestrator = ...`:

```ts
  const skillRegistry = loadSkillRegistry(env.SKILLS_ROOT);
  const skills = skillMetas(skillRegistry);
```

- [ ] **Step 3: Pass skill meta to the prompt**

In the orchestrator's `instructions` callback, add `skills` to the `buildSystemPrompt` argument:

```ts
    instructions: (rc) =>
      buildSystemPrompt({
        userLanguage: rc.context?.userLanguage,
        mode: rc.context?.mode,
        skills,
      }),
```

- [ ] **Step 4: Register the tool**

In the orchestrator `tools` array, after `harnessBlueprintTool,`:

```ts
      createLoadSkillTool(skillRegistry),
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add assistant/apps/api/src/agent/harnessAssistant.ts
git commit -m "feat(assistant): wire skill registry into orchestrator (instructions + load_skill)"
```

---

## Task 7: Author the two real skills

**Files:**
- Create: `assistant/apps/api/skills/concept-explainer/SKILL.md`
- Create: `assistant/apps/api/skills/harness-blueprint-guide/SKILL.md`

> Frontmatter `description` MUST be a single line (loader parses single-line values).

- [ ] **Step 1: concept-explainer**

`assistant/apps/api/skills/concept-explainer/SKILL.md`:

```markdown
---
name: concept-explainer
description: Khung giải thích một khái niệm harness cho người mới. Dùng khi người dùng hỏi "X là gì", "giải thích X", hoặc cần hiểu một khái niệm nền tảng.
when_to_use: Câu hỏi định nghĩa / "là gì" / "giải thích".
---

# Concept Explainer

Khi giải thích một khái niệm harness engineering, theo cấu trúc sau (vẫn tuân thủ quy tắc grounding — mọi khẳng định phải có trong đoạn đã `read_doc_section`):

1. **Định nghĩa ngắn** — một câu, đúng theo tài liệu nội bộ.
2. **Vì sao quan trọng** — vai trò của nó trong harness/agent loop.
3. **Ví dụ cụ thể** — ưu tiên ví dụ có sẵn trong corpus; nếu không có, nói rõ.
4. **Liên hệ academy** — trỏ tới lecture/project/skill liên quan kèm route.
5. **Cạm bẫy thường gặp** — nếu tài liệu có đề cập.

Giữ ngắn gọn, có cấu trúc. Trích dẫn nguồn cho mỗi khẳng định thực tế.
```

- [ ] **Step 2: harness-blueprint-guide**

`assistant/apps/api/skills/harness-blueprint-guide/SKILL.md`:

```markdown
---
name: harness-blueprint-guide
description: Hướng dẫn chi tiết cách điền từng primitive khi thiết kế harness cho một workflow. Dùng khi người dùng muốn thiết kế/dựng harness cho một quy trình nghiệp vụ.
when_to_use: Yêu cầu thiết kế harness / dựng khung cho một workflow.
---

# Harness Blueprint Guide

Khi thiết kế harness cho một workflow, lấp đầy từng primitive dưới đây từ tài liệu nội bộ (gọi `harness_blueprint` để lấy skeleton, rồi grep + read trước khi khẳng định):

1. **Goals** — kết quả mong muốn + định nghĩa "done" có thể kiểm chứng.
2. **Feature list** — các năng lực rời rạc agent cần; chia nhỏ tới mức test được.
3. **Tools** — mỗi tool: mục đích, input/output, có cần phê duyệt không.
4. **Verification gates** — kiểm tra tự động giữa các bước; không qua gate thì không tiến.
5. **Loops** — vòng tự sửa (generate → verify → regenerate), có giới hạn lần lặp.
6. **Orchestrator / sub-agents** — khi nào tách context, ai sở hữu synthesis.
7. **Clean state** — reset giữa các lần chạy để tránh rò rỉ trạng thái.

Với mỗi primitive: nêu lựa chọn cụ thể cho workflow đó + trích nguồn nội bộ. Nếu corpus thiếu, nói rõ là suy luận, không bịa.
```

- [ ] **Step 3: Commit**

```bash
git add assistant/apps/api/skills/concept-explainer/SKILL.md assistant/apps/api/skills/harness-blueprint-guide/SKILL.md
git commit -m "feat(assistant): add concept-explainer + harness-blueprint-guide skills"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full API test suite**

Run (from `assistant/apps/api`): `npx vitest run`
Expected: all tests pass, including `loader`, `loadSkillTool`, `prompts`.

- [ ] **Step 2: Typecheck the whole API package**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0.

- [ ] **Step 3: Prove lazy-load against the real skills dir (manual probe)**

Run from `assistant/apps/api`:

```bash
node --import tsx -e "import('./src/agent/skills/loader.ts').then(m=>{const r=m.loadSkillRegistry(require('path').resolve(process.cwd(),'skills'));console.log('skills:', [...r.keys()]);console.log('metas:', JSON.stringify(m.skillMetas(r)));})"
```

Expected: prints `skills: [ 'concept-explainer', 'harness-blueprint-guide' ]` and metas JSON that does **not** contain any skill body text — confirming only name+description are projected for the prompt.

- [ ] **Step 4: Final commit (if any uncommitted verification fixups)**

```bash
git add -A
git commit -m "test(assistant): verify skills lazy-load end to end" || echo "nothing to commit"
```

---

## Self-Review

- **Spec coverage:** loader (Task 2), load_skill tool (Task 3), prompt meta block + lazy assertion (Task 4), SKILLS_ROOT (Task 5), orchestrator wiring (Task 6), 2 skills (Task 7), context.loadedSkills (Task 1), tests (Tasks 2/3/4 + 8). All spec sections covered.
- **Type consistency:** `Skill`, `SkillMeta`, `SkillRegistry`, `loadSkillRegistry`, `skillMetas`, `parseSkillFile`, `resolveLoadSkill`, `createLoadSkillTool` used consistently across tasks. `AssistantContext.loadedSkills` defined in Task 1, used in Tasks 3.
- **Placeholders:** none — every code/step is concrete.
