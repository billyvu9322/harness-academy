import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { USERNAME, PASSWORD } from './test-config';

/**
 * Auth setup: log in ONCE, save the authenticated session to disk.
 * Every project that depends on `setup` reuses this storageState, so feature
 * tests start already signed in (no per-test login).
 *
 * Credentials come from the gitignored .env (E2E_USERNAME / E2E_PASSWORD).
 */
export const AUTH_FILE = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  setup.skip(!USERNAME || !PASSWORD, 'E2E_PASSWORD not set — documented environment blocker');

  const login = new LoginPage(page);
  await login.goto();
  await login.login(USERNAME, PASSWORD);

  // Confirm we are actually authenticated before saving the session.
  await expect(page).toHaveURL(/\/root\/organizations/);
  await expect(page.getByRole('button', { name: 'Organization Management' })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
