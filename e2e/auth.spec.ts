import { expect, test } from '@playwright/test';
import { EMPLOYEE, HR, MANAGER, login } from './helpers';

test('the first super admin must change the password before using the app', async ({ page }) => {
  await login(page, 'admin@systory.la', 'ChangeMe123');
  await expect(page).toHaveURL(/\/change-password$/);
  await page.getByLabel('ລະຫັດຜ່ານປັດຈຸບັນ').fill('ChangeMe123');
  await page.getByLabel('ລະຫັດຜ່ານໃໝ່', { exact: true }).fill('NewAdmin123');
  await page.getByLabel('ຢືນຢັນລະຫັດຜ່ານໃໝ່').fill('NewAdmin123');
  await page.getByRole('button', { name: 'ບັນທຶກ' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'admin@systory.la', 'NewAdmin123');
  await expect(page.getByRole('heading', { name: 'ໜ້າຫຼັກ' })).toBeVisible();
  await expect(page.locator('aside').getByRole('link', { name: 'ບົດບາດ' }).last()).toBeAttached();
});

test('each role sees its own menu', async ({ page }) => {
  const menu = async () => (await page.locator('aside nav').last().locator('a').allTextContents()).map((s) => s.trim());
  await login(page, EMPLOYEE);
  await expect(page).toHaveURL(/\/attendance$/);
  expect(await menu()).toEqual(['ການເຂົ້າວຽກ', 'ການລາພັກ', 'ຂໍ້ມູນຂອງຂ້ອຍ']);
  await page.context().clearCookies();
  await login(page, MANAGER);
  expect(await menu()).toEqual(['ໜ້າຫຼັກ', 'ພະນັກງານ', 'ພະແນກ', 'ຕຳແໜ່ງ', 'ການເຂົ້າວຽກ', 'ການລາພັກ', 'ຂໍ້ມູນຂອງຂ້ອຍ']);
  await page.context().clearCookies();
  await login(page, HR);
  expect(await menu()).toEqual(['ໜ້າຫຼັກ', 'ພະນັກງານ', 'ພະແນກ', 'ຕຳແໜ່ງ', 'ການເຂົ້າວຽກ', 'ການລາພັກ', 'ຜູ້ໃຊ້ ແລະ ສິດ', 'ຂໍ້ມູນຂອງຂ້ອຍ']);
});

test('the language choice survives a reload', async ({ page }) => {
  await login(page, HR);
  await page.getByRole('button', { name: 'English' }).first().click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'ລາວ' }).first().click();
});
