import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('load resilience shows slow hint and allows offline navigation', async ({ page }) => {
  await page.route('**/data/generated/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await route.continue();
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Preparing library data' })).toBeVisible();
  await expect(page.getByText('longer than usual')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Explore Patterns' }).click();
  await expect(page).toHaveURL(/view=patterns/);
  await expect(page.getByRole('heading', { name: 'Patterns organized around user outcomes' })).toBeVisible();
});

test('load resilience surfaces retry after timeout', async ({ page }) => {
  await page.route('**/data/generated/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    await route.continue();
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText('Library data unavailable')).toBeVisible();
});
