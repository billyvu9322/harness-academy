import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDocIndex, type DocIndex } from './index';
import { grepDocs, readDocSection } from './search';

let root: string;
let index: DocIndex;

const LECTURE = `---
title: "Bài 03 — Verification"
---

## Verification gate

Verification gate chặn agent tuyên bố hoàn thành khi chưa chạy test.

## E2E gate

Khác với verification gate ở phạm vi.
`;

const TEMPLATE = `## Harness intro

Template cũng nhắc verification gate ở đây.
`;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'docsearch-'));
  const write = (rel: string, body: string) => {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  write('academy/content/lectures/03-verify.md', LECTURE);
  write('templates/automation-test-harness-experimental/README.md', TEMPLATE);
  index = buildDocIndex(root);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('grepDocs', () => {
  test('finds a case-insensitive match and reports doc + heading + line', () => {
    const matches = grepDocs(index, 'VERIFICATION GATE');
    const lec = matches.find((m) => m.docId.includes('03-verify') && m.heading === 'Verification gate');
    expect(lec).toBeDefined();
    expect(lec!.route).toBe('/lectures/03-verify');
    expect(lec!.line.toLowerCase()).toContain('verification gate');
    expect(lec!.lineNumber).toBeGreaterThan(0);
  });

  test('ranks academy content above template docs', () => {
    const matches = grepDocs(index, 'verification gate');
    const firstTemplate = matches.findIndex((m) => m.contentType === 'template_doc');
    const firstLecture = matches.findIndex((m) => m.contentType === 'lecture');
    expect(firstLecture).toBeGreaterThanOrEqual(0);
    expect(firstTemplate).toBeGreaterThan(firstLecture);
  });

  test('filters by content type', () => {
    const matches = grepDocs(index, 'verification gate', { contentTypes: ['lecture'] });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.contentType === 'lecture')).toBe(true);
  });

  test('caps results at maxMatches', () => {
    const matches = grepDocs(index, 'verification gate', { maxMatches: 1 });
    expect(matches).toHaveLength(1);
  });

  test('returns empty array when nothing matches', () => {
    expect(grepDocs(index, 'zzz-no-such-term')).toEqual([]);
  });

  test('treats the pattern as case-insensitive regex but does not crash on special chars', () => {
    expect(() => grepDocs(index, 'gate.*test')).not.toThrow();
  });
});

describe('readDocSection', () => {
  test('returns exact section text + citation metadata by docId + heading', () => {
    const lec = index.find((d) => d.slug === '03-verify')!;
    const sec = readDocSection(index, lec.docId, 'E2E gate');
    expect(sec).not.toBeNull();
    expect(sec!.heading).toBe('E2E gate');
    expect(sec!.text).toContain('Khác với verification gate');
    expect(sec!.text).not.toContain('chặn agent tuyên bố');
    expect(sec!.route).toBe('/lectures/03-verify');
    expect(sec!.sourcePath).toBeTruthy();
  });

  test('returns the whole body when heading is omitted', () => {
    const lec = index.find((d) => d.slug === '03-verify')!;
    const whole = readDocSection(index, lec.docId);
    expect(whole!.heading).toBeNull();
    expect(whole!.text).toContain('Verification gate');
    expect(whole!.text).toContain('E2E gate');
  });

  test('returns null for an unknown docId (blocks path traversal)', () => {
    expect(readDocSection(index, '../../../etc/passwd')).toBeNull();
    expect(readDocSection(index, 'academy/content/lectures/03-verify.md/../../secret')).toBeNull();
  });

  test('returns null for an unknown heading in a known doc', () => {
    const lec = index.find((d) => d.slug === '03-verify')!;
    expect(readDocSection(index, lec.docId, 'No Such Heading')).toBeNull();
  });
});
