/**
 * CORS origin allowlist. The assistant API is called by the standalone web app AND by the
 * embeddable widget running on the academy origin, so a single origin is not enough.
 */

/**
 * Build the allowed-origin list from the comma-separated `WEB_ORIGINS`.
 * Trims, drops empties, dedupes.
 */
export function parseAllowedOrigins(webOrigins: string | undefined): string[] {
  const fromList = (webOrigins ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  return [...new Set(fromList)];
}

/**
 * CORS predicate. A missing Origin (same-origin requests, curl, server-to-server) is allowed;
 * a present Origin must be in the allowlist.
 */
export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) return true;
  return allowed.includes(origin);
}
