# Assistant Tracing Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a read-only tracing dashboard opened from a Tracing button beside New Chat, showing per-conversation chat traces and each request made to the LLM router.

**Architecture:** Keep tracing app-native first: API reads `chat_traces`, shared package defines trace DTOs, web fetches current conversation traces and renders a contextual panel. Do not enable remote OpenAI Agents SDK tracing or add a vendor dependency in this iteration.

**Tech Stack:** Fastify, Drizzle ORM, PostgreSQL JSONB, React, TypeScript, Vitest, shared Zod schemas in `@assistant/shared`.

---

## Task 1: Add Shared Trace Schemas

**Files:**
- Create: `assistant/packages/shared/src/traces.ts`
- Modify: `assistant/packages/shared/src/index.ts` if package currently exports through an index barrel. If no index barrel exists, skip.
- Test: `assistant/apps/api/tests` does not need shared-specific tests unless the repo has shared tests. Validate through API/web typecheck.

**Step 1: Write the shared trace schema**

Create `assistant/packages/shared/src/traces.ts`:

```ts
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
export type ConversationTracesResponse = z.infer<typeof conversationTracesResponseSchema>;
```

**Step 2: Run typecheck**

Run: `pnpm --filter @assistant/api typecheck`

Expected: PASS or unrelated existing errors only. Fix new trace schema errors before continuing.

**Step 3: Commit**

Do not commit unless user explicitly requests commits. If committing later, use:

```bash
git add assistant/packages/shared/src/traces.ts
git commit -m "feat: add trace DTO schemas"
```

## Task 2: Add Trace Row Mapper And Repo Query

**Files:**
- Modify: `assistant/apps/api/src/db/repo.ts`
- Optional modify: `assistant/apps/api/src/db/mappers.ts` only if keeping all mappers centralized is preferred.
- Test: `assistant/apps/api/tests/db/mappers.test.ts` or new `assistant/apps/api/tests/db/traces.test.ts`

**Step 1: Write failing mapper test**

Create a pure mapper test before DB query code if adding mapper to `mappers.ts`.

Example test:

```ts
import { describe, expect, test } from 'vitest';
import { toTraceDto } from '../../src/db/mappers';

describe('toTraceDto', () => {
  test('maps chat trace row JSON fields into API DTO names', () => {
    const dto = toTraceDto({
      id: 'trace-1',
      messageId: null,
      accessedDocsJson: ['docs/a.md'],
      toolCallsJson: ['grep_docs'],
      llmCallsJson: [{ endpoint: 'chat.completions', status: 'ok', latencyMs: 10 }],
      citationCount: 1,
      latencyMs: 20,
      status: 'ok',
      errorSummary: null,
      regenerated: false,
      createdAt: new Date('2026-06-13T00:00:00.000Z'),
    });

    expect(dto).toEqual({
      id: 'trace-1',
      messageId: null,
      accessedDocs: ['docs/a.md'],
      toolCalls: ['grep_docs'],
      llmCalls: [{ endpoint: 'chat.completions', status: 'ok', latencyMs: 10 }],
      citationCount: 1,
      latencyMs: 20,
      status: 'ok',
      errorSummary: null,
      regenerated: false,
      createdAt: '2026-06-13T00:00:00.000Z',
    });
  });
});
```

**Step 2: Run test to verify RED**

Run: `pnpm --filter @assistant/api test -- tests/db/mappers.test.ts`

Expected: FAIL because `toTraceDto` does not exist.

**Step 3: Implement mapper and repo query**

Add mapper:

```ts
import type { ChatTrace } from '@assistant/shared/traces';

type ChatTraceRow = typeof chatTraces.$inferSelect;

export function toTraceDto(row: ChatTraceRow): ChatTrace {
  return {
    id: row.id,
    messageId: row.messageId ?? null,
    accessedDocs: row.accessedDocsJson ?? [],
    toolCalls: row.toolCallsJson ?? [],
    llmCalls: (row.llmCallsJson ?? []) as ChatTrace['llmCalls'],
    citationCount: row.citationCount,
    latencyMs: row.latencyMs,
    status: row.status === 'error' ? 'error' : 'ok',
    errorSummary: row.errorSummary ?? null,
    regenerated: row.regenerated,
    createdAt: row.createdAt.toISOString(),
  };
}
```

Add repo query in `repo.ts`:

```ts
import type { ChatTrace } from '@assistant/shared/traces';

export async function getConversationTraces(conversationId: string): Promise<ChatTrace[]> {
  const rows = await db
    .select()
    .from(chatTraces)
    .where(eq(chatTraces.conversationId, conversationId))
    .orderBy(asc(chatTraces.createdAt));

  return rows.map(toTraceDto);
}
```

**Step 4: Run mapper tests**

Run: `pnpm --filter @assistant/api test -- tests/db/mappers.test.ts`

Expected: PASS.

## Task 3: Add Conversation Traces API Route

**Files:**
- Modify: `assistant/apps/api/src/routes/conversations.ts`
- Modify: `assistant/apps/api/src/db/repo.ts`
- Test: create `assistant/apps/api/tests/routes/conversations.test.ts` if route tests are introduced, or test repo query/mapping only if route harness is too heavy.

