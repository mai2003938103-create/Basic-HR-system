import { expect, test } from '@playwright/test';
import { EMPLOYEE, MANAGER, login, logout, nextWeekDates } from './helpers';

test('employee requests leave, manager approves, balance goes down', async ({ page }) => {
  const [mon, tue] = nextWeekDates();
  await login(page, EMPLOYEE);
  await page.goto('/leave');
  const annual = page.getByTestId('balance-ANNUAL');
  await expect(annual).toContainText('15');
  await page.getByRole('button', { name: 'ຂໍລາພັກ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: /ປະເພດການລາ/ }).click();
  await page.getByRole('option', { name: 'ລາພັກປະຈຳປີ' }).click();
  await dialog.getByLabel(/ວັນເລີ່ມ/).fill(mon);
  await dialog.getByLabel(/ວັນສິ້ນສຸດ/).fill(tue);
  await expect(dialog.getByText('ຈະນັບເປັນ 2 ວັນເຮັດວຽກ')).toBeVisible();
  await dialog.getByLabel(/ເຫດຜົນ/).fill('ພາຄອບຄົວໄປທ່ຽວ');
  await dialog.getByRole('button', { name: 'ສົ່ງ' }).click();
  await expect(page.getByRole('cell', { name: 'ລໍຖ້າອະນຸມັດ' })).toBeVisible();
  await logout(page);

  await login(page, MANAGER);
  await page.goto('/leave?tab=approvals');
  await page.getByRole('button', { name: 'ອະນຸມັດ' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'ອະນຸມັດ' }).click();
  await expect(page.getByText('ບໍ່ມີຄຳຮ້ອງລໍຖ້າອະນຸມັດ')).toBeVisible();
  await logout(page);

  await login(page, EMPLOYEE);
  await page.goto('/leave');
  await expect(page.getByRole('cell', { name: 'ອະນຸມັດແລ້ວ' })).toBeVisible();
  await expect(page.getByTestId('balance-ANNUAL')).toContainText('13');
});
