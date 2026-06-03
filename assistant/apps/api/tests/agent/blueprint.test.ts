import { describe, expect, it } from 'vitest';
import { buildHarnessBlueprint, BLUEPRINT_SECTION_KEYS } from '../../src/agent/blueprint';

describe('buildHarnessBlueprint', () => {
  it('echoes the workflow (trimmed)', () => {
    const bp = buildHarnessBlueprint('  kiểm thử tự động trang checkout  ');
    expect(bp.workflow).toBe('kiểm thử tự động trang checkout');
  });

  it('produces the core harness primitive sections in order', () => {
    const bp = buildHarnessBlueprint('any workflow');
    expect(bp.sections.map((s) => s.key)).toEqual([...BLUEPRINT_SECTION_KEYS]);
  });

  it('every section has a title and a guiding prompt referencing the workflow', () => {
    const bp = buildHarnessBlueprint('quy trình duyệt đơn');
    for (const s of bp.sections) {
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(s.prompt).toContain('quy trình duyệt đơn');
    }
  });

  it('throws on an empty workflow', () => {
    expect(() => buildHarnessBlueprint('   ')).toThrow();
  });
});
