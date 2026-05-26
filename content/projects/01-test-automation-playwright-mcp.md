---
title: "Project 01 — Test Automation Workflow với Playwright MCP"
description: "Build agent workflow tự sinh + chạy E2E test bằng browser thật. Áp dụng đầy đủ các lectures + skills."
order: 1
duration: "60-90 phút thực hành"
tags: [project, e2e, playwright, mcp]
---

## Mục tiêu

Xây 1 workflow harness hoàn chỉnh để agent **tự** test 1 web app:

1. Đọc spec test (markdown)
2. Generate Playwright test
3. Chạy thật bằng browser
4. Verify result với evidence (screenshot, network log)
5. Self-fix nếu test fail (giới hạn retry)
6. Update plan + cleanup

→ Đây là mini-harness áp dụng mọi nguyên tắc đã học.

## Tiền điều kiện

- Cài [Claude Code](https://docs.claude.com/en/docs/agents-and-tools/claude-code) hoặc Codex
- Node 20+, pnpm
- 1 web app sample để test (sẽ dùng demo todomvc)

## Bước 0 — Setup repo

```bash
mkdir agent-test-automation && cd agent-test-automation
git init
pnpm init
pnpm add -D @playwright/test playwright
pnpm exec playwright install chromium
```

Tạo cấu trúc:

```bash
mkdir -p .claude/skills/{init-session,test-generator,verify-test,cleanup}
mkdir -p docs/{plans,specs,reports}
mkdir -p tests/e2e
```

## Bước 1 — Memory file

`CLAUDE.md`:

```markdown
# Agent Test Automation

## Mission
Generate + run Playwright E2E tests from human-written specs.
Verify with real browser via Playwright MCP.

## Stack
- Playwright (chromium)
- Node 20, TypeScript
- Target SUT: TodoMVC at https://todomvc.com/examples/react/dist/

## Commands
- Test: `pnpm playwright test`
- Test headed: `pnpm playwright test --headed`
- Report: `pnpm playwright show-report`

## Rules
- ALWAYS use Playwright MCP for ad-hoc browser exploration
- NEVER claim test passes without running playwright
- ALL test files go to tests/e2e/
- ONE spec file → ONE test file (1:1 mapping)
- Max 3 retry on test fail; if still fail, escalate to user

## Workflow
1. User writes spec in docs/specs/<name>.md
2. Invoke skill `test-generator` to create test
3. Invoke skill `verify-test` to run + capture evidence
4. Update docs/reports/<name>.md
```

## Bước 2 — MCP setup

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          { "type": "command", "command": "cat CLAUDE.md" },
          { "type": "command", "command": "git status --short" }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "git status --short" }
        ]
      }
    ]
  }
}
```

## Bước 3 — Init skill

`.claude/skills/init-session/SKILL.md`:

```markdown
---
name: init-session
description: |
  Run at session start for test automation work. Loads CLAUDE.md,
  checks Playwright install, identifies pending specs.
---

1. Read CLAUDE.md
2. Run: `pnpm exec playwright --version`
3. List `docs/specs/*.md` — pending specs without report
4. List `docs/reports/*.md` — done specs
5. Summarize: "X specs pending, Y done. Tackle which first?"
6. Wait for user.
```

## Bước 4 — Spec example

`docs/specs/add-todo.md`:

```markdown
# Spec: Add a new todo

## Scenario
User opens TodoMVC, adds new todo "Buy milk", confirms it appears.

## Steps
1. Navigate to https://todomvc.com/examples/react/dist/
2. Type "Buy milk" into the new todo input
3. Press Enter
4. Verify "Buy milk" appears in the todo list
5. Verify count shows "1 item left"

