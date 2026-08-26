import { expect, test } from '@playwright/test';

/* global document, window */

import { dismissOnboarding, gotoApp, waitForAppReady } from './support.mjs';

test('PDISP presents only scoped, sourced facts at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, '/#/resources/service-disa-pdisp');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Private Data Internet Service Provider (PDISP)' })).toBeVisible();
  await expect(page.getByText('Review and request DISA private data internet connectivity.', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'What it is' })).toHaveCount(0);
  await expect(page.getByText('Ordering and connection actions require authorized DoD access.', { exact: true })).toBeVisible();
  await expect(page.getByText(/CAC required|\bFree\b|not documented|not stated/i)).toHaveCount(0);
  await expect(page.getByText('Atlas context', { exact: true })).toHaveCount(0);
  await expect(page.locator('.resource-detail-maintenance')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sourced lifecycle and replacement history remain visible', async ({ page }) => {
  await gotoApp(page, '/#/resources/legacy-diacap-transition');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText('Archived', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Replaced by', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /DoDI 8510\.01/ })).toBeVisible();
});
