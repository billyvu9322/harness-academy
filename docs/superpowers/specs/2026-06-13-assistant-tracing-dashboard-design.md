# Assistant Tracing Dashboard Design

**Snapshot date:** 2026-06-13

## Goal

Add a read-only tracing dashboard to the Assistant web UI so an operator can click a Tracing button next to New Chat and inspect the chat trace for the current conversation, including each request made to the LLM router.

## Current State

The API already records per-turn traces in Postgres table `chat_traces`.

Current trace fields:

- `conversation_id`
- `message_id`
- `accessed_docs_json`
- `tool_calls_json`
- `llm_calls_json`
- `citation_count`
- `latency_ms`
- `status`
- `error_summary`
- `regenerated`
- `created_at`

`llm_calls_json` is produced by `assistant/apps/api/src/observability/llmTrace.ts` and contains redacted metadata only:

- `endpoint`
- `model`
- `stream`
- `status`
- `latencyMs`
- `requestId`
- `inputTokens`
- `outputTokens`
- `totalTokens`
- `cachedInputTokens`
- `errorSummary`

No API route currently reads `chat_traces`. No web UI currently shows trace data.

## Non-Goals

- Do not enable remote OpenAI Agents SDK tracing yet.
- Do not add Langfuse, OpenTelemetry, Jaeger, or Grafana in this iteration.
- Do not persist prompt bodies, raw user messages, tool payload bodies, API keys, secrets, or full model outputs in traces.
- Do not expose all users' traces publicly. The dashboard is scoped to the conversation visible in this browser session.

## Proposed Architecture

Build a small app-native tracing dashboard first.

```
apps/web ChatPage
  AssistantTopBar
    New Chat button
    Tracing button
      opens TracingDashboardPanel
        calls getConversationTraces(activeConversationId)

apps/api conversationsRoute
  GET /api/conversations/:conversationId/traces
    checks conversationExists
    returns ordered traces from chat_traces

packages/shared
  trace schemas/types shared by API and web
```

The first dashboard is a right-side overlay panel, not a separate page. This keeps the widget/app surface simple and makes trace inspection contextual to the current chat.

## API Contract

### Endpoint

`GET /api/conversations/:conversationId/traces`

### Success Response

```json
{
  "conversationId": "uuid",
  "traces": [
    {
      "id": "uuid",
      "messageId": "uuid-or-null",
      "accessedDocs": ["docs/AI-Agent-Harness.md"],
      "toolCalls": ["grep_docs", "read_doc_section"],
      "llmCalls": [
        {
          "endpoint": "chat.completions",
          "model": "cx/gpt-5.5",
          "stream": true,
          "status": "ok",
          "latencyMs": 842,
          "requestId": "req_...",
          "inputTokens": 2431,
          "outputTokens": 244,
          "totalTokens": 2675,
          "cachedInputTokens": 1024
        }
      ],
      "citationCount": 2,
      "latencyMs": 1850,
      "status": "ok",
      "errorSummary": null,
      "regenerated": false,
      "createdAt": "2026-06-13T...Z"
    }
  ]
}
```

### Error Responses

- `404 { "error": "not_found" }` when conversation does not exist.
- `400` only if route params fail validation after adding explicit schema validation.

## Shared Types

Add trace schemas to `assistant/packages/shared/src/chat.ts` or a new `trace.ts`.

Recommended new file: `assistant/packages/shared/src/traces.ts`.

Reason: tracing is conceptually separate from chat request/message DTOs, and a dedicated module keeps chat contracts small.

Types:

- `llmCallTraceSchema`
- `chatTraceSchema`
- `conversationTracesResponseSchema`
- `LlmCallTrace`
- `ChatTrace`
- `ConversationTracesResponse`

## UI Behavior

### Top Bar

Add a Tracing icon button beside New Chat in `AssistantTopBar`.

Suggested icon: `account_tree`, `route`, or `query_stats`. Use existing Material Symbols style.

Rules:

- Button is visible when `activeConversationId` exists.
- Button sits next to New Chat.
- Button aria-label: `Tracing`.
- Button title: `Xem tracing`.
- Active state highlights primary color when panel is open.

### Dashboard Panel

Add `TracingDashboardPanel` as an absolute/fixed right-side panel over the chat.

Panel sections:

1. Header
   - title: `Tracing`
   - close button
   - refresh button

2. Summary cards
   - trace count
   - total LLM calls
   - total tokens
   - cached input tokens
   - average latency

3. Trace list
   - one card per chat trace row, newest last or newest first. Prefer newest last to match conversation flow.
   - show created time, status, route latency, citation count, regenerated flag.
   - show tool calls as chips.
   - show accessed docs as compact list.

4. LLM call detail per trace
   - endpoint
   - model
   - stream flag
   - status
   - latency
   - token counts
   - cached token count and cache ratio
   - requestId copyable text if present
   - redacted error summary if present

Empty states:

- No active conversation: `Chưa có cuộc trò chuyện để xem tracing.`
- No traces yet: `Chưa có trace nào cho cuộc trò chuyện này.`
- Fetch error: show retry button.

## Security And Privacy

- API returns only sanitized trace rows from `chat_traces`; no joins to message content are required.
- Do not add prompt or message content to trace response.
- Keep trace API scoped by `conversationId` for this iteration.
- Browser history already scopes conversations by local owned IDs; dashboard should only request active conversation traces.
- Future production hardening should add auth/session ownership checks before deploying beyond local/internal usage.

## Performance

- Initial endpoint can return all traces for a conversation because traces are small.
- Add `limit` only if conversations become long. Default cap could be 100 later.
- UI should fetch traces on panel open and refresh on demand.
- Do not poll continuously in first iteration.

## Acceptance Criteria

- A Tracing button appears beside New Chat when a conversation is active.
- Clicking Tracing opens a dashboard panel without navigating away.
- Dashboard loads traces for the current conversation via API.
- Dashboard shows each stored chat trace and nested LLM calls.
- Dashboard shows token usage and cached token usage when available.
- Dashboard never displays prompt text, message body, API key, token, or secret.
- Closing dashboard returns to normal chat view.
- Loading another conversation updates dashboard data to that conversation.
- API tests cover found/not-found trace fetch.
- Web tests cover API client parsing and panel rendering states.
- `pnpm --filter @assistant/api typecheck` passes.
- `pnpm --filter @assistant/web typecheck` passes.
- Relevant API and web tests pass.

## Later Enhancements

- Add per-message trace link on assistant messages.
- Add trace export as JSON.
- Add slow-call highlighting.
- Add cache hit-rate chart.
- Add optional Langfuse/OpenTelemetry exporter using the same sanitized trace model.
- Add route-level auth for hosted production.
