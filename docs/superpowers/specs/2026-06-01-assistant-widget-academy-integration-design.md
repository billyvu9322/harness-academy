# Assistant Widget — Academy Integration Design

Date: 2026-06-01

Status: **implemented + live-verified** (2026-06-01). API 133 tests / web 49 tests green;
academy + API run, Playwright: open lecture → Ask Assistant → panel (Shadow DOM) → streamed
grounded answer, timeline, citations→academy routes, feedback POST, U5 restore, context chip.
Three issues caught only by the live run and fixed: (1) the hijacked SSE response hardcoded
`Access-Control-Allow-Origin: WEB_ORIGIN` → now reflects the allowlisted request origin;
(2) Material Symbols icons rendered as ligature text in the Shadow DOM → added `font-family`
to the `.material-symbols-outlined` rule; (3) context chip showed the site title → now uses the
doc `<h1>`.

Scope: embed the Harness Academy Assistant chat into the `academy/` site as a
floating, lazy-loaded widget launched by an "Ask Assistant" button (Wix-docs style).

Related:

- `docs/superpowers/plans/2026-06-01-assistant-agent-harness-backend-design.md` (assistant harness — backend + UI phases B0–B9 / U1–U7, all done)
- `assistant/AGENTS.md` (assistant architecture & request flow)

---

## 1. Goal & Constraints

Show the assistant inside `academy/` when the user clicks an **Ask Assistant** button:
a floating launcher in the header opens a slide-in chat panel on the right, reusing the
fully-built chat (streaming, markdown, agent timeline, citations, suggestion chips,
feedback). The widget ships as **one lazy-loaded JS chunk** (+ CSS) imported by academy.

Hard constraints from the codebases:

1. `academy/` is **React 19** (Vite, Tailwind 3, TanStack Router, zustand); the assistant
   chat in `assistant/apps/web` is **React 18**. The two must not share a React runtime.
2. The widget must not leak styles into academy, and academy's Tailwind must not restyle
   the widget. → **Shadow DOM** isolation.
3. The chat talks to `assistant/apps/api` over SSE; the API CORS currently allows a single
   origin (`WEB_ORIGIN`). The academy origin must be allowed too.
4. Reuse the existing chat code — do **not** fork or rebuild chat features.
5. v1 scope (agreed): **basic chat** + **context-aware to the current doc**. Out of scope:
   academy theme sync, explicit cross-page memory requirement (U5 localStorage memory keeps
   working incidentally, but is not a v1 requirement).

---

## 2. Approach (decided)

**Embeddable JS widget rendered into a Shadow DOM**, built as a second Vite *library* target
inside `assistant/apps/web` (so it reuses the chat components and lib). Rejected alternatives:
iframe panel (extra chrome, cross-origin context plumbing) and direct React component import
(React 18↔19 mismatch, build coupling).

The widget is **self-hosted by academy**: the built artifact is copied into
`academy/public/assistant-widget.js` (+ `.css`) and loaded on first button click.

---

## 3. Architecture

```
academy (React 19)                         assistant/apps/web (React 18)             assistant/apps/api
─────────────────────                      ─────────────────────────────            ──────────────────
RootLayout header                          src/widget/index.tsx                      routes/chat.ts (SSE)
  └─ <AskAssistantButton/>                   defineCustomElement('harness-assistant')   CORS allowlist
        │ click (first time)                   connectedCallback:                        (WEB_ORIGINS)
        ├─ ensureWidgetLoaded()                  ├─ attachShadow({mode:'open'})
        │    inject /assistant-widget.js         ├─ inject widget.css into shadow
        ├─ create <harness-assistant            ├─ createRoot(shadowDiv).render(
        │     api-base-url=…                     │     <WidgetApp config={…}/> )
        │     academy-route=…  academy-title=…)  │        ├─ slide-in Panel + close (open ← attr)
        └─ toggle open attribute                 │        └─ <ChatPage/> (reused)
                                                 └─ reads config from attributes ───────► fetch SSE
```

### 3.1 Units & responsibilities

