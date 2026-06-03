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
