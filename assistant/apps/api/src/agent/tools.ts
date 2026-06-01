import { tool } from '@openai/agents';
import { z } from 'zod';
import type { DocIndex } from '../docs/index';
import { listDocs } from '../docs/index';
import { grepDocsMulti, readDocSection } from '../docs/search';
import { expandQuery } from '../docs/keywords';
import { buildHarnessBlueprint } from './blueprint';
import type { AssistantContext } from './context';

const CONTENT_TYPES = [
  'lecture',
  'project',
  'skill',
  'reference',
  'core_doc',
  'template_doc',
] as const;

const contentTypesParam = z
  .array(z.enum(CONTENT_TYPES))
  .optional()
  .describe('Restrict to these content types.');

/**
 * Build the agentic docs-access tools over an in-memory DocIndex.
 * `getIndex` is injected so the index can be rebuilt (reindex) without recreating the tools.
 * No raw filesystem path ever reaches these tools — lookups go through the allowlisted index.
 */
export function createDocsTools(getIndex: () => DocIndex) {
  const listDocsTool = tool({
    name: 'list_docs',
    description:
      'List indexed docs (title, route, content type) and their heading outline. Use first to orient before grepping.',
    parameters: z.object({ contentTypes: contentTypesParam }),
    execute: async ({ contentTypes }, runContext) => {
      (runContext?.context as AssistantContext | undefined)?.toolCalls?.push('list_docs');
      return listDocs(getIndex(), contentTypes ?? undefined);
    },
  });

  const grepDocsTool = tool({
    name: 'grep_docs',
    description:
      'Case-insensitive regex/keyword search over allowlisted markdown. Returns ranked matches with docId, heading, route, and the matched line. Issue several keyword variants (VN + EN) for recall.',
    parameters: z.object({
      pattern: z.string().describe('Regex or keyword. Case-insensitive.'),
      contentTypes: contentTypesParam,
      maxMatches: z.number().int().min(1).max(40).default(20),
    }),
    execute: async ({ pattern, contentTypes, maxMatches }, runContext) => {
      (runContext?.context as AssistantContext | undefined)?.toolCalls?.push('grep_docs');
      // Expand the query into VN+EN variants for cross-lingual recall, then OR-match them.
      const patterns = expandQuery(pattern);
      return grepDocsMulti(getIndex(), patterns, { contentTypes: contentTypes ?? undefined, maxMatches });
    },
  });

  // harness-design-only: returns the primitive skeleton the agent fills from the corpus.
  // Gated via isEnabled so it never surfaces during plain Q&A (mode === 'qa').
  const harnessBlueprintTool = tool({
    name: 'harness_blueprint',
    description:
      'Return the skeleton of harness primitives (goals, feature list, tools, verification gates, loops, orchestrator/sub-agents, clean state) for a workflow, to fill in from the docs. Available only in harness-design mode.',
    parameters: z.object({
      workflow: z.string().min(1).describe('The business workflow to design a harness for.'),
    }),
    isEnabled: ({ runContext }) =>
      (runContext?.context as AssistantContext | undefined)?.mode === 'harness-design',
    execute: async ({ workflow }, runContext) => {
      (runContext?.context as AssistantContext | undefined)?.toolCalls?.push('harness_blueprint');
      return buildHarnessBlueprint(workflow);
    },
  });

  const readDocSectionTool = tool({
    name: 'read_doc_section',
    description:
      'Return the exact text + metadata of one doc section (the citation anchor). Omit `heading` to read the whole doc (only for small docs).',
    parameters: z.object({
      docId: z.string().describe('docId from list_docs/grep_docs. Never a filesystem path.'),
      heading: z.string().nullish().describe('Section heading; omit for the whole doc.'),
    }),
    execute: async ({ docId, heading }, runContext) => {
      const ctx = runContext?.context as AssistantContext | undefined;
      ctx?.toolCalls?.push('read_doc_section');
      const section = readDocSection(getIndex(), docId, heading ?? undefined);
      if (!section) return { found: false, docId };
      // Record the read for citation provenance (only sections actually read are cited).
      ctx?.reads?.push(section);
      return { found: true, ...section };
    },
  });

  return { listDocsTool, grepDocsTool, readDocSectionTool, harnessBlueprintTool };
}
