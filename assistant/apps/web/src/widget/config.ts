/** Configuration the host page passes to the embeddable widget via element attributes. */
export interface WidgetConfig {
  /** API base URL (academy and the API are different origins). */
  apiBaseUrl?: string;
  /** Current academy route, for the context chip. */
  academyRoute?: string;
  /** Current academy doc title, for the context chip + composer prefill. */
  academyTitle?: string;
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

/** Parse the `<harness-assistant>` element's attributes into a WidgetConfig. */
export function parseWidgetConfig(source: AttrSource): WidgetConfig {
  const config: WidgetConfig = {};
  const apiBaseUrl = firstAttr(source, ['data-api-base-url', 'api-base-url']);
  const academyRoute = firstAttr(source, ['data-academy-route', 'academy-route']);
  const academyTitle = firstAttr(source, ['data-academy-title', 'academy-title']);
  if (apiBaseUrl) config.apiBaseUrl = apiBaseUrl;
  if (academyRoute) config.academyRoute = academyRoute;
  if (academyTitle) config.academyTitle = academyTitle;
  return config;
}

/** Editable composer prefix that scopes the first question to the current doc. Empty if none. */
export function buildContextPrefill(title: string | undefined): string {
  const t = title?.trim();
  return t ? `Trong bài "${t}": ` : '';
}
