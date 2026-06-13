import { OpenAI } from 'openai';
import {
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
} from '@openai/agents';
import { env } from '../config/env';
import { instrumentOpenAIClient } from '../observability/llmTrace';

/**
 * Shared OpenAI-compatible client pointed at the custom router.
 * Reused by every Agent (via the default client) AND by rag/embed.ts,
 * so the base URL + User-Agent header are configured in exactly one place.
 */
export const routerClient = instrumentOpenAIClient(new OpenAI({
  baseURL: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
  defaultHeaders: {
    'User-Agent': 'AssistantHarnessBot/0.1 personal research',
  },
}));

let initialized = false;

/**
 * Wire the Agents SDK to the router. Call once at process boot, before any
 * Agent is constructed or run.
 *
 * - setDefaultOpenAIClient: every Agent resolves models against routerClient.
 * - setOpenAIAPI('chat_completions'): the router is Chat Completions compatible,
 *   not the Responses API.
 * - setTracingDisabled(true): the OpenAI trace exporter ships spans to
 *   platform.openai.com with a real OpenAI key, which the router key is not.
 *   Observability is handled via AgentHooks -> Postgres instead.
 */
export function initLlm(): void {
  if (initialized) return;
  setDefaultOpenAIClient(routerClient);
  setOpenAIAPI('chat_completions');
  setTracingDisabled(true);
  initialized = true;
}
