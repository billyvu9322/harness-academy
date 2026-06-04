import type { FastifyPluginAsync } from "fastify";
import { chatRequestSchema, feedbackSchema } from "@assistant/shared/chat";
import type { Citation } from "@assistant/shared/citations";
import type { Suggestion } from "@assistant/shared/suggestions";
import { assistant } from "../agent/runtime";
import { streamAssistant } from "../agent/streaming";
import { compactIfNeeded } from "../agent/compact";
import { createAssistantContext } from "../agent/context";
import { buildTraceSummary } from "../observability/trace";
import { serializeSseEvent } from "../rag/placeholder";
import { isOriginAllowed, parseAllowedOrigins } from "../config/origins";
import {
  appendMessage,
  conversationExists,
  createConversation,
  deriveTitle,
  getHistoryTurns,
  insertFeedback,
  insertTrace,
  messageExists,
} from "../db/repo";
import { env } from "../config/env";

async function resolveConversation(
  conversationId: string | undefined,
  message: string,
): Promise<string> {
  if (conversationId && (await conversationExists(conversationId)))
    return conversationId;
  return createConversation(deriveTitle(message));
}

export const chatRoute: FastifyPluginAsync = async (app) => {
  // Non-stream answer + persistence + regenerate-once + trace (B3/B5/B6).
  app.post("/api/chat/message", async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "invalid_request", issues: parsed.error.issues });
    }
    const { message, conversationId: reqId } = parsed.data;
    const conversationId = await resolveConversation(reqId, message);
    const startedAt = Date.now();

    try {
      const rawHistory = await getHistoryTurns(conversationId);
      // Compact older turns into a summary when the cumulative history grows large —
      // prevents the agent input from bloating across long sessions.
      const history = await compactIfNeeded(rawHistory);
      await appendMessage({ conversationId, role: "user", content: message });
      const result = await assistant.runMessage(message, {
        userLanguage: "Vietnamese",
        history,
      });
      const messageId = await appendMessage({
        conversationId,
        role: "assistant",
        content: result.answer,
        citations: result.citations,
      });
      await insertTrace({
        conversationId,
        messageId,
        summary: buildTraceSummary({
          context: result.context,
          latencyMs: result.latencyMs,
          status: "ok",
          regenerated: result.regenerated,
        }),
      });
      return reply.send({
        conversationId,
        messageId,
        answer: result.answer,
        citations: result.citations,
      });
    } catch (err) {
      request.log.error({ err }, "assistant runMessage failed");
      await insertTrace({
        conversationId,
        summary: buildTraceSummary({
          context: createAssistantContext(),
          latencyMs: Date.now() - startedAt,
          status: "error",
          regenerated: false,
          error: err instanceof Error ? err.message : "unknown error",
        }),
      });
      return reply.code(422).send({
        error: "assistant_error",
        message: err instanceof Error ? err.message : "unknown error",
      });
    }
  });

  // Streaming SSE + persistence + trace.
  app.post("/api/chat/stream", async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "invalid_request", issues: parsed.error.issues });
    }
    const { message, conversationId: reqId } = parsed.data;
    const conversationId = await resolveConversation(reqId, message);
    const rawHistory = await getHistoryTurns(conversationId);
    // Compact older turns into a summary when the cumulative history grows large —
    // prevents the agent input from bloating across long sessions.
    const history = await compactIfNeeded(rawHistory);
    await appendMessage({ conversationId, role: "user", content: message });

    const context = createAssistantContext({ userLanguage: "Vietnamese" });
    const startedAt = Date.now();

    // reply.hijack() bypasses the @fastify/cors plugin, so the SSE response must set CORS
    // headers itself — reflecting the request origin when it is in the allowlist (the academy
    // widget and the standalone web app are different origins).
    const reqOrigin = request.headers.origin;
    const allowedOrigins = parseAllowedOrigins(env.WEB_ORIGINS);
    const allowOrigin =
      reqOrigin && isOriginAllowed(reqOrigin, allowedOrigins)
        ? reqOrigin
        : allowedOrigins[0];

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      // no-cache stops client/proxy caching; no-transform stops CDNs from buffering to recompress.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable reverse-proxy response buffering (nginx and compatible). Without this the proxy
      // holds the whole SSE stream until upstream closes, so the UI only sees text at `done`.
      "X-Accel-Buffering": "no",
      // Reflect the caller's origin when allowed; only set the header if we have one.
      ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
      "Access-Control-Expose-Headers": "X-Conversation-Id",
      "X-Conversation-Id": conversationId,
    });
    // Push headers now and disable Nagle so each per-token SSE frame leaves the socket
    // immediately instead of being coalesced — the client paints tokens as they arrive.
    reply.raw.flushHeaders();
    reply.raw.socket?.setNoDelay(true);

    // Per-request AbortController. Fires when the client socket closes — either the user
    // pressed Stop (fetch aborted on the client) or they navigated away. Propagated into
    // streamAssistant so the agent run is cancelled instead of running to completion uselessly.
    const ac = new AbortController();
    const onClose = () => ac.abort();
    request.raw.on("close", onClose);

    let answer = "";
    const citations: Citation[] = [];
    const suggestions: Suggestion[] = [];
    try {
      for await (const ev of streamAssistant(message, {
        userLanguage: "Vietnamese",
        history,
        context,
        signal: ac.signal,
      })) {
        if (ac.signal.aborted) break;
        if (ev.type === "message.delta") answer += ev.delta;
        else if (ev.type === "citation") citations.push(ev.citation);
        else if (ev.type === "suggestion") suggestions.push(ev.suggestion);
        // Socket may have half-closed between events; writing then throws — guard it.
        if (!reply.raw.writableEnded) reply.raw.write(serializeSseEvent(ev));
      }

      if (ac.signal.aborted) {
        // Persist the partial answer (if any) so reloading the conversation shows what the
        // user saw on screen, with a marker so they know it was cut short.
        if (answer.trim().length > 0) {
          await appendMessage({
            conversationId,
            role: "assistant",
            content: `${answer}\n\n_(đã dừng)_`,
            citations,
            suggestions,
          });
        }
        await insertTrace({
          conversationId,
          summary: buildTraceSummary({
            context,
            latencyMs: Date.now() - startedAt,
            status: "ok",
            regenerated: false,
          }),
        });
        return;
      }

      const messageId = await appendMessage({
        conversationId,
        role: "assistant",
        content: answer,
        citations,
        suggestions,
      });
      // The assistant row id only exists once the answer is persisted. Emit it so the client
      // can target feedback at the stored message (U6). Sent after `done`; the client drains
      // remaining events until the stream closes.
      reply.raw.write(
        serializeSseEvent({
          type: "assistant_message.related",
          messageId,
          items: citations,
        }),
      );

      await insertTrace({
        conversationId,
        messageId,
        summary: buildTraceSummary({
          context,
          latencyMs: Date.now() - startedAt,
          status: "ok",
          regenerated: false,
        }),
      });
    } catch (err) {
      request.log.error({ err }, "stream failed");
      reply.raw.write(
        serializeSseEvent({ type: "error", message: "stream failed" }),
      );
      
      reply.raw.write(serializeSseEvent({ type: "done" }));
      
      await insertTrace({
        conversationId,
        summary: buildTraceSummary({
          context,
          latencyMs: Date.now() - startedAt,
          status: "error",
          regenerated: false,
          error: err instanceof Error ? err.message : "unknown error",
        }),
      });
    } finally {
      request.raw.off("close", onClose);
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  });

  // Feedback loop (B6): thumb up/down on an assistant message.
  app.post<{ Params: { messageId: string } }>(
    "/api/messages/:messageId/feedback",
    async (request, reply) => {
      const parsed = feedbackSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: "invalid_request", issues: parsed.error.issues });
      }
      const { messageId } = request.params;
      if (!(await messageExists(messageId))) {
        return reply.code(404).send({ error: "not_found" });
      }
      await insertFeedback(messageId, parsed.data.vote);
      return reply.send({ ok: true });
    },
  );
};
