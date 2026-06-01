import { describe, expect, test } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  test('instructs the agent to use the docs tools', () => {
    const p = buildSystemPrompt();
    expect(p).toContain('list_docs');
    expect(p).toContain('grep_docs');
    expect(p).toContain('read_doc_section');
  });

  test('forbids inventing facts / external sources', () => {
    const p = buildSystemPrompt().toLowerCase();
    expect(p).toMatch(/không.*(bịa|invent|external|bên ngoài)|chỉ.*tài liệu/);
  });

  test('defaults the reply language to Vietnamese', () => {
    expect(buildSystemPrompt()).toContain('Vietnamese');
  });

  test('uses the provided user language', () => {
    expect(buildSystemPrompt({ userLanguage: 'English' })).toContain('English');
  });

  test('omits the blueprint directive in qa mode (default)', () => {
    expect(buildSystemPrompt()).not.toContain('harness_blueprint');
  });

  test('adds the blueprint directive in harness-design mode', () => {
    expect(buildSystemPrompt({ mode: 'harness-design' })).toContain('harness_blueprint');
  });
});
