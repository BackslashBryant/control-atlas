import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('landing presents the map-first hero and primary entry paths', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start — see where to begin' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Navigate Maps', exact: true })).toBeVisible();

  // The calm landing is search + buttons only - the primary entry cards
  // live one hop in, on the tile menu the center launch button opens.
  await page.goto('/#/menu');
  await waitForAppReady(page);
  await expect(page.locator('.home-card-grid .intent-card').filter({ has: page.getByText('Search', { exact: true }) })).toBeVisible();
  await expect(page.locator('.home-card-grid .intent-card').filter({ hasText: 'Research · Learn' })).toBeVisible();
  await expect(page.locator('.home-card-grid .intent-card').filter({ hasText: 'Navigate Maps' })).toBeVisible();
  await expect(page.locator('.home-card-grid .intent-card').filter({ hasText: 'Build · Create' })).toBeVisible();
});

test('landing search and brand-home flow work without legacy onboarding surfaces', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/?view=explore');
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Explore the control landscape', level: 1 })).toBeVisible({
    timeout: 90000,
  });

  await page.locator('.site-header button.brand').click({ force: true });
  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText('Novice Mode')).toHaveCount(0);
  await expect(page.getByText('Expert Mode')).toHaveCount(0);
});
