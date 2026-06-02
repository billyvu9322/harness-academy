/**
 * Hybrid history scoping: the DB owns conversation content (durable, cross-device), but
 * listing every conversation would leak other anonymous visitors' chats. So this browser
 * keeps a local index of the conversation ids it created; the History panel hydrates titles
 * from the server and filters to this set. Clearing it only drops the local index — the rows
 * stay in the DB, they just stop being listed here.
 */
const OWNED_IDS_KEY = 'harness.conversationIds';

export function loadOwnedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OWNED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Record a conversation id as owned by this browser. Most-recent-first, deduped. */
export function addOwnedId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  const next = [id, ...loadOwnedIds().filter((existing) => existing !== id)];
  window.localStorage.setItem(OWNED_IDS_KEY, JSON.stringify(next));
}

/** Drop the local index (does not delete server-side conversations). */
export function clearOwnedIds(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(OWNED_IDS_KEY);
}
