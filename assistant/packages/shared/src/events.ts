import { z } from "zod";
import { citationSchema } from "./citations";
import { suggestionSchema } from "./suggestions";

export const streamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("message.started") }),
  z.object({ type: z.literal("message.delta"), delta: z.string() }),
  z.object({ type: z.literal("message.completed") }),
  z.object({
    type: z.literal("tool.started"),
    tool: z.string(),
    callId: z.string(),
    detail: z.string().optional(),
  }),
  z.object({
    type: z.literal("tool.completed"),
    tool: z.string(),
    callId: z.string(),
    summary: z.string().optional(),
  }),
  z.object({
    type: z.literal("retrieval.completed"),
    chunkIds: z.array(z.string()),
  }),
  z.object({ type: z.literal("citation"), citation: citationSchema }),
  z.object({
    type: z.literal("assistant_message.related"),
    messageId: z.string(),
    items: z.array(citationSchema),
  }),
  z.object({ type: z.literal("suggestion"), suggestion: suggestionSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
