import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDocIndex, listDocs } from './index';

let root: string;

const LECTURE = `---
title: "Bài 01 — Harness"
description: "desc"
order: 1
tags: [foundation]
---

## Giới thiệu

Nội dung.

## Verification gate

Chi tiết gate.
`;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'docidx-'));
  const write = (rel: string, body: string) => {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  write('academy/content/lectures/01-intro.md', LECTURE);
  write('AI-Agent-Harness.md', '## Tổng quan\n\nKhông có frontmatter.\n');
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('buildDocIndex', () => {
  test('creates one entry per allowlisted source with a stable docId', () => {
    const index = buildDocIndex(root);
    expect(index.length).toBe(2);
    const ids = index.map((d) => d.docId);
    expect(new Set(ids).size).toBe(2); // unique
  });

  test('uses frontmatter title and parses heading-scoped sections', () => {
    const index = buildDocIndex(root);
    const lec = index.find((d) => d.slug === '01-intro')!;
    expect(lec.title).toBe('Bài 01 — Harness');
    expect(lec.contentType).toBe('lecture');
    expect(lec.route).toBe('/lectures/01-intro');
    expect(lec.sections.filter((s) => s.heading).map((s) => s.heading)).toEqual([
      'Giới thiệu',
      'Verification gate',
    ]);
  });

  test('falls back to slug as title when no frontmatter', () => {
    const index = buildDocIndex(root);
    const core = index.find((d) => d.slug === 'AI-Agent-Harness')!;
    expect(core.title).toBe('AI-Agent-Harness');
    expect(core.contentType).toBe('core_doc');
  });
});

describe('listDocs', () => {
  test('returns a TOC with heading outlines', () => {
    const index = buildDocIndex(root);
    const toc = listDocs(index);
    const lec = toc.find((d) => d.slug === '01-intro')!;
    expect(lec.title).toBe('Bài 01 — Harness');
    expect(lec.route).toBe('/lectures/01-intro');
    expect(lec.headings).toEqual(['Giới thiệu', 'Verification gate']);
  });

  test('filters by content types', () => {
    const index = buildDocIndex(root);
    const onlyLectures = listDocs(index, ['lecture']);
    expect(onlyLectures).toHaveLength(1);
    expect(onlyLectures[0].slug).toBe('01-intro');
  });
});
