import { describe, expect, test } from 'vitest';
import { buildAgentInput } from './history';

describe('buildAgentInput', () => {
  test('appends the new user message after prior history', () => {
    const input = buildAgentInput(
      [
        { role: 'user', content: 'Feature list là gì?' },
        { role: 'assistant', content: 'Feature list là ...' },
      ],
      'Cho ví dụ?',
    );
    expect(input).toHaveLength(3);
    expect(input[2]).toEqual({ role: 'user', content: 'Cho ví dụ?' });
    expect(input[0]!.role).toBe('user');
    expect(input[1]!.role).toBe('assistant');
  });

  test('with no history returns just the new user message', () => {
    const input = buildAgentInput([], 'Verification gate?');
    expect(input).toEqual([{ role: 'user', content: 'Verification gate?' }]);
  });

  test('drops empty-content history rows', () => {
    const input = buildAgentInput([{ role: 'assistant', content: '' }], 'x');
    expect(input).toEqual([{ role: 'user', content: 'x' }]);
  });
});
