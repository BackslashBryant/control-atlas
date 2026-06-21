import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('landing presents the map-first hero and primary entry paths', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Navigate federal cyber compliance.', exact: true })).toBeVisible();
  await expect(page.locator('.home-hero .eyebrow')).toContainText('CONTROL ATLAS');
  await expect(page.getByText('Find a requirement, see how it connects, and open the next step with source-backed context.')).toBeVisible();
  await expect(page.locator('.hero-actions').getByRole('button', { name: 'Open Atlas Map', exact: true })).toBeVisible();
  await expect(page.locator('.home-card-grid').getByRole('button', { name: /^Atlas Map\b/ })).toBeVisible();
  await expect(page.locator('.home-card-grid').getByRole('button', { name: /^Compare Frameworks\b/ })).toBeVisible();
  await expect(page.locator('.home-card-grid').getByRole('button', { name: /^Templates\b/ })).toBeVisible();
});

test('landing search and brand-home flow work without legacy onboarding surfaces', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/?view=explore');
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Explore the control landscape', level: 1 })).toBeVisible({
    timeout: 90000,
  });

  await page.locator('.site-header button.brand').click({ force: true });
  await expect(page.getByRole('heading', { name: 'Navigate federal cyber compliance.', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText('Novice Mode')).toHaveCount(0);
  await expect(page.getByText('Expert Mode')).toHaveCount(0);
});
