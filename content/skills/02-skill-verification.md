---
title: "Verification Skill — Chặn báo done quá sớm"
description: "Template skill ép verify trước khi claim done. Áp được cho mọi dự án."
order: 2
duration: "6 phút đọc"
tags: [skill, verification, template]
---

## Mục tiêu

Skill này:
- Trigger trước khi agent claim "done"
- Ép chạy test, lint, type-check
- Yêu cầu paste output làm evidence
- Block claim nếu fail

## Full template

`.claude/skills/verification-before-completion/SKILL.md`:

```markdown
---
name: verification-before-completion
description: |
  MUST USE before claiming task done, finished, complete, ready, or working.
  Required before any "commit", "PR", or "ship" action.
  Prevents premature victory declaration.
  Keywords: done, finished, complete, ready, ship, merge.
---

# Verification Protocol

## Rule 0: Evidence before assertion
NEVER say "done" without pasting test output.
NEVER say "should work" — verify or say "cannot verify because X".

## Step-by-step

### 1. Type check
```bash
npm run type-check
```
Paste full output. Must be empty.

### 2. Lint
```bash
npm run lint
```
Zero error. Warning ok if pre-existing.

### 3. Unit test
```bash
npm test -- --run
```
All pass. Paste summary line.

### 4. E2E test (if UI/API changed)
```bash
npm run test:e2e
```
All green.

### 5. Map to feature list
For each item in plan:
- ✓ Pass — evidence: <which test>
- ✗ Fail — fix, restart from step 1

### 6. Only after all green
Output template:
```
## Verification complete
- Type check: ✓ (output above)
- Lint: ✓
- Tests: ✓ (12 passed)
- E2E: ✓ (4 scenarios)
- Feature list: 5/5 ✓

Done. Evidence pasted above.
```

## Anti-pattern

❌ "Tests should pass with my changes"
❌ "Looks correct" without running
❌ "I'll skip lint, it's not important"
❌ Claim done before paste output

## Edge case: Can't verify

If verification not possible (no test infra, infra blocked):
SAY EXACTLY:
"I cannot verify because: <reason>.
User please confirm manually: <what to check>."

DO NOT claim done.
```

## Cách wire vô project

### 1. Tạo file

```bash
mkdir -p .claude/skills/verification-before-completion
# paste content above vô SKILL.md
```

### 2. Reference trong CLAUDE.md

```markdown
## Verification

Before claiming any task done:
- Invoke `verification-before-completion` skill
- See `.claude/skills/verification-before-completion/SKILL.md`
```

### 3. Hook ép thêm (optional, mạnh hơn)

`.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$TOOL_INPUT\" | grep -qE '(git commit|gh pr create)'; then npm test || (echo 'BLOCKED: test fail' && exit 2); fi"
          }
        ]
      }
    ]
  }
}
```

→ Hook block commit/PR nếu test fail.

## Variant cho dự án khác

### Python

```bash
ruff check
mypy .
pytest -x
```

### Go

```bash
go vet ./...
golangci-lint run
go test -race ./...
```

### Rust

```bash
cargo clippy -- -D warnings
cargo test
```

→ Skill template giống, command đổi.

## Khi nào skill này KHÔNG đủ?

- Test infra chưa có → bạn phải build trước
- Test slow (> 5 phút) → cân nhắc subset cho gate
- Visual regression → cần Playwright snapshot

→ Mở rộng skill thay vì bỏ.

## Tiếp theo

[Skill: Init / Bootstrap session](/skills/03-skill-init-bootstrap)
