import type { DocSection } from '../docs/search';

/** Per-run shared state threaded through the agent via RunContext. */
export interface AssistantContext {
  /** Sections the agent actually read this run — citations derive from these. */
  reads: DocSection[];
  /** Language the answer must be written in. */
  userLanguage?: string;
}

export function createAssistantContext(userLanguage?: string): AssistantContext {
  return { reads: [], userLanguage };
}
