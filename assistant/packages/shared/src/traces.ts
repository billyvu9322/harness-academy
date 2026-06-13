import { z } from 'zod';

export const llmCallTraceSchema = z.object({
  endpoint: z.enum(['chat.completions', 'embeddings']),
  model: z.string().optional(),
  stream: z.boolean().optional(),
  status: z.enum(['ok', 'error']),
  latencyMs: z.number().int().nonnegative(),
  requestId: z.string().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  cachedInputTokens: z.number().int().nonnegative().optional(),
  errorSummary: z.string().optional(),
});

export const chatTraceSchema = z.object({
  id: z.string(),
  messageId: z.string().nullable(),
  accessedDocs: z.array(z.string()).default([]),
  toolCalls: z.array(z.string()).default([]),
  llmCalls: z.array(llmCallTraceSchema).default([]),
  citationCount: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  status: z.enum(['ok', 'error']),
  errorSummary: z.string().nullable(),
  regenerated: z.boolean(),
  createdAt: z.string(),
});

export const conversationTracesResponseSchema = z.object({
  conversationId: z.string(),
  traces: z.array(chatTraceSchema),
});

export type LlmCallTrace = z.infer<typeof llmCallTraceSchema>;
export type ChatTrace = z.infer<typeof chatTraceSchema>;
export type ConversationTracesResponse = z.infer<
  typeof conversationTracesResponseSchema
>;
