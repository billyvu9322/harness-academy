import { describe, expect, it } from 'vitest';
import { isOriginAllowed, parseAllowedOrigins } from '../../src/config/origins';

describe('parseAllowedOrigins', () => {
  it('returns an empty list when none is given', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it('splits a comma-separated list and trims entries', () => {
    expect(parseAllowedOrigins('http://localhost:5173, http://localhost:5174 ')).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
    ]);
  });

  it('dedupes', () => {
    expect(parseAllowedOrigins('http://a, http://a')).toEqual(['http://a']);
  });

  it('ignores empty segments', () => {
    expect(parseAllowedOrigins('http://a,,')).toEqual(['http://a']);
  });
});

describe('isOriginAllowed', () => {
  const allow = ['http://localhost:5173', 'http://localhost:5174'];

  it('allows a listed origin', () => {
    expect(isOriginAllowed('http://localhost:5173', allow)).toBe(true);
  });

  it('rejects an unlisted origin', () => {
    expect(isOriginAllowed('http://evil.example', allow)).toBe(false);
  });

  it('allows requests with no Origin header (same-origin / curl)', () => {
    expect(isOriginAllowed(undefined, allow)).toBe(true);
  });
});
