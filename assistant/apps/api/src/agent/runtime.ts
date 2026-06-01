import { buildDocIndex, type DocIndex } from '../docs/index';
import { env } from '../config/env';
import { createAssistant } from './harnessAssistant';

let index: DocIndex | null = null;

/** Lazily build (and cache) the in-memory doc index from the repo root. */
function getIndex(): DocIndex {
  if (!index) index = buildDocIndex(env.DOCS_ROOT);
  return index;
}

/** Rebuild the index from disk (reserved for a future protected reindex endpoint). */
export function reindex(): number {
  index = buildDocIndex(env.DOCS_ROOT);
  return index.length;
}

/** Singleton assistant bound to the shared, lazily-built index. */
export const assistant = createAssistant(getIndex);
