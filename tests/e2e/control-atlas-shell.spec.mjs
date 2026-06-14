import { expect, test } from '@playwright/test';

test('control atlas staged shell exposes the epic 0 navigation and key journeys', async ({ page }) => {
  await page.goto('/');
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });

  await expect(page).toHaveTitle(/Control Atlas/);
  const skipOnboarding = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skipOnboarding.isVisible()) {
    await skipOnboarding.click();
  }
  await expect(primaryNav.getByRole('button', { name: 'Library', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Crosswalks', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Patterns', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Templates', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Provenance', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Start Here', exact: true })).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find the right public entry point before diving into the graph' })).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Crosswalks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build a provenance-aware relationship matrix' })).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Provenance', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Provenance and graph health' })).toBeVisible();
});
