import { expect, test } from '@playwright/test';
import { login } from './helpers';

// Own accounts so sign-in throttling (5 per minute per account) is not shared with other specs.
const IT_MANAGER = 'emp0011@demo.systory.la';
const IT_STAFF = 'emp0012@demo.systory.la';

// Review Focus 5: deep links work on the production Next.js build.
test('reloading an employee page keeps that page', async ({ page }) => {
  await login(page, IT_MANAGER);
  await page.goto('/employees');
  await page.locator('main tbody tr').first().click();
  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);
  const url = page.url();
  const heading = await page.getByRole('heading', { level: 1 }).first().textContent();
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(heading!.trim());
});

test('a protected address while signed out goes to sign-in and comes back', async ({ page }) => {
  await page.goto('/leave?tab=mine');
  await expect(page).toHaveURL(/\/login\?from=%2Fleave%3Ftab%3Dmine$/);
  await page.getByLabel('ອີເມວ').fill(IT_STAFF);
  await page.getByLabel('ລະຫັດຜ່ານ').fill('Demo1234');
  await page.getByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }).click();
  await expect(page).toHaveURL(/\/leave\?tab=mine$/);
});
