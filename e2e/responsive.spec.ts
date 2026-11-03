import { expect, test } from '@playwright/test';
import { HR, login } from './helpers';

const SIZES = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

for (const size of SIZES) {
  test(`no horizontal page scroll at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await login(page, HR);
    for (const path of ['/', '/employees', '/leave', '/attendance']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${size.width}px`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `test-results/shots/${size.width}${path === '/' ? '-dashboard' : path.replace('/', '-')}.png`, fullPage: true });
    }
  });
}
