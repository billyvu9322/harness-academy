# Harness Academy Assistant Design

Date: 2026-05-31

Status: draft for user review (UI theme updated 2026-06-01 — switched to Light Theme welcome view)

Target implementation folder: `assistant/`

## UI Theme & Welcome View (Light)

Design source: Stitch project `1011803010040175047`, screen `Assistant - Welcome View (Light Theme, No Sidebar)` (`5346aec202504d81b3774192bbba0c38`). Companion screen: `Assistant - Chat View (Light Theme)` (`645290fa991d4adba42b68d1ffa1d6e9`). Phase-1 default theme switches from the original dark Forge Terminal palette to a **light** surface system. Background tokens, fonts, and layout below are normative for `apps/web/`.

### Color Tokens (Tailwind extend.colors)

```ts
background: '#f8f9fa'                 // page canvas
surface: '#f8f9fa'
surface-bright: '#f8f9fa'
surface-dim: '#d9dadb'
surface-container-lowest: '#ffffff'   // input panel, top app bar, footer
surface-container-low: '#f3f4f5'
surface-container: '#edeeef'          // inactive example chips
surface-container-high: '#e7e8e9'     // chip hover
surface-container-highest: '#e1e3e4'

on-background: '#191c1d'
on-surface: '#191c1d'
on-surface-variant: '#58423d'
text-muted: '#616566'                 // footer status / secondary labels
forge-text: '#434748'                 // example question body
forge-label: '#58423d'                // section eyebrow ("Examples:")

outline: '#8b716b'                    // textarea placeholder
outline-variant: '#dfc0b9'            // panel borders, header/footer dividers
forge-border: '#dfc0b9'

primary: '#a4361f'
primary-container: '#c54e34'
forge-orange: '#D95C41'               // brand accent, active chip, send button, focus ring
on-primary: '#ffffff'

error: '#ba1a1a'
```

`html.light` is the default class. Dark theme is **not** in phase 1 scope; the prior `#131313` Forge Terminal palette is parked for a later switcher.

### Typography

- `Manrope` — display, headline, title, label-caps (700/800 weights for hero/eyebrows).
- `Inter` — body-lg (18px/28), body-md (16px/24), placeholders.
- `JetBrains Mono` — `label-sm` (12px, +0.05em tracking) for the footer status strip.
- Type scale: `display-lg 48/56`, `headline-lg 32/40`, `title-md 20/28`, `body-lg 18/28`, `body-md 16/24`, `label-caps 12/1 +0.05em`, `label-sm 12/16 +0.05em`.

### Shape & Spacing

- Radius: `lg = 0.5rem` (chips, buttons), `xl = 0.75rem` (input panel card), `full` (pill icon buttons).
- Spacing scale: `xs 4`, `base 8`, `sm 12`, `gutter 24`, `md 24`, `lg 48`, `xl 80`, `panel-padding 20`, `margin-desktop 64`, `margin-mobile 16`.
- Welcome content max width: `max-w-2xl` (672px), vertically and horizontally centered.

### Layout — Welcome View (No Sidebar)

Single-column embedded panel, **no left sidebar in phase 1**. Three vertical zones:

1. **TopAppBar** — `h-14`, `bg-surface-container-lowest`, bottom border `outline-variant`. Left: filled `auto_awesome` sparkle in `forge-orange` + label `ASSISTANT` (label-caps). Right: icon row `open_in_new`, `history`, `close`.
2. **Centered Canvas** — `flex-1 flex flex-col items-center justify-center`, padding `gutter`. Stack inside `max-w-2xl`:
   - 64px sparkle SVG hero mark (`#D95C41`).
   - Input panel: `bg-surface-container-lowest`, 1px `outline-variant`, `rounded-xl`, `p-5`, `shadow-sm`, focus state swaps border + `ring-1` to `forge-orange`. Textarea `min-h-[160px]`, placeholder `"What would you like to know?"` in `outline` color. Send button: floating bottom-right, `arrow_right_alt` icon, `forge-orange`, transparent bg, hover `forge-orange/10`.
   - Examples block: eyebrow `Examples:` (12px bold, +0.08em tracking, `forge-label`). Horizontal pill row (overflow-x scroll, scrollbar hidden). Active pill `bg-forge-orange text-white`, inactive `bg-surface-container border-outline-variant text-on-surface-variant`. Below: 3 example questions as plain `<p>`, `forge-text`, hover swaps to `forge-orange` underline.
