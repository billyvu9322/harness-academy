# Authentication Product Contract

This sample product contract is intentionally small. Replace it with the real product source of truth in a real automation repo.

## Login With Valid Credentials

As a registered user, I can log in with a valid email and password so that I can access my dashboard.

Acceptance criteria:

- User can enter email and password.
- User can submit the login form.
- After successful login, user is redirected to `/dashboard`.
- Dashboard shows the user's display name.
- Login error message is not shown.

## Test Data Contract

- `E2E_USER_EMAIL`: active test user email.
- `E2E_USER_PASSWORD`: matching password for the test user.
- `E2E_USER_DISPLAY_NAME`: display name expected on dashboard.

Secrets must come from the environment or secure CI secret storage. Do not commit credentials.
