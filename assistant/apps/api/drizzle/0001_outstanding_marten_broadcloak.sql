CREATE TABLE "chat_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"intent" text,
	"accessed_docs_json" jsonb,
	"tool_calls_json" jsonb,
	"citation_count" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"error_summary" text,
	"regenerated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"vote" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
