import { describe, expect, it } from 'vitest';
import { buildJudgePrompt, parseJudgeVerdict } from './judge';

describe('buildJudgePrompt', () => {
  it('embeds question, rubric, answer and asks for JSON score', () => {
    const { system, user } = buildJudgePrompt({
      question: 'Feature list là gì?',
      rubric: 'Must explain feature list as a harness primitive.',
      answer: 'Feature list là danh sách tính năng...',
      language: 'Vietnamese',
    });
    expect(system.toLowerCase()).toContain('json');
    expect(system.toLowerCase()).toContain('score');
    expect(user).toContain('Feature list là gì?');
    expect(user).toContain('Must explain feature list as a harness primitive.');
    expect(user).toContain('Feature list là danh sách tính năng...');
  });
});

describe('parseJudgeVerdict', () => {
  it('parses a clean JSON object', () => {
    const v = parseJudgeVerdict('{"score": 5, "pass": true, "reason": "grounded"}');
    expect(v).toEqual({ score: 5, pass: true, reason: 'grounded', parsed: true });
  });

  it('parses JSON wrapped in a ```json fence', () => {
    const v = parseJudgeVerdict('```json\n{"score": 4, "pass": true, "reason": "ok"}\n```');
    expect(v.parsed).toBe(true);
    expect(v.score).toBe(4);
    expect(v.pass).toBe(true);
  });

  it('parses JSON surrounded by prose', () => {
    const v = parseJudgeVerdict('Here is my verdict: {"score": 2, "pass": false, "reason": "weak"} done.');
    expect(v.score).toBe(2);
    expect(v.pass).toBe(false);
  });

  it('clamps score into 0..5', () => {
    expect(parseJudgeVerdict('{"score": 9, "pass": true}').score).toBe(5);
    expect(parseJudgeVerdict('{"score": -3, "pass": false}').score).toBe(0);
  });

  it('derives pass from score when boolean is absent', () => {
    expect(parseJudgeVerdict('{"score": 4, "reason": "good"}').pass).toBe(true);
    expect(parseJudgeVerdict('{"score": 3, "reason": "meh"}').pass).toBe(false);
  });

  it('returns an unparseable verdict on non-JSON', () => {
    const v = parseJudgeVerdict('the model rambled with no json');
    expect(v.parsed).toBe(false);
    expect(v.pass).toBe(false);
    expect(v.score).toBe(0);
  });
});
