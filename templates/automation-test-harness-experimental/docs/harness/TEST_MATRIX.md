# Test Matrix

The test matrix maps behavior to proof. AI-generated tests must validate the required behavior, not only produce green runs.

| Behavior | Level | Risk | Required proof | Focused command | Artifact |
| --- | --- | --- | --- | --- | --- |
| Login succeeds with valid credentials | E2E smoke | High | Redirect to dashboard, dashboard visible, display name visible, no login error | `npx playwright test tests/auth/login-valid.spec.ts --trace=on` | HTML report + trace |
| Login rejects invalid password | E2E regression | High | Error visible, URL remains login, dashboard absent | `npx playwright test tests/auth/login-invalid.spec.ts --trace=on` | HTML report + trace |
| Seed login page loads | E2E setup | Normal | Login form is reachable and submit button visible | `npx playwright test tests/seed.spec.ts --trace=on` | HTML report |

## Proof Rules

- Every P0 testcase needs a focused command.
- High-risk flows need trace enabled or retained on failure.
- A passing run is not enough if assertions are weak.
- If the app is unavailable, record an environment blocker rather than fabricating evidence.
