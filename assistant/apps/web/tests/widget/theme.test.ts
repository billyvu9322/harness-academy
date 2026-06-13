import { describe, expect, it } from 'vitest';
import { parseWidgetConfig } from '../../src/widget/config';

function el(attrs: Record<string, string>) {
  return { getAttribute: (name: string): string | null => attrs[name] ?? null };
}

describe('widget theme config', () => {
  it('reads academy data-theme attribute', () => {
    expect(parseWidgetConfig(el({ 'data-theme': 'dark' })).theme).toBe('dark');
  });

  it('reads plain theme attribute', () => {
    expect(parseWidgetConfig(el({ theme: 'light' })).theme).toBe('light');
  });

  it('ignores unsupported theme values', () => {
    expect(parseWidgetConfig(el({ 'data-theme': 'system' })).theme).toBeUndefined();
  });
});