## Acceptance
- Todo text exactly "Buy milk"
- Counter "1 item left" visible
- New input field cleared after submit
- Screenshot saved to docs/reports/add-todo-screenshot.png
```

## Bước 5 — Test generator skill

`.claude/skills/test-generator/SKILL.md`:

```markdown
---
name: test-generator
description: |
  Generate Playwright test from spec markdown. Use when user
  asks to convert spec to test, or generate test from docs/specs/*.md.
---

# Generator protocol

## Step 1: Read spec
Read full content of docs/specs/<name>.md

## Step 2: Explore SUT (optional but recommended)
Use Playwright MCP to:
- mcp__playwright__browser_navigate(url from spec)
- mcp__playwright__browser_snapshot() — get DOM structure
- Identify selectors (prefer role-based: getByRole, getByLabel)

## Step 3: Generate test file
Create tests/e2e/<name>.spec.ts following template:

```typescript
import { test, expect } from '@playwright/test'

test.describe('<spec name>', () => {
  test('<scenario>', async ({ page }) => {
    await page.goto('<url>')
    // steps from spec, using stable selectors
    await page.getByPlaceholder('What needs to be done?').fill('Buy milk')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()
    await expect(page.getByText('1 item left')).toBeVisible()
    await page.screenshot({
      path: 'docs/reports/<name>-screenshot.png'
    })
  })
})
```

## Rules
- ONE test() per scenario in spec
- Use role/label selectors, NOT CSS classes
- Add explicit waits via expect().toBeVisible()
- Screenshot per acceptance criterion
- NEVER use sleep/timeout (use expect waits)

## Output
- Path to generated file
- Diff summary
- Next: invoke verify-test
```

## Bước 6 — Verify skill (gate)

`.claude/skills/verify-test/SKILL.md`:

```markdown
---
name: verify-test
description: |
  MUST run before claiming test done. Runs playwright, captures
  evidence, updates report. Block on fail.
---

# Verify protocol

## Step 1: Run test
```bash
pnpm playwright test tests/e2e/<name>.spec.ts --reporter=json > /tmp/result.json
```

## Step 2: Parse result
- Read /tmp/result.json
- Get pass/fail count
- Capture stderr if any

## Step 3: If pass
Update docs/reports/<name>.md:
```markdown
# Report: <name>
- Status: ✓ PASS
- Run at: <ISO timestamp>
- Duration: <ms>
- Evidence:
  - Test output (paste exact)
  - Screenshot: docs/reports/<name>-screenshot.png
```

## Step 4: If fail
- DO NOT claim done
- Capture failure trace
- Identify reason (selector wrong / timing / assertion)
- Retry max 3 times after fix
- If still fail after 3 → escalate user with:
  - Test code
  - Last 3 attempts log
  - Suggested next step

## Step 5: Done declaration (only after pass)
```
## Verify complete
- Test: ✓ <test name>
- Duration: <ms>
- Evidence: docs/reports/<name>.md
- Screenshot: docs/reports/<name>-screenshot.png
```

## Anti-pattern
❌ Claim done without running
❌ Edit test until it pass without understanding fail
❌ Skip screenshot because "already verified visually"
```

## Bước 7 — Cleanup skill

`.claude/skills/cleanup/SKILL.md`:

```markdown
---
name: cleanup
description: Run before ending session. Cleans Playwright trace, updates plan.
---

1. Clean Playwright cache: `rm -rf test-results/ playwright-report/.cache`
2. git status — show diff
3. List specs done this session vs pending
4. Update docs/plans/test-automation.md:
   - Mark done: <list>
   - Pending: <list>
5. Commit message suggestion
```

## Bước 8 — Plan file

`docs/plans/test-automation.md`:

```markdown
# Plan: TodoMVC test coverage

## Goal
Cover core TodoMVC flows via Playwright + agent workflow.

## Specs
- [ ] add-todo
- [ ] toggle-complete
- [ ] delete-todo
- [ ] filter-active-completed
- [ ] clear-completed
- [ ] persistence-reload

## Progress
- 2026-05-21: setup harness, init repo
```

## Bước 9 — Run end-to-end

Mở Claude Code trong repo:

```
User: tackle add-todo spec

Agent: [init-session skill runs]
       6 specs pending, 0 done. Start with add-todo.
       Reading docs/specs/add-todo.md...
       
       [test-generator skill]
       Exploring SUT with Playwright MCP...
       [browser_navigate, browser_snapshot]
       Identified selectors:
       - input: getByPlaceholder("What needs to be done?")
       - count: getByText(/\d+ items? left/)
       
       Generating tests/e2e/add-todo.spec.ts...
       [Edit tool creates file]
       
       [verify-test skill]
       Running: pnpm playwright test tests/e2e/add-todo.spec.ts
       
       Result:
       ```
       Running 1 test using 1 worker
         ✓ add-todo > User adds new todo (2.3s)
         1 passed (2.5s)
       ```
       Screenshot saved.
       
       Updating docs/reports/add-todo.md... ✓
       
       Done. Evidence:
       - Test pass output above
       - docs/reports/add-todo-screenshot.png
       - docs/reports/add-todo.md
       
       [cleanup skill]
       Plan updated: 1/6 done.

User: nice, do all remaining
       
Agent: [loops through each spec]
```

## Bước 10 — Verify áp dụng đúng harness principle

Check list:

- [x] **L1** Init phase tách riêng (init-session skill)
- [x] **L2** Harness layer rõ (skill / tool / hook / permission)
- [x] **L3** Repo as SoR (specs, reports, plan trong repo)
- [x] **L4** Progressive disclosure (4 skill nhỏ, không 1 file mono)
- [x] **L5** Continuity (plan file persistent)
- [x] **L6** Init phase enforce (SessionStart hook + skill)
- [x] **L7** Scope lock (1 spec → 1 test file, rules trong CLAUDE.md)
- [x] **L8** Feature list = spec items
- [x] **L9** Verification gate (verify-test skill block)
- [x] **L10** E2E qua Playwright thật, không mock
- [x] **L11** Observability (report file + screenshot evidence)
- [x] **L12** Cleanup skill + hook SessionEnd

→ **12/12 nguyên tắc áp dụng. Đây là harness production-grade.**

## Bước 11 — Nâng cấp: Orchestrator + 3 Sub-agent

Đến đây bạn có **single-agent workflow** chạy ngon. Khi muốn xử lý **nhiều spec cùng lúc** hoặc spec lớn, scale lên orchestrator pattern.

### Vì sao nâng cấp?

- Single agent chạy 10 spec sequential → 30 phút + context đầy
- Orchestrator + 3 sub-agent parallel → 10 phút + context sạch

### Sơ đồ luồng

<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#0f172a;border-radius:12px;padding:12px">
  <defs>
    <marker id="aL" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#fb923c"/>
    </marker>
    <marker id="aG" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#4ade80"/>
    </marker>
  </defs>

  <rect x="240" y="20" width="160" height="40" rx="8" fill="#334155"/>
  <text x="320" y="45" text-anchor="middle" fill="white" font-family="JetBrains Mono" font-size="11">docs/specs/*.md</text>

  <rect x="230" y="90" width="180" height="55" rx="10" fill="#ed7220"/>
  <text x="320" y="115" text-anchor="middle" fill="white" font-family="Inter" font-weight="700" font-size="15">Orchestrator</text>
  <text x="320" y="133" text-anchor="middle" fill="#fde7d3" font-family="Inter" font-size="10">phân spec → dispatch</text>

  <line x1="320" y1="60" x2="320" y2="90" stroke="#94a3b8" stroke-width="2" marker-end="url(#aL)"/>

  <rect x="20" y="180" width="180" height="80" rx="10" fill="#0891b2" opacity="0.85"/>
  <text x="110" y="206" text-anchor="middle" fill="white" font-family="Inter" font-weight="600" font-size="13">🔍 Explorer</text>
  <text x="110" y="225" text-anchor="middle" fill="#cffafe" font-family="Inter" font-size="10">browser snapshot</text>
  <text x="110" y="240" text-anchor="middle" fill="#cffafe" font-family="Inter" font-size="10">tìm selector ổn định</text>
  <text x="110" y="255" text-anchor="middle" fill="#67e8f9" font-family="JetBrains Mono" font-size="9">Playwright MCP</text>

  <rect x="230" y="180" width="180" height="80" rx="10" fill="#7c3aed" opacity="0.85"/>
  <text x="320" y="206" text-anchor="middle" fill="white" font-family="Inter" font-weight="600" font-size="13">✏️ Writer</text>
  <text x="320" y="225" text-anchor="middle" fill="#e9d5ff" font-family="Inter" font-size="10">gen test.spec.ts</text>
  <text x="320" y="240" text-anchor="middle" fill="#e9d5ff" font-family="Inter" font-size="10">từ spec + selector</text>
  <text x="320" y="255" text-anchor="middle" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9">Read, Edit, Write</text>

  <rect x="440" y="180" width="180" height="80" rx="10" fill="#16a34a" opacity="0.85"/>
  <text x="530" y="206" text-anchor="middle" fill="white" font-family="Inter" font-weight="600" font-size="13">✓ Verifier</text>
  <text x="530" y="225" text-anchor="middle" fill="#bbf7d0" font-family="Inter" font-size="10">chạy playwright</text>
  <text x="530" y="240" text-anchor="middle" fill="#bbf7d0" font-family="Inter" font-size="10">capture evidence</text>
  <text x="530" y="255" text-anchor="middle" fill="#86efac" font-family="JetBrains Mono" font-size="9">Bash, Read</text>

  <line x1="280" y1="145" x2="125" y2="180" stroke="#fb923c" stroke-width="2" marker-end="url(#aL)"/>
  <line x1="320" y1="145" x2="320" y2="180" stroke="#fb923c" stroke-width="2" marker-end="url(#aL)"/>
  <line x1="360" y1="145" x2="525" y2="180" stroke="#fb923c" stroke-width="2" marker-end="url(#aL)"/>

  <text x="320" y="168" text-anchor="middle" fill="#fde7d3" font-family="JetBrains Mono" font-size="10">1 → 2 → 3 (sequential per spec)</text>

  <line x1="110" y1="260" x2="280" y2="290" stroke="#4ade80" stroke-width="2" marker-end="url(#aG)"/>
  <line x1="320" y1="260" x2="320" y2="290" stroke="#4ade80" stroke-width="2" marker-end="url(#aG)"/>
  <line x1="530" y1="260" x2="360" y2="290" stroke="#4ade80" stroke-width="2" marker-end="url(#aG)"/>

  <rect x="240" y="290" width="160" height="25" rx="6" fill="#1e293b" stroke="#4ade80" stroke-width="1.5"/>
  <text x="320" y="307" text-anchor="middle" fill="#86efac" font-family="JetBrains Mono" font-size="10">docs/reports/*.md</text>
</svg>

### 3 sub-agent file

`.claude/agents/explorer.md`:

```markdown
---
name: explorer
description: Use to explore web app via Playwright MCP and identify stable selectors for a given scenario. Returns selector map.
tools: [mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, Read]
---

# Explorer

## Mission
Đọc spec, mở browser, tìm selector ổn định.

## Workflow
1. Read spec file
2. browser_navigate to URL
3. browser_snapshot → analyze DOM
4. Pick role-based selector (getByRole, getByLabel, getByPlaceholder)
5. Avoid CSS class (fragile)

## Output
```yaml
url: https://...
selectors:
  input_new_todo: 'getByPlaceholder("What needs to be done?")'
  count_label: 'getByText(/\\d+ items? left/)'
  todo_item: 'getByRole("listitem")'
notes:
  - Counter text uses singular "item" for 1
  - Enter key submits (no button)
```

## Rules
- NEVER write test code (no Write/Edit on tests/)
- Cap output 400 token
- Cite snapshot ref when uncertain
```

`.claude/agents/writer.md`:

```markdown
---
name: writer
description: Use to generate Playwright test from spec + explorer selectors. Outputs .spec.ts file path.
tools: [Read, Write, Edit]
---

# Writer

## Input
- Spec file path
- Selector map from explorer (YAML)

## Workflow
1. Read spec + selector map
2. Generate tests/e2e/<name>.spec.ts
3. Use exact selectors from map
4. Add screenshot per acceptance criterion

## Output
```yaml
file: tests/e2e/add-todo.spec.ts
loc: 28
scenarios: 1
```

## Rules
- NEVER run test (no Bash)
- ONE test() per scenario
- expect().toBeVisible() for wait, no sleep
- Cap output 300 token
```

`.claude/agents/verifier.md`:

```markdown
---
name: verifier
description: Use to run a Playwright test file, capture pass/fail + evidence. Returns structured result.
tools: [Bash, Read]
---

# Verifier

## Input
- Path to .spec.ts file
- Spec name

## Workflow
1. Run: `pnpm playwright test <file> --reporter=json > /tmp/r.json`
2. Parse result
3. If pass: write docs/reports/<name>.md with evidence
4. If fail: capture trace, return reason

## Output (pass)
```yaml
status: pass
file: tests/e2e/add-todo.spec.ts
duration_ms: 2300
screenshot: docs/reports/add-todo-screenshot.png
report: docs/reports/add-todo.md
```

## Output (fail)
```yaml
status: fail
file: tests/e2e/add-todo.spec.ts
reason: "selector getByText('1 item left') not found"
suggestion: "check pluralization — actual is 'items left'"
```

## Rules
- NEVER edit test (no Edit/Write on tests/)
- ONLY edit docs/reports/
- Cap output 300 token
```

### Orchestrator skill

`.claude/skills/orchestrate-tests/SKILL.md`:

```markdown
---
name: orchestrate-tests
description: |
  Use to run full test generation pipeline for one or more specs.
  Dispatches explorer → writer → verifier per spec. Trigger: tackle spec,
  generate tests, run all specs.
---

# Orchestrator workflow

## Single spec (sequential chain)

For each spec:
1. Dispatch `explorer` → get selector map
2. Dispatch `writer` with spec + selectors → get test file
3. Dispatch `verifier` with test file → get pass/fail

Orchestrator NEVER reads SUT DOM, NEVER writes test code, NEVER runs test.
Only dispatches + merges summary.

## Multiple specs (parallel)

If user says "tackle all pending":

For each spec in docs/specs/ (without report):
- Dispatch explorer in parallel (1 message, N Agent calls)

After all explorer done:
- Dispatch writer in parallel for each (using respective selectors)

After all writer done:
- Dispatch verifier in parallel

→ N specs done in 3 rounds parallel instead of 3N sequential calls.

## Final report

```markdown
# Test run · <date>

Specs: <N>
- ✓ pass: <list>
- ✗ fail: <list with reason>

Avg per spec: <s>
Total wall time: <m>
```

## Anti-pattern
❌ Orchestrator reads spec content
❌ Orchestrator runs playwright directly
❌ Sub-agent crosses lane (writer running test, verifier editing test)
❌ Sequential dispatch when specs independent
```

### Khi nào dùng single vs orchestrator?

| Tình huống | Single agent | Orchestrator |
|-----------|-------------|--------------|
| 1 spec đơn giản | ✓ rẻ, nhanh | overkill |
| 1 spec to (10+ scenario) | ổn | ✓ explorer tìm parallel |
| Nhiều spec (5+) | chậm, đầy context | ✓ 3 round parallel |
| Spec phụ thuộc nhau | ✓ giữ state | khó share state |

→ Bắt đầu single. Khi cảm thấy chậm/đầy → upgrade.

### Verify pattern

- [x] L13 — Orchestrator không tự code/test/run
- [x] L13 — Mỗi sub-agent có tool tối thiểu
- [x] L13 — Output structured YAML, ≤ 400 token
- [x] L13 — Parallel dispatch khi specs độc lập
- [x] L13 — 2 tầng (orchestrator + worker), không hơn

→ **13/13 nguyên tắc áp dụng.**

## Mở rộng

- Visual regression: thêm `expect(page).toHaveScreenshot()`
- Multi-browser: matrix chromium/firefox/webkit
- CI: GitHub Actions chạy lại
- Performance gate: Lighthouse via Chrome DevTools MCP
- Self-heal: thêm sub-agent `selector-fixer` khi verifier fail vì selector
- Doc xem [Lecture 13](/lectures/13-orchestrator-va-sub-agent) + [Skill 06](/skills/06-build-sub-agent)

## Kết luận

Cấu phần đã triển khai:
- Repo có harness 7 layer
- 4 skill chuyên trách
- Hook lifecycle full
- E2E thật qua MCP
- Plan / Spec / Report persistent

Pattern khả dụng cho **mọi workflow agent**, không giới hạn ở test:
- Code review automation
- Doc generation
- Refactoring assistant
- Security scanner

Thay cặp spec → test bằng input → output theo domain cụ thể.
