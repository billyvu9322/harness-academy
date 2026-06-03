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
