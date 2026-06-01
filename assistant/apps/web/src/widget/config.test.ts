import { describe, expect, it } from 'vitest';
import { buildContextPrefill, parseWidgetConfig } from './config';

function el(attrs: Record<string, string>) {
  return { getAttribute: (name: string): string | null => attrs[name] ?? null };
}

describe('parseWidgetConfig', () => {
  it('reads all attributes', () => {
    const cfg = parseWidgetConfig(
      el({
        'api-base-url': 'https://api.example.com',
        'academy-route': '/lectures/08-feature-list',
        'academy-title': 'Lecture 08',
      }),
    );
    expect(cfg).toEqual({
      apiBaseUrl: 'https://api.example.com',
      academyRoute: '/lectures/08-feature-list',
      academyTitle: 'Lecture 08',
    });
  });

  it('returns undefined for missing attributes', () => {
    expect(parseWidgetConfig(el({}))).toEqual({});
  });

  it('treats blank attributes as undefined and trims', () => {
    const cfg = parseWidgetConfig(el({ 'api-base-url': '  ', 'academy-title': '  Lecture 10  ' }));
    expect(cfg.apiBaseUrl).toBeUndefined();
    expect(cfg.academyTitle).toBe('Lecture 10');
  });
});

describe('buildContextPrefill', () => {
  it('builds an editable prefix from the doc title', () => {
    expect(buildContextPrefill('Lecture 08 — Feature list')).toBe('Trong bài "Lecture 08 — Feature list": ');
  });

  it('returns empty string when there is no title', () => {
    expect(buildContextPrefill(undefined)).toBe('');
    expect(buildContextPrefill('  ')).toBe('');
  });
});
