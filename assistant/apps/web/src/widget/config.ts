/** Configuration the host page passes to the embeddable widget via element attributes. */
export type WidgetTheme = 'light' | 'dark';

export interface WidgetConfig {
  /** API base URL (academy and the API are different origins). */
  apiBaseUrl?: string;
  /** Current academy route, for the context chip. */
  academyRoute?: string;
  /** Current academy doc title, for the context chip + composer prefill. */
  academyTitle?: string;
  /** Host-controlled initial/open signal for the slide-in panel. */
  chatOpen?: boolean;
  /** Host-controlled visual theme. */
  theme?: WidgetTheme;
}

interface AttrSource {
  getAttribute(name: string): string | null;
}

function attr(source: AttrSource, name: string): string | undefined {
  const raw = source.getAttribute(name);
  if (raw === null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function firstAttr(source: AttrSource, names: string[]): string | undefined {
  for (const name of names) {
    const value = attr(source, name);
    if (value) return value;
  }
  return undefined;
}

function parseTheme(value: string | undefined): WidgetTheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

/** Parse the `<harness-assistant>` element's attributes into a WidgetConfig. */
export function parseWidgetConfig(source: AttrSource): WidgetConfig {
  const config: WidgetConfig = {};
  const apiBaseUrl = import.meta.env.VITE_ASSISTANT_API_URL;
  const academyRoute = firstAttr(source, ['data-academy-route', 'academy-route']);
  const academyTitle = firstAttr(source, ['data-academy-title', 'academy-title']);
  const chatOpen = firstAttr(source, ['data-chat-open', 'chat-open']);
  const theme = parseTheme(firstAttr(source, ['data-theme', 'theme']));
  if (apiBaseUrl) config.apiBaseUrl = apiBaseUrl;
  if (academyRoute) config.academyRoute = academyRoute;
  if (academyTitle) config.academyTitle = academyTitle;
  if (chatOpen) config.chatOpen = chatOpen === 'true' || chatOpen === '1';
  if (theme) config.theme = theme;
  return config;
}

/** Editable composer prefix that scopes the first question to the current doc. Empty if none. */
export function buildContextPrefill(title: string | undefined): string {
  const t = title?.trim();
  return t ? `Trong bài "${t}": ` : '';
}
