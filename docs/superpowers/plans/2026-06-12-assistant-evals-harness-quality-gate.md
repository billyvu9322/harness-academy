# Assistant Evals Harness Quality Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `assistant/apps/api/src/evals` from a small smoke gate into a filtered, JSON-capable, stricter harness eval gate.

**Architecture:** Keep the existing golden-question + judge + score shape. Add small pure modules for run options and reporting, strengthen deterministic scoring, and wire runner flags without changing the assistant runtime surface.

**Tech Stack:** TypeScript, Vitest, `tsx`, existing OpenAI-compatible router client.

---

### Task 1: Scoring Correctness

**Files:**
- Modify: `assistant/apps/api/src/evals/goldenQuestions.ts`
- Modify: `assistant/apps/api/src/evals/score.ts`
- Test: `assistant/apps/api/tests/evals/goldenQuestions.test.ts`
- Test: `assistant/apps/api/tests/evals/score.test.ts`

**Step 1: Write failing tests**

Add tests proving keyword coverage affects pass/fail and out-of-corpus cases fail if citations are present.

**Step 2: Run tests to verify failure**

Run: `pnpm --filter @assistant/api test -- tests/evals/score.test.ts tests/evals/goldenQuestions.test.ts`

Expected: FAIL because current scoring ignores keyword misses and allows citations on uncertain questions.

**Step 3: Implement minimal scoring changes**

Add categories/default fields and enforce keyword/citation checks inside `scoreQuestion`.

**Step 4: Verify green**

Run same targeted tests. Expected: PASS.

---

### Task 2: CLI Options and JSON Reporter

**Files:**
- Create: `assistant/apps/api/src/evals/runOptions.ts`
- Create: `assistant/apps/api/src/evals/reporter.ts`
- Modify: `assistant/apps/api/src/evals/runEvals.ts`
- Test: `assistant/apps/api/tests/evals/runOptions.test.ts`
- Test: `assistant/apps/api/tests/evals/reporter.test.ts`

**Step 1: Write failing tests**

Test `--id`, `--category`, `--json`, `--runs`, `--timeout`, `--model`, and `--judge-model` parsing. Test JSON reporter emits stable summary/results shape.

**Step 2: Run tests to verify failure**

Run: `pnpm --filter @assistant/api test -- tests/evals/runOptions.test.ts tests/evals/reporter.test.ts`

Expected: FAIL because modules do not exist.

**Step 3: Implement minimal modules**

Add pure option parser and JSON/human summary helpers.

**Step 4: Wire runner**

Update `runEvals.ts` to filter cases, repeat runs, honor judge model, support JSON output, and preserve default console behavior.

**Step 5: Verify green**

Run eval tests. Expected: PASS.

---

### Task 3: Judge Model Config

**Files:**
- Modify: `assistant/apps/api/src/config/env.ts`
- Modify: `assistant/apps/api/src/evals/runEvals.ts`

**Step 1: Add optional env field**

Add `EVAL_JUDGE_MODEL` as optional config.

**Step 2: Verify typecheck**

Run: `pnpm --filter @assistant/api typecheck`

Expected: PASS.

---

### Task 4: Final Verification

**Files:**
- All touched files.

**Step 1: Run eval unit tests**

Run: `pnpm --filter @assistant/api test -- tests/evals`

Expected: PASS.

**Step 2: Run typecheck**

Run: `pnpm --filter @assistant/api typecheck`

Expected: PASS.

**Step 3: Inspect changed files**

Run: `git diff -- assistant/apps/api/src/evals assistant/apps/api/tests/evals assistant/apps/api/src/config/env.ts docs/superpowers/plans/2026-06-12-assistant-evals-harness-quality-gate.md`

Expected: Only intended eval/spec/plan changes.
