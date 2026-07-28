import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

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
    ['/#/build/resources', /^Resources.*Control Atlas$/],
    ['/#/compare', /^Compare.*Control Atlas$/],
    ['/#/about', /^About.*Control Atlas$/],
    ['/#/total-nonsense-xyz', /^Page not found.*Control Atlas$/],
  ];
  for (const [route, titlePattern] of cases) {
    await page.goto(route);
    await expect(page).toHaveTitle(titlePattern, { timeout: 15000 });
  }
});

test('detail titles resolve official entity names instead of IDs', async ({ page }) => {
  await page.goto('/#/record/nist-800-53/AC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveTitle(/^AC-2.*Account Management.*Control Atlas$/, { timeout: 20000 });

  await page.goto('/#/build/resources/official-nist-sp800-53-r5');
  await waitForAppReady(page);
  await expect(page).toHaveTitle(/NIST.*Control Atlas$/, { timeout: 20000 });
});

test('legacy routes replace to their canonical URL and preserve state', async ({ page }) => {
  await page.goto('/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/explore\?node=nist-800-53%3AAC-2&relationshipView=map/);

  await page.goto('/#/explore?q=AC-2&objectType=control');
  await expect(page).toHaveURL(/#\/search\?q=AC-2&objectType=control/);

  await page.goto('/#/commons-detail?id=official-nist-sp800-53-r5');
  await expect(page).toHaveURL(/#\/build\/resources\/official-nist-sp800-53-r5/);
});

test('invalid link settings are discarded with visible recovery', async ({ page }) => {
  await page.goto('/#/explore?relationshipView=unsupported&sourceView=unknown&bogus=value');
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.locator('.route-recovery')).toContainText('unsupported link settings');
});

test('path-style query link enters canonical Search with its query', async ({ page }) => {
  await page.goto('/explore?q=AC-2');
  await page.waitForURL(/#\/search/, { timeout: 15000 });
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/[?&]q=AC-2/);
  await expect(page.getByRole('heading', { name: 'Search everything in one place' })).toBeVisible();
});

test('header search submits to canonical Search and carries focus to results', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/search');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole('button', { name: 'Open search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search records' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('searchbox', { name: 'Search records' });
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
  await page.goto('/#/explore');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText('What do you want to trace?', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /A framework family tree/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /The RMF process/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /My situation/ })).toBeVisible();
  await expect(page.locator('.react-flow')).toHaveCount(0);
  expect(requests.some((url) => /\/nodes\.json(?:\.gz)?(?:\?|$)/.test(url))).toBe(true);
  expect(requests.some((url) => /\/edges\.json(?:\.gz)?(?:\?|$)/.test(url))).toBe(true);
  expect(requests.some((url) => /RelationshipGraph-/.test(url))).toBe(false);
});

test('template generation fires a trust-styled download toast and disables the button briefly', async ({ page }) => {
  await page.goto('/?view=templates&templateType=security_plan_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  const generate = page.getByRole('button', { name: /Download Security Plan Starter|Preparing download/ });
  await expect(generate).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  const clickPromise = generate.click();
  await expect(generate).toBeDisabled({ timeout: 3000 });
  const download = await downloadPromise;
  await clickPromise;
  expect(download.suggestedFilename()).toMatch(/security-plan-starter.*\.docx$/);
  const toast = page.locator('.generation-status');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/tone-trust/);
  await expect(toast).toContainText('Download started');
  await expect(generate).toBeEnabled();
});
