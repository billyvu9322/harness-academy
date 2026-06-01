import { describe, expect, test } from 'vitest';
import { parseMarkdown } from './parseMarkdown';

const SAMPLE = `---
title: "Lecture 01 — Vì sao Agent giỏi vẫn fail?"
description: "Model mạnh không đảm bảo agent đáng tin."
order: 1
duration: "10 phút đọc"
tags: [foundation, mental-model]
---

Mở đầu không thuộc heading nào.

## Tình huống điển hình

Một AI model trả lời hoàn hảo.

### Chi tiết

Dòng phụ.

## Vấn đề thật

Lỗi harness lặp lại.
`;

describe('parseMarkdown', () => {
  test('parses frontmatter fields', () => {
    const { frontmatter } = parseMarkdown(SAMPLE);
    expect(frontmatter.title).toBe('Lecture 01 — Vì sao Agent giỏi vẫn fail?');
    expect(frontmatter.description).toBe('Model mạnh không đảm bảo agent đáng tin.');
    expect(frontmatter.order).toBe(1);
    expect(frontmatter.duration).toBe('10 phút đọc');
    expect(frontmatter.tags).toEqual(['foundation', 'mental-model']);
  });

  test('captures preamble before the first heading as a section with null heading', () => {
    const { sections } = parseMarkdown(SAMPLE);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].level).toBe(0);
    expect(sections[0].text).toContain('Mở đầu không thuộc heading nào.');
  });

  test('splits body into heading-scoped sections with levels', () => {
    const { sections } = parseMarkdown(SAMPLE);
    const headed = sections.filter((s) => s.heading !== null);
    expect(headed.map((s) => s.heading)).toEqual([
      'Tình huống điển hình',
      'Chi tiết',
      'Vấn đề thật',
    ]);
    expect(headed.map((s) => s.level)).toEqual([2, 3, 2]);
  });

  test('section text includes the heading line and its body until the next heading', () => {
    const { sections } = parseMarkdown(SAMPLE);
    const first = sections.find((s) => s.heading === 'Tình huống điển hình')!;
    expect(first.text).toContain('## Tình huống điển hình');
    expect(first.text).toContain('Một AI model trả lời hoàn hảo.');
    expect(first.text).not.toContain('Vấn đề thật');
  });

  test('records 1-based start/end line ranges per section', () => {
    const { sections } = parseMarkdown(SAMPLE);
    const last = sections.find((s) => s.heading === 'Vấn đề thật')!;
    // body lines are counted after frontmatter is stripped
    expect(last.startLine).toBeGreaterThan(0);
    expect(last.endLine).toBeGreaterThanOrEqual(last.startLine);
  });

  test('parses frontmatter and headings with CRLF line endings', () => {
    const crlf = SAMPLE.replace(/\n/g, '\r\n');
    const { frontmatter, sections } = parseMarkdown(crlf);
    expect(frontmatter.title).toBe('Lecture 01 — Vì sao Agent giỏi vẫn fail?');
    expect(frontmatter.tags).toEqual(['foundation', 'mental-model']);
    const headed = sections.filter((s) => s.heading !== null).map((s) => s.heading);
    expect(headed).toContain('Tình huống điển hình');
    const first = sections.find((s) => s.heading === 'Tình huống điển hình')!;
    expect(first.text).not.toContain('\r');
  });

  test('handles a document with no frontmatter', () => {
    const { frontmatter, sections } = parseMarkdown('# Title only\n\nbody text');
    expect(frontmatter.title).toBeUndefined();
    expect(sections.some((s) => s.heading === 'Title only' && s.level === 1)).toBe(true);
  });
});
