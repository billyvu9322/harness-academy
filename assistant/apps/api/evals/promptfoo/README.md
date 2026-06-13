# Promptfoo Eval Flow

This directory contains the Promptfoo harness for the Assistant Agent.

## Test Flow

One Promptfoo test case runs through these stages:

1. Promptfoo loads a test case.
2. Promptfoo renders the configured prompt template using `vars.question`.
3. `evals/promptfoo/provider.ts` receives the rendered prompt and calls `assistant.runMessage(...)`.
4. The assistant returns:
   - `output`: final answer text
   - `metadata.citations`: provenance sections actually read
   - `metadata.toolCalls`: tools used during the run
5. `evals/promptfoo/assert-grounding.cjs` evaluates the output.
6. The assertion returns `{ pass, score, reason }`.
7. Promptfoo marks the test as Passed or Failed based on `pass`.

## Where `question` comes from

Prompt templates use:

```yaml
prompts:
  - '{{question}}'
```

`question` is supplied per test case in `vars.question`.

Examples:

- `evals/promptfoo/tests.ts` generates golden tests from `src/evals/goldenQuestions.ts`
- `evals/promptfoo/generated-tests.ts` returns synthetic/generated cases

## What `expectedBehavior` means

`expectedBehavior` lives in each test case's `metadata`, not in `vars`.

Supported values:

- `grounded`
- `refusal`
- `uncertain`

### `grounded`

Use when the assistant should answer from the local corpus.

Typical expectations:

- citations present
- tool calls include docs access
- answer contains required concepts/keywords

### `refusal`

Use when the assistant should reject the request, for example:

- prompt injection
- out-of-scope request blocked by guardrails

Typical expectations:

- no citations
- usually no docs-read tools
- refusal/safety wording appears in output

### `uncertain`

Use when the request is related to the product domain, but the local corpus does not cover the answer.

Typical expectations:

- no fabricated citations
- answer admits the docs do not contain the answer

## Why Promptfoo marks a test as Passed or Failed

Promptfoo itself does not know business truth.

It only runs the configured assertion and uses the returned result.

This means:

- a guardrail refusal is **Passed** when the test case expects `expectedBehavior: refusal`
- the same guardrail refusal is **Failed** when the test case expects `expectedBehavior: grounded`

In other words, Promptfoo does not decide correctness on its own; `assert-grounding.cjs` does.
