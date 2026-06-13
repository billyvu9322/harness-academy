import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { Citation } from '@assistant/shared/citations';
import type { Suggestion } from '@assistant/shared/suggestions';

// Phase 1 is agentic docs access (in-memory DocIndex) — no document_*/pgvector tables here.
// A vector layer + document_embeddings would be re-added later with a pgvector migration.

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  citationsJson: jsonb('citations_json').$type<Citation[]>(),
  suggestionsJson: jsonb('suggestions_json').$type<Suggestion[]>(),
  traceId: text('trace_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatTraces = pgTable('chat_traces', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  messageId: uuid('message_id'),
  intent: text('intent'),
  accessedDocsJson: jsonb('accessed_docs_json').$type<string[]>(),
  toolCallsJson: jsonb('tool_calls_json').$type<string[]>(),
  llmCallsJson: jsonb('llm_calls_json').$type<unknown[]>(),
  citationCount: integer('citation_count').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  status: text('status').notNull(), // 'ok' | 'error'
  errorSummary: text('error_summary'),
  regenerated: boolean('regenerated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull(),
  vote: text('vote').notNull(), // 'up' | 'down'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
