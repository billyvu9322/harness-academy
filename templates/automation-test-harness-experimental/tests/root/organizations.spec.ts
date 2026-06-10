import { test, expect } from '@playwright/test';

/**
 * Sample AUTHENTICATED test. No login here — the session is injected by the
 * shared storageState (this project depends on the `setup` project). This is
 * how every feature test reuses one login and stays authorized.
 */
test.describe('Root — organizations (authenticated)', () => {
  test('signed-in admin lands on organizations with management nav', async ({ page }) => {
    await page.goto('/root/organizations');

    await expect(page).toHaveURL(/\/root\/organizations/);
    await expect(page.getByRole('button', { name: 'Organization Management' })).toBeVisible();
    await expect(page.getByText('Root Tenant')).toBeVisible();
  });
});