| Unit | Location | Responsibility | Depends on |
|------|----------|----------------|------------|
| `widget/index.tsx` | apps/web | Custom-element definition; Shadow DOM; CSS inject; React root; attribute→config parsing | React 18, WidgetApp, widget.css |
| `widget/WidgetApp.tsx` | apps/web | Slide-in panel shell wrapping the chat + a close button; open state is driven by the element's `open` attribute (set by the academy header button); renders the context chip | ChatPage, WidgetConfig |
| `widget/config.ts` | apps/web | Pure: parse element attributes → `WidgetConfig {apiBaseUrl, academyRoute?, academyTitle?}`; defaults | — |
| `lib/runtimeConfig.ts` | apps/web | Resolve `apiBaseUrl` at runtime (widget config → falls back to `VITE_API_BASE_URL`) | — |
| `vite.widget.config.ts` | apps/web | Library build → single JS chunk + CSS; bundles React | vite |
| `AskAssistantButton.tsx` | academy | Header button; lazy-load + mount/toggle the element; pass current route+title | TanStack Router location |
| `widgetLoader.ts` | academy | Pure-ish: idempotent script injection + element create/toggle | — |
| CORS allowlist | apps/api `app.ts` + `config/env.ts` | Accept academy origin(s) via `WEB_ORIGINS` | @fastify/cors |

### 3.2 Reuse vs new code

- **Reused as-is:** `features/chat/*` (useChatStream, chatApi, restore, agentEvent, chatQuery),
  `components/chat/*` (ChatPage, MessageThread, AssistantMessage, Markdown, AgentTimeline,
  RelatedLinks, SuggestionChips, MessageFeedback, composer), `lib/*` (sse, citations,
  agentStatus).
- **Small refactor:** `chatApi.ts` currently reads `import.meta.env.VITE_API_BASE_URL` at
  module load. Change to resolve via `lib/runtimeConfig.ts` so the widget can inject
  `apiBaseUrl` from the host element attribute. The standalone `apps/web` app sets the same
  runtime config from its env at boot, so its behavior is unchanged.

---

## 4. Build & packaging

- New `vite.widget.config.ts` in `apps/web`: `build.lib` with entry `src/widget/index.tsx`,
  formats `['iife']` (or `['es']`), output a single file `assistant-widget.js`, CSS emitted
  as `assistant-widget.css`. React + ReactDOM bundled in (NOT externalized) so the chunk is
  self-contained and cannot collide with academy's React 19.
- npm scripts: `pnpm --filter @assistant/web build:widget` produces `apps/web/dist-widget/`.
- A copy step (`scripts/copy-widget.mjs` or an npm script) copies
  `dist-widget/assistant-widget.{js,css}` → `academy/public/`. Documented in both AGENTS docs.
- Lazy-load: academy injects the script only on first click → no bundle-size cost on page load.
  Expected chunk ≈ 130 KB gzip (chat already measured at ~127 KB gz with markdown).

### 4.1 Shadow DOM + Tailwind

- `connectedCallback` calls `attachShadow({ mode: 'open' })`, creates a container div, and
  injects the widget's compiled Tailwind CSS as a `<style>` (the CSS string is imported via
  `?inline` or fetched alongside the JS and inserted). React mounts into the container.
- The widget's Tailwind build keeps `preflight` minimal/scoped so it styles only inside the
  shadow root. academy styles cannot cross the shadow boundary; widget styles cannot leak out.
- Material Symbols / fonts the chat uses: load inside the shadow root (link/@font-face in the
  injected style) or fall back to system icons; verified during implementation.

---

## 5. Data flow (a chat turn from academy)

1. User on an academy doc clicks **Ask Assistant** → `AskAssistantButton`:
   - first click: `widgetLoader.ensure()` injects `/assistant-widget.js` (once), then creates
     `<harness-assistant api-base-url="…" academy-route="/lectures/08-…" academy-title="Lecture 08 — …">`
     appended to `document.body` and sets `open`;
   - later clicks: toggle the `open` attribute.
2. The element (already React-mounted) shows the slide-in panel with a context chip
   ("Đang hỏi về: «Lecture 08 …»") and an optional light prefill in the composer.
3. The reused `useChatStream` posts to `${apiBaseUrl}/api/chat/stream` (CORS-allowed) and
   renders the streamed answer exactly as in the standalone app.
4. Backend is unchanged — grounding over the whole corpus; the doc title is only a UI-level
   hint (chip + prefill), not a backend parameter.

