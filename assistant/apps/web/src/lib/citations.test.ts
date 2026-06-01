import { describe, expect, test } from 'vitest';
import type { Citation } from '@assistant/shared/citations';
import { dedupeCitationsByDoc, academyHref } from './citations';

const c = (title: string, route?: string, sourcePath = `${title}.md`, sectionHeading?: string): Citation => ({
  title,
  sourcePath,
  ...(route ? { route } : {}),
  ...(sectionHeading ? { sectionHeading } : {}),
});

describe('dedupeCitationsByDoc', () => {
  test('collapses multiple sections of the same routed doc into one', () => {
    const out = dedupeCitationsByDoc([
      c('Lecture 08', '/lectures/08', 'l8.md', 'Định nghĩa'),
      c('Lecture 08', '/lectures/08', 'l8.md', 'Workflow'),
      c('Lecture 08', '/lectures/08', 'l8.md', 'Điểm chính'),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe('Lecture 08');
  });

  test('keeps distinct docs', () => {
    const out = dedupeCitationsByDoc([c('Lecture 08', '/lectures/08'), c('Lecture 09', '/lectures/09')]);
    expect(out).toHaveLength(2);
  });

  test('dedupes non-routed docs by sourcePath', () => {
    const out = dedupeCitationsByDoc([
      c('AI-Agent-Harness', undefined, 'AI-Agent-Harness.md', 'A'),
      c('AI-Agent-Harness', undefined, 'AI-Agent-Harness.md', 'B'),
    ]);
    expect(out).toHaveLength(1);
  });

  test('returns empty for no citations', () => {
    expect(dedupeCitationsByDoc([])).toEqual([]);
  });
});

describe('academyHref', () => {
  test('joins base + route', () => {
    expect(academyHref('/lectures/08', 'http://localhost:5173')).toBe('http://localhost:5173/lectures/08');
  });

  test('trims a trailing slash on the base', () => {
    expect(academyHref('/lectures/08', 'http://localhost:5173/')).toBe('http://localhost:5173/lectures/08');
  });
});
