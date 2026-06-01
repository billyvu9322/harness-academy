/**
 * Runtime resolution of the API base URL.
 *
 * The standalone web app sets this from its Vite env at boot; the embeddable widget overrides
 * it from the host element's `api-base-url` attribute (academy and the API are different
 * origins). Reading it at call time — not module load — lets the widget configure it after
 * the chat code is already imported.
 */
const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

let apiBaseUrl = DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  if (url && url.trim().length > 0) apiBaseUrl = url.trim();
}
