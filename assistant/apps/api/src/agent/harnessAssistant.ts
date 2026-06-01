import { Agent, run } from '@openai/agents';
import type { Citation } from '@assistant/shared/citations';
import { env } from '../config/env';
import type { DocIndex } from '../docs/index';
import { buildCitations } from '../docs/citations';
import { initLlm } from './llm';
import { createDocsTools } from './tools';
import { buildSystemPrompt } from './prompts';
import { checkInput, checkOutput } from './guardrails';
import { createAssistantContext, type AssistantContext } from './context';
import { buildAgentInput, type HistoryTurn } from './history';

const MAX_TURNS = 8;

export interface RunMessageOptions {
  userLanguage?: string;
  history?: HistoryTurn[];
}

export interface RunMessageResult {
  answer: string;
  citations: Citation[];
}

export function createAssistant(getIndex: () => DocIndex) {
  const { listDocsTool, grepDocsTool, readDocSectionTool } = createDocsTools(getIndex);

  const orchestrator = new Agent<AssistantContext>({
    name: 'HarnessOrchestrator',
    model: env.OPENAI_CHAT_MODEL,
    instructions: (rc) => buildSystemPrompt({ userLanguage: rc.context?.userLanguage }),
    tools: [listDocsTool, grepDocsTool, readDocSectionTool],
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
    outputGuardrails: [
      {
        name: 'grounding-policy',
        execute: async ({ agentOutput, context }) => {
          const reads = context.context?.reads ?? [];
          const citationCount = buildCitations(reads).length;
          const r = checkOutput({ answer: String(agentOutput), citationCount });
          return { tripwireTriggered: r.tripwire, outputInfo: r };
        },
      },
    ],
  });

  async function runMessage(message: string, opts: RunMessageOptions = {}): Promise<RunMessageResult> {
    initLlm();
    const context = createAssistantContext(opts.userLanguage);
    const input = buildAgentInput(opts.history ?? [], message);
    const result = await run(orchestrator, input as Parameters<typeof run>[1], { context, maxTurns: MAX_TURNS });
    return {
      answer: String(result.finalOutput ?? ''),
      citations: buildCitations(context.reads),
    };
  }

  return { orchestrator, runMessage };
}
