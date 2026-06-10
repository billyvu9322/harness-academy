import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { USERNAME, PASSWORD } from '../test-config';

// This test verifies the login flow itself, so it must start signed OUT —
// override the project's shared storageState with an empty session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication — login (AUTH-LOGIN-001)', () => {
  test('valid admin credentials reach the authenticated app shell', async ({ page }) => {
    test.skip(!USERNAME || !PASSWORD, 'E2E_USERNAME / E2E_PASSWORD not set — documented environment blocker');

    const login = new LoginPage(page);
    await login.goto();
    await login.login(USERNAME, PASSWORD);

    await expect(page).toHaveURL(/\/root\/organizations/);
    await expect(page.getByRole('button', { name: 'Organization Management' })).toBeVisible();
    await expect(page.getByText('Root Tenant')).toBeVisible();
  });
});
