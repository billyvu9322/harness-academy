import { describe, expect, it } from 'vitest';
import { buildJsonReport } from '../../evals/evals/reporter';
import type { QuestionResult } from '../../evals/evals/score';

const result: QuestionResult = {
  id: 'feature-list-primitive',
  category: 'citation-routing',
  judgeScore: 5,
  judgePass: true,
  cited: true,
  expectedDocCited: true,
  keywordHits: 1,
  keywordTotal: 1,
  keywordPass: true,
  toolPass: true,
  streamPass: true,
  pass: true,
};

describe('buildJsonReport', () => {
  it('builds parseable summary and result payloads', () => {
    const report = buildJsonReport({
      results: [
        {
          result,
          runIndex: 1,
          durationMs: 123,
          answer: 'Feature list là một primitive nền tảng để kiểm chứng scope.'.repeat(4),
          citations: [
            {
              title: 'Feature list là primitive',
              sourcePath: 'academy/content/lectures/08-feature-list-la-primitive.md',
              route: '/lectures/08-feature-list-la-primitive',
            },
          ],
          judgeReason: 'good',
        },
      ],
      durationMs: 456,
      baselineVerdict: { ok: true, reasons: [] },
    });

    expect(report.summary.total).toBe(1);
    expect(report.summary.baselineOk).toBe(true);
    expect(report.results[0]?.answerExcerpt.length).toBeLessThanOrEqual(163);
    expect(report.results[0]?.citations[0]?.sourcePath).toContain('feature-list');
  });
});
