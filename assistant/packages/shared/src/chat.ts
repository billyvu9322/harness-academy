import { z } from 'zod';
import { citationSchema } from './citations';
import { suggestionSchema } from './suggestions';

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

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  citations: z.array(citationSchema).default([]),
  suggestions: z.array(suggestionSchema).default([]),
  createdAt: z.string(),
});

export const feedbackSchema = z.object({
  vote: z.enum(['up', 'down']),
});

export type ChatMode = z.infer<typeof chatModeSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type FeedbackRequest = z.infer<typeof feedbackSchema>;
