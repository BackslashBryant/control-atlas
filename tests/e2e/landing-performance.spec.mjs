import { test, expect } from '@playwright/test';

async function dismissOnboarding(page) {
  const skipOnboarding = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skipOnboarding.isVisible()) {
    await skipOnboarding.click();
  }
}

test('landing paints before graph artifacts load', async ({ page }) => {
  const graphRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/data/generated/')) graphRequests.push(url);
  });

  await page.goto('/');
  await dismissOnboarding(page);

  await expect(page.locator('#page-title')).toBeVisible();
  await expect(page.locator('#hero-rotating-word')).toBeVisible();
  await expect(page.getByLabel('ID, title, or topic')).toBeVisible();
  await expect(page.locator('.landing-walkthrough')).toBeVisible();

  expect(graphRequests).toHaveLength(0);
});

test('graph loads only after the user searches', async ({ page }) => {
  const graphRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/data/generated/')) graphRequests.push(url);
  });

  await page.goto('/');
  await dismissOnboarding(page);
  expect(graphRequests).toHaveLength(0);

  await page.getByLabel('ID, title, or topic').fill('AC-2');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect.poll(() => graphRequests.length, { timeout: 60000 }).toBeGreaterThan(0);
  await expect(page.getByText('Loading the public compliance map')).toBeHidden({ timeout: 60000 });
  await expect(page.locator('#library-results .item-card').first()).toBeVisible({ timeout: 10000 });
});
