import { expect, type Page } from '@playwright/test';

export const DEMO_PASSWORD = 'Demo1234';
// seed-demo: EMP0001 = HR manager (hr_admin), EMP0006 = Finance manager, EMP0007 = Finance employee
export const HR = 'emp0001@demo.systory.la';
export const MANAGER = 'emp0006@demo.systory.la';
export const EMPLOYEE = 'emp0007@demo.systory.la';

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('ອີເມວ').fill(email);
  await page.getByLabel('ລະຫັດຜ່ານ').fill(password);
  await page.getByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'ຜູ້ໃຊ້' }).click();
  await page.getByRole('menuitem', { name: 'ອອກຈາກລະບົບ' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Next Monday and Tuesday (YYYY-MM-DD), always in the future. */
export function nextWeekDates() {
  const d = new Date();
  const add = ((8 - d.getDay()) % 7) || 7;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
  const tue = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 1);
  const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return [iso(mon), iso(tue)];
}