**Step 1: Write failing route-level test**

Preferred: use `buildApp(parseEnv(...))` with mocked repo functions if project test style allows. If not, test route behavior via a lightweight Fastify instance with `conversationsRoute` and mocked repo module.

Required behaviors:

- Existing conversation returns `{ conversationId, traces }`.
- Missing conversation returns `404 { error: 'not_found' }`.

**Step 2: Run test to verify RED**

Run: `pnpm --filter @assistant/api test -- tests/routes/conversations.test.ts`

Expected: FAIL because route does not exist.

**Step 3: Implement route**

Modify imports:

```ts
import { conversationExists, getConversationTraces, getMessages, listConversations } from '../db/repo';
```

Add route before or after messages route:

```ts
app.get<{ Params: { conversationId: string } }>(
  '/api/conversations/:conversationId/traces',
  async (request, reply) => {
    const { conversationId } = request.params;
    if (!(await conversationExists(conversationId))) {
      return reply.code(404).send({ error: 'not_found' });
    }
    return reply.send({ conversationId, traces: await getConversationTraces(conversationId) });
  },
);
```

**Step 4: Run route tests**

Run: `pnpm --filter @assistant/api test -- tests/routes/conversations.test.ts`

Expected: PASS.

**Step 5: Run API typecheck**

Run: `pnpm --filter @assistant/api typecheck`

Expected: PASS.

## Task 4: Add Web API Client For Traces

**Files:**
- Modify: `assistant/apps/web/src/features/chat/chatApi.ts`
- Test: create `assistant/apps/web/src/features/chat/chatApi.test.ts` if web test setup supports fetch mocking. If not, validate by typecheck and dashboard component tests.

**Step 1: Add client function**

```ts
import type { ConversationTracesResponse } from '@assistant/shared/traces';

export async function getConversationTraces(
  conversationId: string,
): Promise<ConversationTracesResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/traces`);
  if (!response.ok) {
    throw new Error(`traces fetch failed (${response.status})`);
  }
  return response.json() as Promise<ConversationTracesResponse>;
}
```

**Step 2: Run web typecheck**

Run: `pnpm --filter @assistant/web typecheck`

Expected: PASS.

## Task 5: Build Tracing Dashboard Panel Component

**Files:**
- Create: `assistant/apps/web/src/components/chat/TracingDashboardPanel.tsx`
- Test: create `assistant/apps/web/src/components/chat/TracingDashboardPanel.test.tsx` if React test stack exists. If web tests are placeholder-only, keep component pure and verify via typecheck.

**Step 1: Define component props**

```ts
import type { ChatTrace } from '@assistant/shared/traces';

