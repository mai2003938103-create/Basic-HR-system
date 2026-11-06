import { expect, test } from '@playwright/test';
import { EMPLOYEE, login } from './helpers';

test('employee checks in and out', async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto('/attendance');
  await page.getByRole('button', { name: 'ລົງເວລາເຂົ້າວຽກ' }).click();
  await expect(page.getByRole('button', { name: 'ລົງເວລາເລີກວຽກ' })).toBeVisible();
  await page.getByRole('button', { name: 'ລົງເວລາເລີກວຽກ' }).click();
  await expect(page.getByText('ລົງເວລາຄົບແລ້ວມື້ນີ້')).toBeVisible();
  await expect(page.locator('table').getByRole('row')).toHaveCount(2);
});
