import type { DocSection } from '../docs/search';

/** Interaction mode — gates which tools/instructions apply (B8). */
export type AssistantMode = 'qa' | 'harness-design';

/** Per-run shared state threaded through the agent via RunContext. */
export interface AssistantContext {
  /** Sections the agent actually read this run — citations derive from these. */
  reads: DocSection[];
  /** Tool names invoked this run (list_docs/grep_docs/read_doc_section), in order. */
  toolCalls: string[];
  /** Skill names loaded this run via load_skill — for observability. */
  loadedSkills: string[];
  /** Language the answer must be written in. */
  userLanguage?: string;
  /** Interaction mode; defaults to 'qa'. The blueprint tool is enabled only in 'harness-design'. */
  mode: AssistantMode;
  /** Set on a regenerate pass to push a stronger grounding directive. */
  corrective?: boolean;
}

export function createAssistantContext(
  opts: { userLanguage?: string; mode?: AssistantMode; corrective?: boolean } = {},
): AssistantContext {
  return {
    reads: [],
    toolCalls: [],
    loadedSkills: [],
    userLanguage: opts.userLanguage,
    mode: opts.mode ?? 'qa',
    corrective: opts.corrective,
  };
}
