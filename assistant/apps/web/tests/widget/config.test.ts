import { describe, expect, it } from 'vitest';
import { buildContextPrefill, parseWidgetConfig } from '../../src/widget/config';

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
        'chat-open': 'true',
      }),
    );
    expect(cfg).toEqual({
      apiBaseUrl: 'https://api.example.com',
      academyRoute: '/lectures/08-feature-list',
      academyTitle: 'Lecture 08',
      chatOpen: true,
    });
  });

  it('reads data-* attributes used by academy host element', () => {
    const cfg = parseWidgetConfig(
      el({
        'data-academy-route': '/skills/context-engineering',
        'data-academy-title': 'Context Engineering',
        'data-chat-open': '1',
      }),
    );
    expect(cfg).toEqual({
      apiBaseUrl: 'https://api.example.com',
      academyRoute: '/skills/context-engineering',
      academyTitle: 'Context Engineering',
      chatOpen: true,
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

  it('parses falsey chat-open values as false', () => {
    const cfg = parseWidgetConfig(el({ 'data-chat-open': 'false' }));
    expect(cfg.chatOpen).toBe(false);
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
