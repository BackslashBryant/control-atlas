import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

// CATL-61: per-route document.title so browser history, bookmarks, and shared
// tabs read honestly instead of a single generic title.
test('each route sets an honest, human-readable document.title', async ({ page }) => {
  /** @type {Array<[string, RegExp]>} */
  const cases = [
    ['/#/', /Control Atlas — The public map for federal cyber compliance/],
    ['/#/atlas-map', /^Atlas Map — Control Atlas$/],
    ['/#/explore?q=AC-2', /^AC-2 — Explore — Control Atlas$/],
    ['/#/templates', /^Templates — Control Atlas$/],
    ['/#/compare', /^Compare — Control Atlas$/],
    ['/#/about', /^About — Control Atlas$/],
    ['/#/total-nonsense-xyz', /^Page not found — Control Atlas$/],
  ];
  for (const [route, titlePattern] of cases) {
    await page.goto(route);
    await expect(page).toHaveTitle(titlePattern, { timeout: 15000 });
  }
});

// CATL-61: a record page resolves to its official record name once the graph
// loads, not a bare id or a generic label.
test('record pages title with the official record name', async ({ page }) => {
  await page.goto('/#/record/nist-800-53/AC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveTitle(/^AC-2 — Account Management — Control Atlas$/, {
    timeout: 20000,
  });
});

// CATL-47: friendly, guessable URLs resolve to their canonical view.
test('/atlas resolves to the Atlas Map view', async ({ page }) => {
  await page.goto('/#/atlas');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.locator('main').getByRole('heading', { name: 'Where would you like to start?', level: 1 }),
  ).toBeVisible();
});

// CATL-62: GitHub Pages serves 404.html for hard-typed path URLs; it must
// redirect into the HashRouter and preserve the query string.
test('a path-style deep link redirects into the hash route with its query intact', async ({
  page,
}) => {
  await page.goto('/explore?q=AC-2');
  await page.waitForURL(/#\/explore/, { timeout: 15000 });
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/[?&]q=AC-2/);
  await expect(
    page.getByRole('heading', { name: 'Explore the control landscape' }),
  ).toBeVisible();
});

// CATL-17 / CATL-V1: typing in the header overlay and pressing Enter submits
// straight to Explore results and carries focus into the results region, so the
// overlay and Explore read as one search surface.
test('header overlay search submits to Explore and carries focus to results', async ({
  page,
}) => {
  test.setTimeout(90_000);
  // The header search trigger lives in the persistent site chrome, which is
  // hidden on the calm home entrance — exercise it from a page where it's
  // actually visible.
  await page.goto('/?view=explore');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole('button', { name: 'Open search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search records' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('searchbox', {
    name: 'Search records and glossary',
  });
  await input.fill('account management');
  await input.press('Enter');

  await expect(page).toHaveURL(/[?&]q=account/);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator('#library-results')).toBeFocused({ timeout: 15000 });
});

// CATL-25: the Atlas route renders a bounded starter cluster quickly; the full
// 11k-node graph stays behind the route via the staged loader.
test('atlas map renders a bounded starter cluster, not the full graph', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/#/atlas-map');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Framework Map" }).click();
  await expect(page).toHaveURL(/node=foundation/);
  await expect(page.locator('.react-flow__node').first()).toBeVisible({
    timeout: 20000,
  });
  const nodeCount = await page.locator('.react-flow__node').count();
  expect(nodeCount).toBeGreaterThan(0);
  // A bounded focused/starter cluster — proof the route did not hydrate every
  // node in the catalog on cold load.
  expect(nodeCount).toBeLessThan(80);
});

// CATL-V2 / CATL-67: the download confirmation toast fires from the real
// anchor-click dispatch, is styled like an About-page trust block, and the
// button briefly disables to prevent a double-generate.
test('template generation fires a trust-styled download toast and disables the button briefly', async ({
  page,
}) => {
  await page.goto('/?view=templates&templateType=security_plan_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Matches both the idle "Generate …" label and the disabled "Generating…"
  // label, so the same locator tracks the button across the disable window.
  const generate = page.getByRole('button', { name: /Generat(e|ing)/ });
  await expect(generate).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  // Don't await the click: resolving it waits on the whole download lifecycle,
  // which outlasts the ~1.2s disable window. Assert the transient disabled state
  // concurrently so we catch the double-generate guard.
  const clickPromise = generate.click();
  await expect(generate).toBeDisabled({ timeout: 3000 });

  const download = await downloadPromise;
  await clickPromise;
  expect(download.suggestedFilename()).toMatch(/security-plan-starter.*\.md$/);

  const toast = page.locator('.generation-status');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/tone-trust/);
  await expect(toast).toContainText('Download started');
  // Re-enables after the brief window so the user can generate again.
  await expect(generate).toBeEnabled();
});
