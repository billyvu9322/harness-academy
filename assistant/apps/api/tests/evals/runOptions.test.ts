import { describe, expect, it } from 'vitest';
import { parseRunOptions } from '../../src/evals/runOptions';

describe('parseRunOptions', () => {
  it('uses safe defaults', () => {
    expect(parseRunOptions([])).toEqual({
      json: false,
      runs: 1,
      timeout: 120_000,
    });
  });

  it('parses filters and model overrides', () => {
    expect(
      parseRunOptions([
        '--id',
        'feature-list-primitive',
        '--category',
        'citation-routing',
        '--model',
        'assistant-model',
        '--judge-model',
        'judge-model',
        '--transport',
        'stream',
      ]),
    ).toMatchObject({
      id: 'feature-list-primitive',
      category: 'citation-routing',
      model: 'assistant-model',
      judgeModel: 'judge-model',
      transport: 'stream',
    });
  });

  it('parses json, runs and timeout', () => {
    expect(parseRunOptions(['--json', '--runs', '3', '--timeout', '5000'])).toMatchObject({
      json: true,
      runs: 3,
      timeout: 5000,
    });
  });

  it('rejects invalid numeric options', () => {
    expect(() => parseRunOptions(['--runs', '0'])).toThrow(/runs/i);
    expect(() => parseRunOptions(['--timeout', 'nope'])).toThrow(/timeout/i);
  });
});