---

## 6. Context-aware behavior (no backend change)

- Attributes `academy-route` + `academy-title` flow into `WidgetConfig`.
- `WidgetApp` renders a context chip and (only on a fresh/empty thread) prefills the composer
  with an editable hint such as `Trong bài "<title>": `. The user can clear it.
- No change to the agent, tools, or API. If later we want true scoping, we add an optional
  field to `chatRequestSchema` — explicitly deferred.

---

## 7. CORS change

- `config/env.ts`: add `WEB_ORIGINS` (comma-separated) parsed into `string[]`; keep
  `WEB_ORIGIN` as the first/default for backward compatibility.
- `app.ts`: register `@fastify/cors` with an `origin` callback that allows any entry in the
  allowlist (academy dev `http://localhost:5173`, academy prod origin, existing web origin).
- `Access-Control-Expose-Headers: X-Conversation-Id` already set on the stream response — keep.

---

## 8. Error handling

- **Widget script load failure:** `widgetLoader.ensure()` rejects → button shows a small
  inline error ("Không tải được trợ lý"), academy keeps working. No global crash.
- **Custom element double-define:** guard `if (!customElements.get('harness-assistant'))`.
- **API unreachable / stream error:** handled by the existing chat error banner inside the panel.
- **Shadow DOM** guarantees a widget rendering error cannot restyle or break academy layout.
- **SSR/no-DOM:** academy is client-rendered; loader guards `typeof window`/`document`.

---

## 9. Testing

- **Unit (pure, vitest):**
  - `widget/config.ts` — attribute map → `WidgetConfig` (defaults, missing attrs, bad apiBaseUrl).
  - context prefill/chip logic — title → prefill string; empty when no title.
  - academy `widgetLoader` idempotency (script injected once) — via a DOM mock or pure guard fn.
  - api CORS allowlist parsing (`WEB_ORIGINS` → array; origin predicate).
- **Build:** `build:widget` emits exactly one JS chunk + one CSS; size logged.
- **Live (Playwright):** academy dev (5173) + api (3001) up → open an academy lecture → click
  Ask Assistant → panel slides in with context chip → ask a question → streamed grounded answer,
  citations, timeline, feedback POST 200 → toggle closed/open preserves thread.
- No DOM-render unit tests (no testing-library in either app; consistent with current repos).

---

## 10. File inventory

**assistant/apps/web (new):**
- `src/widget/index.tsx` — custom element + Shadow DOM bootstrap
- `src/widget/WidgetApp.tsx` — panel shell + launcher + context chip
- `src/widget/config.ts` (+ `config.test.ts`)
- `src/lib/runtimeConfig.ts`
- `vite.widget.config.ts`
- `scripts/copy-widget.mjs` (or npm script)

**assistant/apps/web (edit):**
- `src/features/chat/chatApi.ts` — use `runtimeConfig` for `apiBaseUrl`
- `package.json` — `build:widget` + copy scripts

**assistant/apps/api (edit):**
- `src/config/env.ts` — `WEB_ORIGINS`
- `src/app.ts` — CORS allowlist (+ test)

**academy (new/edit):**
- `src/components/AskAssistantButton.tsx`
- `src/lib/widgetLoader.ts` (+ test)
- `src/components/RootLayout.tsx` — mount the button in the header
- `public/assistant-widget.{js,css}` — copied build artifact (gitignored or committed per preference)

**docs:**
- Update `assistant/AGENTS.md` with the widget build/embed flow.

---

## 11. Risks & mitigations

- **Tailwind preflight leaking via Shadow DOM injection** — verify styles are confined; scope
  the widget Tailwind build; test against academy pages.
- **Fonts/icons inside shadow root** — Material Symbols must be loaded in-shadow or swapped for
  inline SVG; validate during build-out.
- **React 18 bundled twice if academy ever also embeds another React widget** — acceptable;
  each widget is self-contained by design.
- **apiBaseUrl/CORS misconfig in prod** — single source via env; documented.

---

## 12. Out of scope (v1)

Academy dark/light theme sync; backend doc-scoped retrieval; auth on the assistant; embedding
on non-academy sites; analytics. Each can be a follow-up.