3. **Footer Status Bar** — `h-10`, `bg-surface-container-lowest`, top border `outline-variant`. Single line `label-sm` `text-muted` uppercase widely tracked: `Forge Terminal Environment v1.4.2 — Encrypted AI Core Active`. Version string is dynamic.

### Component Mapping

| Stitch element | React component |
|----------------|-----------------|
| TopAppBar | `components/chat/AssistantTopBar.tsx` |
| Sparkle hero | `components/chat/BrandMark.tsx` |
| Input panel | `components/chat/ChatComposer.tsx` (welcome variant) |
| Examples row + questions | `components/chat/WelcomeExamples.tsx` |
| Footer status | `components/chat/AssistantStatusBar.tsx` |

Welcome view appears when `messages.length === 0`. On first user submit, the welcome canvas hands off to the existing `MessageList` + sticky composer in `Chat View (Light Theme)`. Both views share the same TopAppBar and StatusBar shells.

### Brand Mark

Six-point sparkle, single `#D95C41` fill, path:

```
M24 4L28 20L44 24L28 28L24 44L20 28L4 24L20 20L24 4Z
```

Used at 64px on welcome view, 24px in TopAppBar. No gradients, no shadows beyond `shadow-sm` on the input panel.

## UI — Chat View (Light)

Design source: Stitch project `1011803010040175047`, screen `Assistant - Chat View (Light Theme)` (`645290fa991d4adba42b68d1ffa1d6e9`). Implementation MUST be pixel-identical to the Stitch render: same Tailwind classes, same spacing, same token names, same animations. Deviations require explicit approval.

### Token Reconciliation With Welcome View

Chat view introduces additional named tokens. Merge into the existing Tailwind config under `theme.extend.colors`:

```ts
primary: '#d95c41'              // overrides earlier '#a4361f' — Stitch uses brand orange as semantic primary in chat
'primary-container': '#d95c41'  // overrides earlier '#c54e34'
'border-subtle': '#e1e3e4'      // = surface-container-highest, used for bubble + composer borders
'input-bg': '#ffffff'
'text-ai': '#191c1d'            // alias of on-surface for AI message body
'text-muted': '#5b5f60'         // overrides earlier '#616566'
'on-primary-container': '#ffffff'
'panel-light': '#f8f9fa'        // = surface, used for sticky footer background
```

Reasoning: Stitch consolidated the dark `#a4361f` semantic primary to brand orange when palette flipped to light. Welcome view tokens stay valid because all `forge-orange`-keyed utilities continue to map to `#D95C41`. Update `primary` and `primary-container` repo-wide; the welcome view does not reference them directly.