interface TracingDashboardPanelProps {
  open: boolean;
  traces: ChatTrace[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
}
```

**Step 2: Implement summary helpers**

Keep helpers in same file unless reused:

```ts
function sum(values: Array<number | undefined>): number {
  return values.reduce((total, value) => total + (value ?? 0), 0);
}

function formatMs(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`;
}
```

**Step 3: Implement panel UI**

Use existing Tailwind tokens from chat components:

- `bg-surface-container-lowest`
- `border-border-subtle`
- `text-on-surface`
- `text-text-muted`
- `text-primary`
- `bg-surface-container-low`

Panel placement:

```tsx
<aside className={`absolute right-0 top-14 bottom-0 z-40 w-full max-w-xl border-l border-border-subtle bg-surface-container-lowest shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
```

**Step 4: Render LLM calls per trace**

For each `trace.llmCalls`, render:

- endpoint + model
- status chip
- latency
- token counts
- cached token count
- request id mono text
- error summary if any

Do not render any message content because trace response should not include it.

**Step 5: Run typecheck**

Run: `pnpm --filter @assistant/web typecheck`

Expected: PASS.

## Task 6: Add Tracing Button To Top Bar

**Files:**
- Modify: `assistant/apps/web/src/components/chat/AssistantTopBar.tsx`
- Test: covered through typecheck and manual UI verification.

**Step 1: Extend props**

```ts
/** Opens/closes the trace dashboard. Hidden when omitted. */
onToggleTracing?: () => void;
/** Whether trace dashboard is open. */
tracingOpen?: boolean;
/** Disable tracing button when no conversation is active. */
tracingDisabled?: boolean;
```

**Step 2: Render button beside New Chat**

Place immediately after New Chat button:

```tsx
{onToggleTracing ? (
  <button
    type="button"
    aria-label="Tracing"
    title="Xem tracing"
    disabled={tracingDisabled}
    onClick={onToggleTracing}
    className={`material-symbols-outlined transition-colors cursor-pointer active:opacity-80 bg-transparent border-0 p-0 disabled:opacity-40 disabled:cursor-not-allowed ${
      tracingOpen ? 'text-primary' : 'text-text-muted hover:text-primary'
    }`}
  >
    account_tree
  </button>
) : null}
```

**Step 3: Run typecheck**

Run: `pnpm --filter @assistant/web typecheck`

Expected: PASS.

## Task 7: Wire Dashboard State In ChatPage

**Files:**
- Modify: `assistant/apps/web/src/components/chat/ChatPage.tsx`
- Modify: `assistant/apps/web/src/features/chat/chatApi.ts`
- Create: `assistant/apps/web/src/components/chat/TracingDashboardPanel.tsx`

**Step 1: Add state**

```ts
import { useEffect, useState } from 'react';
import type { ChatTrace } from '@assistant/shared/traces';
import { getConversationTraces } from '../../features/chat/chatApi';
import { TracingDashboardPanel } from './TracingDashboardPanel';
```

Add inside component:

```ts
const [tracingOpen, setTracingOpen] = useState(false);
const [traceLoading, setTraceLoading] = useState(false);
const [traceError, setTraceError] = useState<string | null>(null);
const [traces, setTraces] = useState<ChatTrace[]>([]);
```

**Step 2: Add load function**

```ts
async function loadTraces() {
  if (!activeConversationId) {
    setTraces([]);
    return;
  }
  setTraceLoading(true);
  setTraceError(null);
  try {
    const response = await getConversationTraces(activeConversationId);
    setTraces(response.traces);
  } catch (err) {
    setTraceError(err instanceof Error ? err.message : 'Không tải được tracing.');
  } finally {
    setTraceLoading(false);
  }
}
```

**Step 3: Fetch on open/conversation change**

```ts
useEffect(() => {
  if (!tracingOpen) return;
  void loadTraces();
}, [tracingOpen, activeConversationId]);
```

If lint complains about dependency identity, wrap load body inside the effect instead of adding `useCallback` by default.

**Step 4: Pass top bar props**

```tsx
<AssistantTopBar
  ...existingProps
  onToggleTracing={() => setTracingOpen((prev) => !prev)}
  tracingOpen={tracingOpen}
  tracingDisabled={!activeConversationId}
/>
```

**Step 5: Render panel**

Add near bottom of `main`, before error banner or after it:

```tsx
<TracingDashboardPanel
  open={tracingOpen}
  traces={traces}
  loading={traceLoading}
  error={traceError}
  onClose={() => setTracingOpen(false)}
  onRefresh={loadTraces}
/>
```

**Step 6: Reset panel on New Chat**

When `newChat` is called, either close the panel in `ChatPage` wrapper or add a `useEffect`:

```ts
useEffect(() => {
  if (!activeConversationId) {
    setTracingOpen(false);
    setTraces([]);
  }
}, [activeConversationId]);
```

**Step 7: Run typecheck**

Run: `pnpm --filter @assistant/web typecheck`

Expected: PASS.

## Task 8: Verify End-To-End Locally

**Files:**
- No code changes expected.

**Step 1: Run API tests**

Run: `pnpm --filter @assistant/api test -- tests/db tests/routes tests/observability`

Expected: PASS. If `tests/routes` does not exist, run only created route test file.

**Step 2: Run API typecheck**

Run: `pnpm --filter @assistant/api typecheck`

Expected: PASS.

**Step 3: Run web typecheck**

Run: `pnpm --filter @assistant/web typecheck`

Expected: PASS.

**Step 4: Manual UI verification**

Start app from `assistant/`:

```bash
pnpm dev
```

Open web app. Send one assistant message. Verify:

- New Chat button appears.
- Tracing button appears beside New Chat.
- Clicking Tracing opens panel.
- Panel shows at least one trace row after assistant response persists.
- Panel shows nested LLM calls with model/latency/token fields.
- Panel does not show prompt body or user message content.
- Refresh button reloads traces.
- New Chat closes panel.

## Task 9: Optional Browser QA

**Files:**
- No code changes expected unless bugs found.

**Step 1: Use browser automation**

If dev server is running, use browser QA to click:

- submit prompt
- Tracing button
- Refresh
- Close
- New Chat

**Step 2: Capture issues**

Fix only concrete UI/behavior bugs. Do not redesign the whole chat UI.

## Task 10: Final Verification

**Files:**
- No code changes expected.

Run:

```bash
pnpm --filter @assistant/api typecheck
pnpm --filter @assistant/web typecheck
pnpm --filter @assistant/api test -- tests/db tests/observability
```

If route/component tests were added, include them explicitly:

```bash
pnpm --filter @assistant/api test -- tests/routes/conversations.test.ts
```

Expected: all commands exit 0.

## Implementation Notes

- Keep trace response read-only.
- Keep trace API scoped to a conversation.
- Do not add prompt content to trace DTOs.
- Do not add third-party observability dependency in this iteration.
- Use `@assistant/shared/traces` types in both API and web.
- Preserve existing widget behavior; dashboard panel should work in standalone app and embedded widget because both reuse `ChatPage`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-13-assistant-tracing-dashboard.md`.

Two execution options:

1. Subagent-Driven (this session) - dispatch fresh subagent per task, review between tasks, fast iteration.
2. Parallel Session (separate) - open a new session with executing-plans, batch execution with checkpoints.

Which approach?
