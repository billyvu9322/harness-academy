import { Agent, run } from "@openai/agents";
import type { Citation } from "@assistant/shared/citations";
import { env } from "../config/env";
import type { DocIndex } from "../docs/index";
import { buildCitations } from "../docs/citations";
import { initLlm } from "./llm";
import { createDocsTools } from "./tools";
import { buildSystemPrompt } from "./prompts";
import { checkInput } from "./guardrails";
import { classifyInput, refusalFor } from "./relevance";
import { loadSkillRegistry, skillMetas } from "./skills/loader";
import { createLoadSkillTool } from "./skills/loadSkillTool";
import {
  createAssistantContext,
  type AssistantContext,
  type AssistantMode,
} from "./context";
import { buildAgentInput, type HistoryTurn } from "./history";
import { runWithRegenerate } from "./regenerate";

// Q&A is a short grep→read→answer loop; harness-design fills a multi-section blueprint and
// legitimately needs more tool turns to ground each primitive.
const MAX_TURNS: Record<AssistantMode, number> = {
  qa: 8,
  "harness-design": 16,
};

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

/** Pluck the latest user message from the SDK agent input (string or AgentInputItem[]). */
function extractCurrentMessage(input: unknown): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    for (let i = input.length - 1; i >= 0; i--) {
      const item = input[i] as { role?: string; content?: unknown } | undefined;
      if (item?.role !== "user") continue;
      const c = item.content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) {
        return c
          .map((p: any) => (typeof p === "string" ? p : (p?.text ?? "")))
          .join("");
      }
    }
  }
  return "";
}

export function createAssistant(getIndex: () => DocIndex) {
  const {
    listDocsTool,
    grepDocsTool,
    readDocSectionTool,
    harnessBlueprintTool,
  } = createDocsTools(getIndex);

  const skillRegistry = loadSkillRegistry(env.SKILLS_ROOT);
  const skills = skillMetas(skillRegistry);

  const orchestrator = new Agent<AssistantContext>({
    name: "HarnessOrchestrator",
    model: env.OPENAI_CHAT_MODEL,
    instructions: (rc) =>
      buildSystemPrompt({
        userLanguage: rc.context?.userLanguage,
        mode: rc.context?.mode,
        skills,
      }),
    tools: [
      listDocsTool,
      grepDocsTool,
      readDocSectionTool,
      harnessBlueprintTool,
      createLoadSkillTool(skillRegistry),
    ],
    inputGuardrails: [
      {
        name: "input-policy",
        execute: async ({ input }) => {
          // Check only the CURRENT user message, not the stringified history. Stringifying
          // history+message used to trip `too_long` after a few turns even when the user's
          // current message was short. History is now compacted upstream (compactIfNeeded)
          // so it is safe to ignore here.
          const text = extractCurrentMessage(input);
          const r = checkInput(text);
          return { tripwireTriggered: r.tripwire, outputInfo: r };
        },
      },
    ],
  });

  async function runMessage(
    message: string,
    opts: RunMessageOptions = {},
  ): Promise<RunMessageResult> {
    initLlm();
    const input = buildAgentInput(opts.history ?? [], message);
    const startedAt = Date.now();
    let lastContext = createAssistantContext({
      userLanguage: opts.userLanguage,
      mode: opts.mode,
    });

    // Relevance/safety pre-pass: refuse off-topic / injection without running the
    // tool loop. Fails open to SAFE on any classifier error.
    const label = await classifyInput(message);
    if (label !== "SAFE") {
      return {
        answer: refusalFor(label),
        citations: [],
        regenerated: false,
        latencyMs: Date.now() - startedAt,
        context: lastContext,
      };
    }

    const result = await runWithRegenerate(async (corrective) => {
      const context = createAssistantContext({
        userLanguage: opts.userLanguage,
        mode: opts.mode,
        corrective,
      });
      lastContext = context;
      const runRes = await run(
        orchestrator,
        input as Parameters<typeof run>[1],
        {
          context,
          maxTurns: MAX_TURNS[context.mode],
        },
      );
      return {
        answer: String(runRes.finalOutput ?? ""),
        citations: buildCitations(context.reads),
      };
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
