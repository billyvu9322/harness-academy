import { z } from 'zod';

export const chatModeSchema = z.enum(['academy', 'harness-design']);

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  mode: chatModeSchema.default('academy'),
});

export const conversationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.string(),
});

export type ChatMode = z.infer<typeof chatModeSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;
