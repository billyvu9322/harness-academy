import { describe, expect, it } from 'vitest';
import type { StreamEvent } from '@assistant/shared/events';
import { validateStreamEvents } from '../../src/evals/streamValidation';

describe('validateStreamEvents', () => {
  it('passes a valid grounded stream', () => {
    const events: StreamEvent[] = [
      { type: 'message.delta', delta: 'hello' },
      { type: 'citation', citation: { title: 'Doc', sourcePath: 'doc.md' } },
      { type: 'suggestion', suggestion: { label: 'More', prompt: 'More?' } },
      { type: 'done' },
    ];
    expect(validateStreamEvents(events, { requireCitation: true }).ok).toBe(true);
  });

  it('fails when done is missing or duplicated', () => {
    expect(validateStreamEvents([], {}).ok).toBe(false);
    expect(validateStreamEvents([{ type: 'done' }, { type: 'done' }], {}).ok).toBe(false);
  });

  it('fails when citations appear after suggestions', () => {
    const events: StreamEvent[] = [
      { type: 'suggestion', suggestion: { label: 'More', prompt: 'More?' } },
      { type: 'citation', citation: { title: 'Doc', sourcePath: 'doc.md' } },
      { type: 'done' },
    ];
    const result = validateStreamEvents(events, {});
    expect(result.ok).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('citation'))).toBe(true);
  });

  it('fails when grounded stream lacks citations', () => {
    const result = validateStreamEvents([{ type: 'message.delta', delta: 'hello' }, { type: 'done' }], { requireCitation: true });
    expect(result.ok).toBe(false);
  });
});
