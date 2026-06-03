import { describe, expect, it } from 'vitest';
import { expandQuery } from '../../src/docs/keywords';

describe('expandQuery', () => {
  it('keeps the original pattern first', () => {
    expect(expandQuery('verification gate')[0]).toBe('verification gate');
  });

  it('expands a VN term to its EN variant', () => {
    const out = expandQuery('cổng xác minh');
    expect(out.some((v) => v.toLowerCase() === 'verification gate')).toBe(true);
  });

  it('expands an EN term to its VN variant', () => {
    const out = expandQuery('verification gate');
    expect(out.some((v) => /xác minh|kiểm chứng/i.test(v))).toBe(true);
  });

  it('expands when the term is a substring of the query', () => {
    const out = expandQuery('giải thích feature list giúp tôi');
    expect(out.some((v) => /danh sách tính năng/i.test(v))).toBe(true);
  });

  it('returns only the original for an unknown term', () => {
    expect(expandQuery('blockchain mining')).toEqual(['blockchain mining']);
  });

  it('dedupes variants case-insensitively', () => {
    const out = expandQuery('Verification Gate');
    const lower = out.map((v) => v.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it('handles an empty pattern safely', () => {
    expect(expandQuery('')).toEqual(['']);
  });
});
