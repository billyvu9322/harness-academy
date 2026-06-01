# Trace And Evidence Spec

Every AI-generated or AI-modified testcase needs an evidence report.

## Required Fields

- Feature and scenario ID.
- Risk lane.
- AI role used.
- Files created or updated.
- Validation command.
- Exit code or blocker.
- Artifact paths.
- Failure attribution.
- Human review decision.

## Artifact Paths

- HTML report: `playwright-report/index.html`
- Trace: `test-results/**/trace.zip`
- Screenshot: `test-results/**/*.png`
- Video: `test-results/**/*.webm`

## Harness CLI

Use the local CLI to record simple JSONL trace entries:

```bash
node scripts/bin/harness-cli.mjs intake --type user_story --summary "Login valid user" --lane high-risk
node scripts/bin/harness-cli.mjs trace --summary "Generated login-valid spec" --outcome completed
node scripts/bin/harness-cli.mjs query traces
```

The CLI stores records in `.harness/records.jsonl`.
