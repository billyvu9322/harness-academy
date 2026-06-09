import { describe, expect, test } from 'vitest';
import { citationSchema } from '@assistant/shared/citations';
import { toCitation, buildCitations } from '../../src/docs/citations';
import type { DocSection } from '../../src/docs/search';

const ROUTED: DocSection = {
  docId: 'academy/content/lectures/03-verify.md',
  title: 'Bài 03 — Verification',
  route: '/lectures/03-verify',
  contentType: 'lecture',
  sourcePath: 'academy/content/lectures/03-verify.md',
  heading: 'Verification gate',
  text: '...',
};

const CORE: DocSection = {
  docId: 'docs/AI-Agent-Harness.md',
  title: 'AI-Agent-Harness',
  route: undefined,
  contentType: 'core_doc',
  sourcePath: 'docs/AI-Agent-Harness.md',
  heading: null,
  text: '...',
};

describe('toCitation', () => {
  test('maps a routed section to a citation with route + section heading', () => {
    const c = toCitation(ROUTED);
    expect(c.title).toBe('Bài 03 — Verification');
    expect(c.route).toBe('/lectures/03-verify');
    expect(c.sourcePath).toBe('academy/content/lectures/03-verify.md');
    expect(c.sectionHeading).toBe('Verification gate');
  });

  test('omits route and sectionHeading for a non-routed whole-doc section', () => {
    const c = toCitation(CORE);
    expect(c.route).toBeUndefined();
    expect(c.sectionHeading).toBeUndefined();
    expect(c.sourcePath).toBe('docs/AI-Agent-Harness.md');
  });

  test('output validates against the shared citation schema', () => {
    expect(() => citationSchema.parse(toCitation(ROUTED))).not.toThrow();
    expect(() => citationSchema.parse(toCitation(CORE))).not.toThrow();
  });
});

describe('buildCitations', () => {
  test('dedupes by docId + heading and preserves order of first appearance', () => {
    const other: DocSection = { ...ROUTED, heading: 'E2E gate' };
    const cites = buildCitations([ROUTED, other, ROUTED]);
    expect(cites).toHaveLength(2);
    expect(cites[0]!.sectionHeading).toBe('Verification gate');
    expect(cites[1]!.sectionHeading).toBe('E2E gate');
  });

  test('returns an empty array for no reads', () => {
    expect(buildCitations([])).toEqual([]);
  });

  test('treats different docs with the same heading as distinct', () => {
    const a: DocSection = { ...ROUTED, heading: 'Intro' };
    const b: DocSection = { ...CORE, heading: 'Intro' };
    expect(buildCitations([a, b])).toHaveLength(2);
  });
});
