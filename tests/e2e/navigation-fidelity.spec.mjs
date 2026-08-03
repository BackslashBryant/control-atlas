import { expect, test } from '@playwright/test';
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('canonical routes set human-readable document titles', async ({ page }) => {
  /** @type {Array<[string, RegExp]>} */
  const cases = [
    ['/#/', /Control Atlas/],
    ['/#/explore', /^Atlas.*Control Atlas$/],
    ['/#/search?q=AC-2', /^AC-2.*Library.*Control Atlas$/],
    ['/#/build', /^Documents.*Control Atlas$/],
    ['/#/resources', /^Resources.*Control Atlas$/],
    ['/#/compare', /^Compare.*Control Atlas$/],
    ['/#/about', /^About.*Control Atlas$/],
    ['/#/total-nonsense-xyz', /^Page not found.*Control Atlas$/],
  ];
  for (const [route, titlePattern] of cases) {
    await gotoApp(page, route);
    await expect(page).toHaveTitle(titlePattern, { timeout: 15000 });
  }
});

test('detail titles resolve official entity names instead of IDs', async ({ page }) => {
  await gotoApp(page, '/#/record/nist-800-53/AC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveTitle(/^AC-2.*Account Management.*Control Atlas$/, { timeout: 20000 });

  await gotoApp(page, '/#/resources/official-nist-oscal');
  await waitForAppReady(page);
  await expect(page).toHaveTitle(/NIST.*Control Atlas$/, { timeout: 20000 });
});

test('retired aliases resolve to an honest not-found state instead of a canonical redirect', async ({ page }) => {
  await gotoApp(page, '/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/atlas-map/);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

  await gotoApp(page, '/#/explore?q=AC-2&objectType=control');
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.locator('.atlas-trunk-banner')).toContainText('Cybersecurity');

  await gotoApp(page, '/#/commons-detail?id=official-nist-oscal');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('invalid link settings are discarded with visible recovery', async ({ page }) => {
  await gotoApp(page, '/#/explore?relationshipView=unsupported&sourceView=unknown&bogus=value');
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.locator('.route-recovery')).toContainText('unsupported link settings');
});

test('path-style legacy link remains on the static not-found page', async ({ page }) => {
  await page.goto('/explore?q=AC-2');
  await expect(page).toHaveTitle('Page not found | Control Atlas');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'the Control Atlas home page' })).toBeVisible();
});

test('header search submits to canonical Search and carries focus to results', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, '/#/search');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole('button', { name: 'Open search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search Control Atlas' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('searchbox', { name: 'Search Control Atlas' });
  await input.fill('account management');
  await input.press('Enter');

  await expect(page).toHaveURL(/#\/search\?.*q=account/);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator('#library-results')).toBeFocused({ timeout: 15000 });
});

test('Explore landing renders the trunk and limbs, not the heavy graph map UI', async ({ page }) => {
  test.setTimeout(90000);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await gotoApp(page, '/#/explore');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // The landing now renders the trunk + nine limbs (from the organizing spine),
  // so it does load the graph data — but not the heavy react-flow relationship map.
  await expect(page.locator('.atlas-trunk-banner')).toContainText('Cybersecurity');
  await expect(page.locator('.atlas-limb-card')).toHaveCount(9);
  await expect(page.locator('.react-flow')).toHaveCount(0);
  expect(requests.some((url) => /RelationshipGraph-/.test(url))).toBe(false);
});
