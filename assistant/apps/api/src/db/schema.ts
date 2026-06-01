import { integer, jsonb, pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';

export const documentSources = pgTable('document_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourcePath: text('source_path').notNull(),
  contentType: text('content_type').notNull(),
  slug: text('slug'),
  title: text('title').notNull(),
  route: text('route'),
  checksum: text('checksum').notNull(),
  metadata: jsonb('metadata').$type<Record<string, string | number | boolean | null>>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentSourceId: uuid('document_source_id').notNull(),
  sectionHeading: text('section_heading'),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokenEstimate: integer('token_estimate').notNull(),
});

export const documentEmbeddings = pgTable('document_embeddings', {
  chunkId: uuid('chunk_id').primaryKey(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
});
