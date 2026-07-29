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
    ['/#/explore', /^Explore.*Control Atlas$/],
    ['/#/search?q=AC-2', /^AC-2.*Search.*Control Atlas$/],
    ['/#/build', /^Build.*Control Atlas$/],
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

  await gotoApp(page, '/#/resources/official-nist-sp800-53-r5');
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
  await expect(page.getByText('What do you want to trace?', { exact: true })).toBeVisible();

  await gotoApp(page, '/#/commons-detail?id=official-nist-sp800-53-r5');
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

test('Explore renders the ancestry chooser without hydrating the graph UI', async ({ page }) => {
  test.setTimeout(90000);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await gotoApp(page, '/#/explore');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText('What do you want to trace?', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /A published structure/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /The RMF process/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Source starting points/ })).toBeVisible();
  await expect(page.locator('.react-flow')).toHaveCount(0);
  expect(
    requests.some((url) =>
      /\/atlas-node-index\.json(?:\.gz)?(?:\?|$)/.test(url),
    ),
  ).toBe(false);
  expect(
    requests.some((url) => /\/nodes\.json(?:\.gz)?(?:\?|$)/.test(url)),
  ).toBe(false);
  expect(
    requests.some((url) => /\/edges\.json(?:\.gz)?(?:\?|$)/.test(url)),
  ).toBe(false);
  expect(requests.some((url) => /RelationshipGraph-/.test(url))).toBe(false);
});
