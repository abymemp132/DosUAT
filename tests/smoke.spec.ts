import { test, expect } from '@playwright/test';

test.describe('Smoke Test Suite', () => {
  test('Verify Homepage Loads', async ({ page, baseURL }) => {
    console.log(`Running smoke test on: ${baseURL}`);
    await page.goto('/');
    
    // Check for title or major element
    // await expect(page).toHaveTitle(/DosUAT/i);
    
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
