import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listSourceFiles } from '../../src/docs/sources';

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'docsrc-'));
  const write = (rel: string, body = '# x') => {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  // academy collections
  write('academy/content/lectures/01-intro.md');
  write('academy/content/lectures/02-harness.md');
  write('academy/content/projects/p1.md');
  write('academy/content/skills/s1.md');
  write('academy/content/references/r1.md');
  // core docs
  write('AI-Agent-Harness.md');
  write('docs/OpenAI-Harness-Engineering.md');
  write('docs/superpowers/plans/should-be-ignored.md'); // nested → excluded
  // template docs
  const tpl = 'templates/automation-test-harness-experimental';
  write(`${tpl}/README.md`);
  write(`${tpl}/AGENTS.md`);
  write(`${tpl}/CLAUDE.md`);
  write(`${tpl}/Template.md`);
  // disallowed artifacts
  write('.playwright-mcp/trace.md');
  write('academy/content/lectures/draft.txt'); // non-md → excluded
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('listSourceFiles', () => {
  test('maps academy lectures to lecture type with a /lectures/<slug> route', () => {
    const files = listSourceFiles(root);
    const lec = files.find((f) => f.slug === '01-intro');
    expect(lec).toBeDefined();
    expect(lec!.contentType).toBe('lecture');
    expect(lec!.route).toBe('/lectures/01-intro');
  });

  test('maps each academy collection to its content type and route base', () => {
    const files = listSourceFiles(root);
    const byType = (t: string) => files.filter((f) => f.contentType === t);
    expect(byType('lecture')).toHaveLength(2);
    expect(byType('project')[0]?.route).toBe('/projects/p1');
    expect(byType('skill')[0]?.route).toBe('/skills/s1');
    expect(byType('reference')[0]?.route).toBe('/references/r1');
  });

  test('core docs are core_doc with no route', () => {
    const files = listSourceFiles(root);
    const harness = files.find((f) => f.slug === 'AI-Agent-Harness');
    expect(harness!.contentType).toBe('core_doc');
    expect(harness!.route).toBeUndefined();
    expect(files.some((f) => f.slug === 'OpenAI-Harness-Engineering')).toBe(true);
  });

  test('includes the four template docs as template_doc', () => {
    const files = listSourceFiles(root);
    const tpl = files.filter((f) => f.contentType === 'template_doc').map((f) => f.slug).sort();
    expect(tpl).toEqual(['AGENTS', 'CLAUDE', 'README', 'Template']);
  });

  test('excludes .playwright-mcp, nested docs subdirs, and non-md files', () => {
    const files = listSourceFiles(root);
    expect(files.some((f) => f.sourcePath.includes('.playwright-mcp'))).toBe(false);
    expect(files.some((f) => f.slug === 'should-be-ignored')).toBe(false);
    expect(files.some((f) => f.sourcePath.endsWith('draft.txt'))).toBe(false);
  });

  test('every returned sourcePath is absolute and ends in .md', () => {
    const files = listSourceFiles(root);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(f.sourcePath.endsWith('.md')).toBe(true);
      expect(f.relPath.endsWith('.md')).toBe(true);
    }
  });
});
