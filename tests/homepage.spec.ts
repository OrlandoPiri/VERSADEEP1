import { test, expect } from '@playwright/test';

test('homepage shows promotions', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article')).toHaveCount(20);
});