### Global CSS Additions

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #ccc; }
::-webkit-scrollbar-thumb:hover { background: #d95c41; }

.message-transition { animation: slideUp 0.3s cubic-bezier(0, 0, 0.2, 1) forwards; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

`.scrollbar-hide` already present (from welcome view) stays as-is.

### Body & Main Shell

- `<body>`: `bg-background text-on-background h-screen overflow-hidden font-body-md`. Default font becomes `body-md` (Inter 14/1.5/400).
- `<main>`: `flex flex-col relative h-screen overflow-hidden bg-surface`.

### TopAppBar

Identical structure to welcome view but uses `border-border-subtle` (not `border-outline-variant`) and `sticky top-0 z-50`:

```html
<header class="flex justify-between items-center h-14 px-4 w-full bg-surface-container-lowest border-b border-border-subtle sticky top-0 z-50">
  <div class="flex items-center gap-2 text-label-caps font-label-caps font-bold text-on-surface">
    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
    Assistant
  </div>
  <div class="flex items-center gap-4">
    <span class="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer">open_in_new</span>
    <span class="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer">history</span>
    <span class="material-symbols-outlined text-text-muted hover:text-primary transition-colors cursor-pointer">close</span>
  </div>
</header>
```

The label `Assistant` is the literal text content (no `<span>` wrap). `text-label-caps font-label-caps` = `Manrope 12/1 +0.05em 700`.

### Conversation Scroll Area

Scroll container wraps a centered column:

```html
<div class="flex-1 overflow-y-auto flex flex-col items-center">
  <div class="w-full max-w-2xl px-gutter py-8 flex flex-col gap-8">
    {messages}
  </div>
</div>
```

- `px-gutter` = `16px` (NOT `24px` — chat view uses a tighter gutter than welcome view; see Spacing Reconciliation below).
- `py-8` = 32px vertical pad.
- `gap-8` between message blocks (32px).

### Spacing Reconciliation

Stitch Chat View ships its own spacing scale:

```ts
spacing: {
  gutter: '16px',         // chat view
  'panel-padding': '20px',
  unit: '4px',
  margin: '24px',
}
```

Welcome view defined a richer scale (`xs/base/sm/gutter:24/md/lg/xl`). To support both pixel-perfectly, set `gutter: '16px'` at the config level and add chat-only spacing only if needed. Welcome view's earlier `p-gutter` (24px) becomes `p-md` (24px) — see migration in plan.

### Message Components

#### UserMessage

```html
<div class="flex justify-end message-transition">
  <div class="max-w-[85%] bg-forge-orange text-white px-4 py-2.5 rounded-lg font-body-md shadow-sm">
    {text}
  </div>
</div>
```

- Background: `forge-orange` (= `#D95C41`).
- Text: white.
- Radius: `rounded-lg` (`0.5rem`).
- Padding: `px-4 py-2.5` (16px / 10px).
- Width cap: `max-w-[85%]`.
- Shadow: `shadow-sm`.

#### AssistantMessage

```html
<div class="flex flex-col gap-3 message-transition" style="animation-delay: 0.1s;">
  <div class="flex items-center gap-2 text-primary">
    <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
    <span class="font-label-caps text-[11px] tracking-widest opacity-70 uppercase">Response</span>
  </div>
  <div class="bg-surface-container-low border border-border-subtle text-text-ai px-5 py-4 rounded-xl font-body-md leading-relaxed shadow-sm">
    {body}
  </div>
  {related?}
  {feedback?}
</div>
```

- Header: filled sparkle (16px) + `Response` label-caps, color `primary`, opacity 70%, uppercase, wide tracking.
- Bubble: `bg-surface-container-low` (`#f3f4f5`), 1px `border-subtle`, `rounded-xl` (12px), `px-5 py-4`, `shadow-sm`, `leading-relaxed`.
- Stagger via `style="animation-delay: 0.1s"` (then 0.2s, 0.3s…).
- Inline highlights inside body text use `<span class="text-primary font-medium">...</span>`.

#### Related Links Chip Row

```html
<div class="flex flex-wrap gap-2 mt-1">
  <div class="flex items-center gap-1.5 bg-surface-container-high border border-border-subtle px-3 py-1.5 rounded-full cursor-pointer hover:border-primary transition-colors">
    <span class="material-symbols-outlined text-[14px] text-text-muted">link</span>
    <span class="text-label-sm text-on-surface">Related: Lecture 02 · Project 01</span>
  </div>
</div>
```

- Pill shape (`rounded-full`).
- `bg-surface-container-high` (`#e7e8e9`), `border-subtle`.
- Hover swaps border to `primary`.
- `text-label-sm` = `JetBrains Mono 11/1 500`.
- Content format: `Related: <lessons joined by ' · '>`.

#### Feedback Row

```html
<div class="flex items-center gap-4 mt-2 px-1">
  <span class="text-label-sm text-text-muted">Was this answer useful?</span>
  <div class="flex items-center gap-3">
    <button class="material-symbols-outlined text-text-muted hover:text-primary transition-colors text-[18px]">thumb_up</button>
    <button class="material-symbols-outlined text-text-muted hover:text-primary transition-colors text-[18px]">thumb_down</button>
  </div>
</div>
```

- Static copy `Was this answer useful?` (English) — store as constant for future i18n.
- Buttons are bare `<button>` with Material Symbol class. No background.

### Sticky Bottom Composer

Composer is a `<footer>` outside the scroll area, sticky to the bottom of `<main>`:

```html
<footer class="bg-surface flex flex-col items-center z-10">
  <div class="w-full max-w-2xl px-gutter pb-6 pt-2">
    <div class="relative flex items-center">
      <div class="absolute left-4 flex items-center pointer-events-none">
        <span class="material-symbols-outlined text-text-muted text-[20px]">search</span>
      </div>
      <input
        class="w-full bg-input-bg border border-border-subtle rounded-xl pl-11 pr-14 py-3.5 text-body-lg text-on-surface placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none shadow-sm"
        placeholder="Ask follow up"
        type="text"
      />
      <div class="absolute right-3 flex items-center">
        <button class="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 active:scale-95 transition-all shadow-md">
          <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 0">arrow_upward</span>
        </button>
      </div>
    </div>
  </div>
  {status bar}
</footer>
```

Chat composer differs from welcome composer:

| Property | Welcome | Chat |
|----------|---------|------|
| Element | `<textarea min-h-[160px]>` | `<input type="text">` |
| Icon left | none | `search` 20px |
| Placeholder | `What would you like to know?` | `Ask follow up` |
| Send | inline `arrow_right_alt` text-only | filled 40×40 square `arrow_upward` button, `bg-primary-container shadow-md` |
| Padding | `p-5` | `pl-11 pr-14 py-3.5` |
| Border focus | `forge-orange` ring | `primary` ring + `primary` border |
| Container | inline panel inside canvas | sticky footer, separate from scroll |

Both composers MUST stay in sync on submit semantics but are distinct React components.

### Status Bar (Chat Variant)

Identical layout to welcome view footer but text differs:

```
Forge Terminal Environment v1.4.2 — AI Core Active
```

(`Encrypted ` prefix dropped.) Treat as the same `AssistantStatusBar` component with a `variant` prop or a config flag. Both views share the component; the copy changes when in chat state.

### Animation Rules

- Every message block gets class `message-transition`.
- Apply `style="animation-delay: ${index * 0.1}s"` per block for stagger, capped at 0.3s (after that, no delay).
- Use `prefers-reduced-motion: reduce` to disable the slide-up animation.

### Pixel-Parity Contract

The implementation MUST satisfy ALL of:

1. Class lists on each element match Stitch verbatim where possible. Reorder only when a class is split across multiple props.
2. Identical Tailwind tokens (`bg-surface-container-low`, `border-border-subtle`, `text-text-ai`, `bg-forge-orange`, `bg-primary-container`, `text-primary`, `text-label-sm`, `font-body-md`, `font-label-caps`).
3. Identical font sizes and weights (Inter 14/1.5/400 body, Manrope 12/1 700 +0.05em label-caps, JetBrains Mono 11/1 500 label-sm).
4. Identical hex values for `#D95C41`, `#f3f4f5`, `#e7e8e9`, `#e1e3e4`, `#ffffff`, `#191c1d`, `#5b5f60`, `#dfc0b9`, `#f8f9fa`.
5. Identical structure: TopAppBar (h-14, sticky z-50), centered scroll column (`max-w-2xl px-gutter py-8 gap-8`), sticky footer composer (`max-w-2xl px-gutter pb-6 pt-2`), 40px status bar with `border-t` and `bg-surface-container-lowest`.
6. Identical message-transition animation timing.
7. Custom 4px scrollbar with `#d95c41` hover.

### Component Mapping (Chat View)

| Stitch element | React component |
|----------------|-----------------|
| TopAppBar | `components/chat/AssistantTopBar.tsx` (shared with welcome) |
| Scroll column | `components/chat/MessageThread.tsx` (new) |
| User bubble | `components/chat/UserMessage.tsx` (new) |
| AI block (header + bubble + related + feedback) | `components/chat/AssistantMessage.tsx` (new) |
| Related links chip | `components/chat/RelatedLinks.tsx` (new) |
| Feedback row | `components/chat/MessageFeedback.tsx` (new) |
| Inline highlight `<span text-primary font-medium>` | `components/chat/Highlight.tsx` (new) or markdown renderer rule |
| Sticky composer | `components/chat/ChatFollowUpComposer.tsx` (new — separate from welcome composer) |
| Status bar | `components/chat/AssistantStatusBar.tsx` (shared, accepts `variant` prop) |

### Data Contract Adjustments

To render related-links chips and inline highlights without parsing HTML, the SSE event schema in `@assistant/shared/events` needs additions. Phase-1 minimum:

- `assistant_message.related` event carrying `{ items: Array<{ label: string; route?: string }> }`.
- Inline highlights derived client-side by matching citation titles inside the message text, OR added as explicit `assistant_message.highlight` spans tied to character ranges. Defer the second option until eval shows the first is insufficient.

`MessageFeedback` POSTs to a future `POST /api/messages/:id/feedback` endpoint; phase-1 stub stores locally and logs.

## Goal

Build a built-in AI Agent Assistant for Harness Academy. Assistant should behave like a focused developer assistant for harness engineering: answer learner questions, explain unclear academy content, cite local materials, and help users design a harness for a concrete business workflow operated through tools such as Claude Code.

First release uses local project knowledge only. No web search fallback in phase 1.

## Non-Goals For Phase 1

- No external web search.
- No arbitrary shell/file tools exposed to end users.
- No generated repo scaffolding from chat.
- No admin UI for editing indexed documents.
- No multi-tenant auth unless added later.
- No voice/realtime audio.

## Stack

All application code should be TypeScript.

Monorepo tooling:

- `pnpm` workspaces.
- `turbo` for task orchestration.

Backend:

- Node.js runtime.
- Fastify API server.
- OpenAI Agents SDK for TypeScript.
- Zod for request, response, event, and env validation.
- PostgreSQL.
- Drizzle ORM and migrations.
- Docker / Docker Compose.

Frontend:

- React.
- Vite.
- Tailwind CSS (light-mode default; see `UI Theme & Welcome View (Light)`).
- Fonts: Manrope (headlines/labels), Inter (body), JetBrains Mono (status strip).
- Material Symbols Outlined for icons.
- TanStack Router.
- TanStack Query.
- Zustand.
- Zod.

## Recommended Repo Shape

```text
assistant/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .env.example
  docker-compose.yml
  apps/
    api/
      package.json
      tsconfig.json
      src/
        server.ts
        app.ts
        config/
          env.ts
        routes/
          health.ts
          chat.ts
          conversations.ts
        agent/
          harnessAssistant.ts
          prompts.ts
          tools.ts
          guardrails.ts
          streaming.ts
          suggestions.ts
        rag/
          sources.ts
          parseMarkdown.ts
          chunk.ts
          embed.ts
          retrieve.ts
          rerank.ts
          citations.ts
        db/
          client.ts
          schema.ts
        observability/
          logger.ts
          trace.ts
        evals/
          goldenQuestions.ts
          runEvals.ts
    web/
      package.json
      tsconfig.json
      vite.config.ts
      src/
        main.tsx
        router.tsx
        app/
        components/chat/
        features/chat/
        stores/
        lib/
        api/
        schemas/
  packages/
    shared/
      package.json
      src/
        chat.ts
        events.ts
        citations.ts
        suggestions.ts
    config/
      package.json
      eslint/
      typescript/
```

`assistant/` stays isolated from current `academy/` static content app. Academy can later link to or embed Assistant once stable.

## Product Behavior

Assistant supports four primary jobs.

1. Explain concepts from Harness Academy.
2. Find relevant lessons, projects, skills, and references.
3. Answer questions about harness-engineering principles using local docs.
4. Help a user design a harness for a concrete business workflow.

Example user prompts:

- `Verification gate khác E2E gate như thế nào?`
- `Bài nào nói về feature list?`
- `Tôi muốn áp dụng harness cho team logistics xử lý shipping exception, bắt đầu từ đâu?`
- `Thiết kế AGENTS.md cho repo automation test như thế nào?`

## Knowledge Sources

Phase 1 indexes only local project files.

Source set:

- `academy/content/lectures/*.md`
- `academy/content/projects/*.md`
- `academy/content/skills/*.md`
- `academy/content/references/*.md`
- `AI-Agent-Harness.md`
- `docs/*.md`
- `templates/automation-test-harness-experimental/README.md`
- `templates/automation-test-harness-experimental/AGENTS.md`
- `templates/automation-test-harness-experimental/CLAUDE.md`
- `templates/automation-test-harness-experimental/Template.md`

Do not index generated browser artifacts under `.playwright-mcp/`.

## RAG Design

### Ingestion

Ingestion runs via a CLI command such as `pnpm --filter @assistant/api ingest`.

Ingestion steps:

1. Enumerate allowed source files from fixed path list.
2. Parse Markdown frontmatter where present.
3. Split by heading boundaries first.
4. Chunk large sections into smaller semantic blocks.
5. Generate embeddings.
6. Store chunk text and metadata in Postgres.

Metadata per chunk:

- `document_id`
- `source_path`
- `content_type` such as `lecture`, `project`, `skill`, `reference`, `core_doc`, `template_doc`
- `slug`
- `title`
- `section_heading`
- `chunk_index`
- `route`
- `token_estimate`
- `checksum`
- `updated_at`

### Chunking Rules

Chunking should optimize for answerability, not only token count.

- Prefer heading-scoped chunks.
- Target roughly 600-1000 tokens per chunk.
- Keep lists and examples intact when possible.
- Preserve citation anchors such as file path, heading, and route.
- Merge very small adjacent sections if they only make sense together.

### Retrieval

Retrieval pipeline:

1. Intent classify question.
2. Build retrieval query.
3. Vector search top K chunks.
4. Keyword fallback for exact terms like `AGENTS.md`, `verification gate`, `Playwright MCP`.
5. Optional rerank with lightweight local heuristic.
6. Send final context bundle into agent.

Priority order for reranking:

1. Direct academy lesson/project/skill content.
2. `AI-Agent-Harness.md`.
3. `docs/*.md` synthesis notes.
4. Template docs under `templates/`.

### Citation Rules

Every factual answer should cite local sources.

Citations should include:

- Human-readable title.
- Route if content comes from academy collections.
- Source path for non-routed files.
- Optional section heading.

If local docs are insufficient, assistant must say that internal materials do not cover the topic well enough. It should not invent missing facts in phase 1.

## Backend Architecture

### API Surface

Core endpoints:

- `GET /health`
- `POST /api/chat/stream`
- `POST /api/chat/message` for non-stream fallback or testing
- `GET /api/conversations/:id`
- `GET /api/conversations/:id/messages`
- `POST /api/rag/reindex` reserved for protected future use

Phase 1 can ship with only `/health` and `/api/chat/stream` if needed, but conversation read endpoints are useful for restoring UI state.

### Request Validation

Use Zod for:

- env schema
- chat request
- stream event envelope
- tool input and output schema
- DB-to-API mapping where externalized

### Chat Streaming Contract

Preferred transport: SSE over Fastify.

Server emits typed events from a shared schema package:

- `message.started`
- `message.delta`
- `message.completed`
- `tool.started`
- `tool.completed`
- `retrieval.completed`
- `citation`
- `suggestion`
- `trace`
- `error`
- `done`

The frontend should never parse raw model output for app state. All UI state changes should come from structured events.

### Agent Runtime

Use OpenAI Agents SDK because official docs recommend it when app needs code-first orchestration for agents, tools, handoffs, guardrails, tracing, or sandbox execution.

Agent responsibilities in phase 1:

- answer harness-academy questions
- explain docs in plain Vietnamese while preserving technical terms where useful
- produce structured suggestions for follow-up prompts
- produce harness design guidance for concrete business workflows

Phase 1 should start with a single main agent, not a full multi-agent graph.

Reason:

- local-doc-only RAG is narrow enough for one orchestrating agent
- trace and retrieval quality matter more than handoffs at this stage
- fewer moving parts means easier evals and debugging

Specialist agents can be added later as tools or handoffs for:

- `lesson-guide`
- `harness-designer`
- `document-retriever`

### OpenAI Agent SDK Use

The backend should use these SDK features deliberately.

- `Agent` for main assistant role.
- function tools with typed Zod-backed parameters.
- sessions for conversation continuity.
- streaming run result for token-by-token or item-by-item UI events.
- tracing enabled from first implementation.
- guardrails for input, tool use, and output shape.

SDK guidance from current official materials:

- use Agents SDK when app needs orchestration, tools, handoffs, guardrails, tracing, or sandbox execution
- agent loop handles tool calls and workflow control
- tools should be modular and clearly defined
- tracing should be built-in, not bolted on later

### Local Tools Exposed To Agent

Do not expose broad file system access to chat users.

Expose narrow tools only:

1. `searchLocalDocs`
   - input: `query`, optional `contentTypes`, optional `topK`
   - output: chunk matches with metadata

2. `getDocumentChunk`
   - input: `chunkId`
   - output: exact stored chunk text and metadata

3. `suggestNextLessons`
   - input: current topic or answered route
   - output: recommended academy routes

4. `draftHarnessBlueprint`
   - input: business domain, team size, workflow description, risk notes
   - output: structured harness outline with control plane, execution plane, docs, tools, verification, trace

These tools map directly to product behavior. They should return deterministic structured shapes.

### Guardrails

Guardrails should exist at multiple layers.

Input guardrails:

- request length limit
- empty/whitespace reject
- block obvious attempts to override system rules
- tag unsupported requests for safe refusal or redirect

Retrieval guardrails:

- ignore files outside explicit allowlist
- sanitize embedded prompt-like text from retrieved docs before using it as authority
- cap total retrieved context size

Output guardrails:

- require at least one citation for factual answers grounded in local docs
- require explicit uncertainty if retrieval confidence is low
- forbid claims about external sources in phase 1
- require structured suggestions list length cap

## Conversation State

Use Postgres for durable state.

Tables needed in phase 1:

- `conversations`
- `messages`
- `document_sources`
- `document_chunks`
- `document_embeddings`
- `chat_traces`

Possible future tables:

- `eval_runs`
- `user_feedback`
- `saved_blueprints`

Conversation state should store:

- user message
- assistant message
- emitted citations
- suggestions
- retrieval trace summary
- latency and token usage summary if available

## Frontend Architecture

### Core UX

Chat UI should feel like a focused learning copilot, not a generic chatbot. Light theme is the phase-1 default; layout follows the Stitch `Assistant - Welcome View (Light Theme, No Sidebar)` + `Chat View (Light Theme)` screens documented in `UI Theme & Welcome View (Light)`.

Two view states share the same shell:

- **Welcome view** (`messages.length === 0`): centered sparkle mark, oversized input panel with placeholder `What would you like to know?`, examples eyebrow + pills (`AGENTS.md` active by default, then `State Mgmt`, `Verification`, `Init Phase`), and three clickable example questions. No sidebar.
- **Chat view** (after first turn): conversation thread, inline citation blocks per assistant message, suggestion chips after the latest answer, sticky composer at the bottom. Same TopAppBar and footer status strip.

Shared regions:

- TopAppBar with sparkle brand mark, `ASSISTANT` label, and `open_in_new` / `history` / `close` actions.
- Conversation thread (chat view only).
- Citations rendered inline under each assistant message; expandable when count > 3.
- Suggested next prompts as chips below the latest assistant turn.
- Source route links resolve back into `academy/` content routes.
- Loading and tool-status indicators are inline (no modal spinners).
- Footer status strip (`label-sm`, uppercase, `text-muted`) for environment/version.

### State Split

Use TanStack Query for server state.

- conversations
- message history
- streaming lifecycle metadata

Use Zustand for client UI state.

- active conversation id
- draft input
- citation drawer open/closed
- streaming status
- selected source preview

### Route Strategy

Add assistant as a dedicated surface, not mixed into existing lesson pages initially.

Suggested routes once integrated into academy later:

- `/assistant`
- `/assistant/:conversationId`

In phase 1 the `assistant/web` app can run standalone and academy can deep-link into it.

### Streaming UI Behavior

UI responsibilities:

1. send message
2. open SSE stream
3. append `message.delta` text progressively
4. show retrieval/tool indicators
5. attach citations as they arrive
6. mark answer complete on `done`
7. recover gracefully on disconnect or retryable error

The frontend should render a clear difference between:

- final answer text
- source citations
- suggested next actions
- system/tool status messages

## Harness Applied To Assistant Itself

Assistant should be built using harness principles, not only talk about them.

### Instruction Subsystem

Add `assistant/AGENTS.md` with:

- repo shape
- exact commands
- data source allowlist
- definition of done
- eval commands
- tracing expectations

### Tool Subsystem

Use narrow business tools only. No generic filesystem or shell tools for user-facing runtime.

### Environment Subsystem

Pin Node version, `pnpm` version if needed, workspace commands, Docker services, env schema, and migration workflow.

### State Subsystem

Persist conversations, retrieval traces, eval outcomes, and generated harness blueprints.

### Feedback Subsystem

Require API tests, retrieval tests, citation tests, and golden question evals.

### Observability

Every chat turn should leave a trace summary:

- intent class
- retrieved chunk ids
- tools called
- duration
- error if any
- citation count

## Chat Flow

```text
User sends question
  -> Fastify validates request
  -> Load or create conversation state
  -> Intent classification
  -> Retrieve local context
  -> Run OpenAI Agent SDK agent with narrow tools
  -> Stream structured events to frontend
  -> Persist answer, citations, trace summary
  -> Suggest next prompts
```

Detailed flow:

1. User types a question in web chat.
2. Web sends request with `conversationId`, `message`, and optional `mode`.
3. API validates and stores inbound message.
4. API classifies intent into one of:
   - academy explanation
   - source lookup
   - harness design request
   - unsupported or ambiguous
5. Retrieval service builds query and fetches candidate chunks.
6. Agent runs with instructions plus bounded context bundle.
7. Agent may call only narrow local tools.
8. Backend maps streamed run events to SSE events.
9. UI renders text, citations, and suggestions incrementally.
10. Backend stores final answer and trace summary.

## Harness-Design Support Flow

One important product behavior is helping a user design a harness for a business workflow.

Example prompt:

`Tôi muốn build harness cho team legal review contract bằng Claude Code.`

Expected assistant behavior:

1. Ask for missing inputs if question is underspecified.
2. Identify workflow type, risk, approval needs, and proof expectations.
3. Return a structured blueprint:
   - goal
   - human role
   - agent role
   - control plane docs
   - execution plane tools
   - risk lanes
   - validation ladder
   - trace schema
   - starter `AGENTS.md` sections
4. Cite lessons/docs that justify each recommendation.

This makes the assistant not only a Q&A bot, but a harness design copilot.

## Data Model

Core entities:

- `Conversation`
- `Message`
- `DocumentSource`
- `DocumentChunk`
- `DocumentEmbedding`
- `ChatTrace`

Suggested shape:

### conversations

- `id`
- `title`
- `created_at`
- `updated_at`

### messages

- `id`
- `conversation_id`
- `role`
- `content`
- `citations_json`
- `suggestions_json`
- `trace_id`
- `created_at`

### document_sources

- `id`
- `source_path`
- `content_type`
- `slug`
- `title`
- `route`
- `checksum`
- `updated_at`

### document_chunks

- `id`
- `document_source_id`
- `section_heading`
- `chunk_index`
- `content`
- `token_estimate`

### document_embeddings

- `chunk_id`
- `embedding`

### chat_traces

- `id`
- `conversation_id`
- `message_id`
- `intent`
- `retrieved_chunk_ids_json`
- `tool_calls_json`
- `latency_ms`
- `status`
- `error_summary`
- `created_at`

## Verification Strategy

### Unit Tests

- markdown parser
- chunker
- citation formatter
- intent classifier heuristics if deterministic
- event mappers for streaming

### Integration Tests

- Fastify route validation
- DB persistence for conversations/messages
- ingestion pipeline into Postgres
- retrieval returns expected chunk set for known queries

### End-to-End Tests

- chat message round-trip with mocked model or test agent fixture
- streaming UI consumes SSE correctly
- citations render and link to source routes

### Eval Set

Maintain a small golden-question suite.

Examples:

- `Feature list là gì?`
- `Bài nào nói về orchestrator và sub-agent?`
- `Verification gate khác E2E test như thế nào?`
- `Thiết kế harness cho team QA automation dựa trên local docs.`

Each eval checks:

- answer grounded in local docs
- correct citation count
- no unsupported external claim
- useful next suggestions

## Delivery Phases

### Phase 1: Spec and harness contract

- write design doc
- define event schema
- define retrieval source map
- define golden questions

### Phase 2: Monorepo and backend skeleton

- `pnpm` workspace
- `turbo` pipeline
- Fastify app
- env schema
- health route
- chat stream route shell

### Phase 3: RAG ingestion and retrieval

- markdown parsing
- chunking
- embeddings
- Postgres storage
- retrieval API and tests

### Phase 4: Agent runtime and streaming

- assistant prompt
- local tools
- structured SSE event adapter
- tracing
- conversation persistence

### Phase 5: Frontend chat UI

- standalone assistant web app
- streaming message renderer
- citations and source linking
- conversation restore
- suggested prompts

### Phase 6: Harness-design copilot behavior

- question scaffolding for business workflow input
- blueprint output schema
- citations back to academy content

### Phase 7: Verification and hardening

- golden Q&A evals
- retrieval quality tests
- citation tests
- API integration tests
- basic E2E tests

## Risks And Mitigations

### Risk: retrieval quality weak on Vietnamese phrasing

Mitigation:

- keep chunk titles and headings in metadata
- add keyword fallback
- add evals using real Vietnamese queries

### Risk: agent hallucinates beyond local docs

Mitigation:

- phase 1 bans web fallback
- output guardrail requires citations or explicit uncertainty

### Risk: streaming UI complexity leaks model event details into UI code

Mitigation:

- create typed server event adapter in backend
- frontend only consumes stable app-level events

### Risk: academy and assistant drift apart

Mitigation:

- ingestion points directly to `academy/content/**`
- reindex command included in dev workflow

### Risk: overbuilding multi-agent too early

Mitigation:

- single-agent phase 1
- add specialist agents only after eval evidence shows need

## Open Questions Deferred To Implementation Plan

- embedding model choice and storage type for Postgres vector support
- exact SSE vs chunked fetch transport decision
- whether to expose `assistant/web` under separate port or reverse proxy through academy shell first
- auth strategy if assistant becomes public-facing later

## Recommendation Summary

- Use `assistant/` as a standalone `pnpm` + `turbo` TypeScript monorepo.
- Start with one main agent plus narrow local-doc tools.
- Use local-doc-only RAG in phase 1.
- Stream structured SSE events from Fastify to React UI.
- Persist conversations and traces in Postgres.
- Apply harness principles to the assistant itself from day one.

## Success Criteria

Phase 1 is successful when all are true:

1. User can ask a harness question in chat and receive a streamed answer.
2. Answer cites correct local academy/docs/template sources.
3. Assistant can suggest the next relevant lesson or project.
4. Assistant can output a structured harness blueprint for a business workflow.
5. Golden eval questions pass at an acceptable baseline.
6. Every chat turn has a trace summary for debugging and improvement.
