import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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
