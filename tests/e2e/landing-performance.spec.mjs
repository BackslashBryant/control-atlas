import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('landing presents the translation-first hero and primary entry paths', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible();
  await expect(page.getByText('Start with meaning')).toBeVisible();
  await expect(page.getByText('A public cyber compliance reference workspace that turns complex guidance into clear, traceable action.')).toBeVisible();
  await expect(page.locator('.hero-actions').getByRole('button', { name: 'Start Here', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open glossary support', exact: true })).toBeVisible();
  await expect(page.locator('.intent-card').filter({ hasText: 'Library' })).toBeVisible();
  await expect(page.locator('.intent-card').filter({ hasText: 'Compare' })).toBeVisible();
  await expect(page.locator('.intent-card').filter({ hasText: 'Templates' })).toBeVisible();
});

test('landing search and brand-home flow work without legacy onboarding surfaces', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator('.intent-card', { hasText: 'Library' }).getByRole('button', { name: 'Search AC-2' }).click();
  await expect(page.getByRole('heading', { name: 'Search the public reference library' })).toBeVisible();
  await expect(page.locator('#library-results .result-card').first()).toBeVisible();
  await expect(page.locator('#library-results')).toContainText('Account Management');

  await page.getByRole('button', { name: /Control Atlas/ }).click();
  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible();
  await expect(page.getByText('Start with meaning')).toBeVisible();
  await expect(page.getByText('Novice Mode')).toHaveCount(0);
  await expect(page.getByText('Expert Mode')).toHaveCount(0);
});
