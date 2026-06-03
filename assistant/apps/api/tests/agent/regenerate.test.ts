import { describe, expect, test } from 'vitest';
import type { Citation } from '@assistant/shared/citations';
import { runWithRegenerate } from '../../src/agent/regenerate';

const cited: Citation[] = [{ title: 'L08', sourcePath: 'l8.md', route: '/lectures/08' }];

describe('runWithRegenerate', () => {
  test('does not regenerate when the first answer is grounded', async () => {
    let calls = 0;
    const res = await runWithRegenerate(async () => {
      calls += 1;
      return { answer: 'Câu trả lời có dẫn chứng.', citations: cited };
    });
    expect(calls).toBe(1);
    expect(res.regenerated).toBe(false);
    expect(res.citations).toHaveLength(1);
  });

  test('regenerates once when the first answer has no citation, returns the second', async () => {
    const calls: boolean[] = [];
    const res = await runWithRegenerate(async (corrective) => {
      calls.push(corrective);
      return calls.length === 1
        ? { answer: 'Trả lời thực tế nhưng thiếu trích dẫn.', citations: [] }
        : { answer: 'Lần 2 có dẫn chứng.', citations: cited };
    });
    expect(calls).toEqual([false, true]); // 2nd call gets corrective=true
    expect(res.regenerated).toBe(true);
    expect(res.answer).toBe('Lần 2 có dẫn chứng.');
  });

  test('gives up after a single retry even if still ungrounded', async () => {
    let calls = 0;
    const res = await runWithRegenerate(async () => {
      calls += 1;
      return { answer: 'Vẫn thiếu trích dẫn.', citations: [] };
    });
    expect(calls).toBe(2);
    expect(res.regenerated).toBe(true);
  });

  test('does not regenerate an explicit uncertainty answer', async () => {
    let calls = 0;
    const res = await runWithRegenerate(async () => {
      calls += 1;
      return { answer: 'Tài liệu nội bộ không đề cập đủ về chủ đề này.', citations: [] };
    });
    expect(calls).toBe(1);
    expect(res.regenerated).toBe(false);
  });
});
