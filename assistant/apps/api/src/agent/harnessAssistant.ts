import { Agent, run } from '@openai/agents';
import type { Citation } from '@assistant/shared/citations';
import { env } from '../config/env';
import type { DocIndex } from '../docs/index';
import { buildCitations } from '../docs/citations';
import { initLlm } from './llm';
import { createDocsTools } from './tools';
import { buildSystemPrompt } from './prompts';
import { checkInput } from './guardrails';
import { createAssistantContext, type AssistantContext, type AssistantMode } from './context';
import { buildAgentInput, type HistoryTurn } from './history';
import { runWithRegenerate } from './regenerate';

// Q&A is a short grep→read→answer loop; harness-design fills a multi-section blueprint and
// legitimately needs more tool turns to ground each primitive.
const MAX_TURNS: Record<AssistantMode, number> = { qa: 8, 'harness-design': 16 };

export interface RunMessageOptions {
  userLanguage?: string;
  mode?: AssistantMode;
  history?: HistoryTurn[];
}

export interface RunMessageResult {
  answer: string;
  citations: Citation[];
  regenerated: boolean;
  latencyMs: number;
  /** Context of the final attempt — for trace summaries. */
  context: AssistantContext;
}

export function createAssistant(getIndex: () => DocIndex) {
  const { listDocsTool, grepDocsTool, readDocSectionTool, harnessBlueprintTool } =
    createDocsTools(getIndex);

  const orchestrator = new Agent<AssistantContext>({
    name: 'HarnessOrchestrator',
    model: env.OPENAI_CHAT_MODEL,
    instructions: (rc) =>
      buildSystemPrompt({ userLanguage: rc.context?.userLanguage, mode: rc.context?.mode }),
    tools: [listDocsTool, grepDocsTool, readDocSectionTool, harnessBlueprintTool],
    // Input rejected hard (length/injection/off-topic). Output grounding is enforced
    // app-level via runWithRegenerate (so we can retry instead of aborting the run).
    inputGuardrails: [
      {
        name: 'input-policy',
        execute: async ({ input }) => {
          const text = typeof input === 'string' ? input : JSON.stringify(input);
          const r = checkInput(text);
          return { tripwireTriggered: r.tripwire, outputInfo: r };
        },
      },
    ],
  });

  async function runMessage(message: string, opts: RunMessageOptions = {}): Promise<RunMessageResult> {
    initLlm();
    const input = buildAgentInput(opts.history ?? [], message);
    const startedAt = Date.now();
    let lastContext = createAssistantContext({ userLanguage: opts.userLanguage, mode: opts.mode });

    const result = await runWithRegenerate(async (corrective) => {
      const context = createAssistantContext({ userLanguage: opts.userLanguage, mode: opts.mode, corrective });
      lastContext = context;
      const runRes = await run(orchestrator, input as Parameters<typeof run>[1], {
        context,
        maxTurns: MAX_TURNS[context.mode],
      });
      return { answer: String(runRes.finalOutput ?? ''), citations: buildCitations(context.reads) };
    });

    return {
      answer: result.answer,
      citations: result.citations,
      regenerated: result.regenerated,
      latencyMs: Date.now() - startedAt,
      context: lastContext,
    };
  }

  return { orchestrator, runMessage };
}
