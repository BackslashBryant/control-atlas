import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('brand entrance appears once, is dismissible, and hides navigation while visible', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('ca_intro_seen'));
  await page.goto('/');
  const entrance = page.getByRole('dialog', { name: 'Control Atlas introduction' });
  await expect(entrance).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();
  await entrance.press('Escape');
  await expect(entrance).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await page.reload();
  await expect(entrance).toHaveCount(0);
});

test('reduced motion bypasses the brand entrance without an artificial hold', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.removeItem('ca_intro_seen'));
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Control Atlas introduction' })).toHaveCount(0);
  await context.close();
});

test('control atlas map-first shell exposes navigation and guided start path', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });

  await expect(page).toHaveTitle(/Control Atlas/);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible();
  await expect(page.locator('.home-hero').getByText('The public map for federal cyber compliance.')).toBeVisible();

  const navLabels = await primaryNav.getByRole('button').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''),
  );
  expect(navLabels).toEqual([
    'Start',
    'Atlas',
    'Explore',
    'Compare',
    'More',
  ]);

  await primaryNav.getByRole('button', { name: 'More' }).click();
  await expect(primaryNav.getByRole('menuitem', { name: 'Playbooks' })).toBeVisible();
  await expect(primaryNav.getByRole('menuitem', { name: 'Templates' })).toBeVisible();
  await expect(primaryNav.getByRole('menuitem', { name: 'Sources' })).toBeVisible();

  const expandedNavLabels = await primaryNav.getByRole('menuitem').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''),
  );
  expect(expandedNavLabels).toEqual([
    'Playbooks',
    'Templates',
    'Sources',
  ]);

  await page.getByRole('button', { name: 'Control Atlas' }).click();
  await expect(page).toHaveURL(/#\/?$|\/$/);

  await primaryNav.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find the best place to start' })).toBeVisible();
  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await page.getByRole('button', { name: 'Show recommendation' }).click();
  await expect(page.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Templates', exact: true })).toBeVisible();
  await expect(page.getByText('FedRAMP Rev. 5 Baselines')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate Inheritance Worksheet', exact: true })).toBeVisible();
});

test('visible search trigger opens the global search dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole('button', { name: 'Open search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search records' });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('searchbox', { name: 'Search records and glossary' }),
  ).toBeFocused();
});

test('library detail deep links stay compatible and keep advanced details collapsed by default', async ({ page }) => {
  await page.goto('/?view=library-detail&node=nist-800-53%3AAC-2&mode=expert');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/record\/nist-800-53\/AC-2|library-detail/);
  await expect(page.getByRole('heading', { name: 'Account Management', exact: true })).toBeVisible();
  await expect(page.getByText('What this is')).toBeVisible();
  await expect(page.getByText('Why it matters')).toBeVisible();
  await expect(page.getByText('Where it appears')).toBeVisible();
  await expect(page.getByText('Connections', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open in Atlas Map' }).first()).toBeVisible();
  await expect(page.locator('.relationship-card')).toHaveCount(0);
  await page.locator('.relationship-group-trigger').first().click();
  await expect(page.locator('.relationship-card').first()).toBeVisible();
  await expect(page.getByText('Source support', { exact: true })).toBeVisible();
  await expect(page.getByText('What to do next', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await expect(page.getByText('Official text / source excerpt')).toBeVisible();
  await expect(page.getByText('Source location')).not.toBeVisible();
  await page.getByRole('button', { name: 'Advanced details' }).click();
  await expect(page.getByText('Source location')).toBeVisible();
});

test('explore filters narrow results without a page reload', async ({ page }) => {
  await page.goto('/?view=explore&q=AC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Explore the control landscape' })).toBeVisible();
  await page.getByRole('button', { name: 'Refine results' }).click();
  await page.getByLabel('Item type').selectOption('control');
  await expect(page.locator('#library-results .result-card')).toHaveCount(1);
  await expect(page.locator('#library-results')).toContainText('Account Management');
});

test('explore groups results and filters out records without connections', async ({ page }) => {
  await page.goto('/?view=explore&q=account');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByLabel('Show only items with connections')).toBeVisible();
  await expect(page.locator('#library-results .accordion-trigger').first()).toBeVisible();
  await page.getByLabel('Show only items with connections').check();
  await expect(page.getByText('No connections yet', { exact: true })).toHaveCount(0);
  const firstCard = page.locator('#library-results .result-card').first();
  await expect(firstCard.getByRole('button', { name: 'Open record' })).toBeVisible();
  await expect(firstCard.getByRole('button', { name: 'More actions' })).toBeVisible();
});

test('explore explains when the connections-only filter removes every record', async ({ page }) => {
  await page.goto('/?view=explore&q=LEVEL-1');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('Show only items with connections').check();
  await expect(
    page.getByRole('heading', { name: 'No matching connected records found.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show all matching records' })).toBeVisible();
});

test('template advanced options stay collapsed until requested', async ({ page }) => {
  await page.goto('/?view=templates&templateType=security_plan_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByLabel('Framework')).not.toBeVisible();
  await page.getByRole('button', { name: 'More options' }).click();
  await expect(page.getByLabel('Framework')).toBeVisible();
});

test('compare starts with intent cards and opens summary-first framework results', async ({ page }) => {
  await page.goto('/?view=matrix');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'What do you want to compare?' })).toBeVisible();
  await expect(page.getByText('Framework to framework')).toBeVisible();
  await expect(page.getByText('STIG/SRG to controls')).toBeVisible();
  await page.locator('.intent-card', { hasText: 'Framework to framework' }).click();
  await expect(page.getByLabel('Framework A')).toBeVisible();
  await expect(page.getByLabel('Framework B')).toBeVisible();
  await page.getByLabel('Framework A').selectOption('nist-800-53');
  await page.getByLabel('Framework B').selectOption('csf-2');
  await expect(page.locator('#compare-results')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Shared mappings', level: 3 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Map', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'List', exact: true })).toBeVisible();
  await page.locator('#compare-results details.export-disclosure summary').click();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export Markdown', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON', exact: true })).toBeVisible();
  const mappingsTable = page.getByRole("table", { name: "Relationship mappings" });
  await expect(mappingsTable).toBeVisible({ timeout: 15000 });
  await expect(mappingsTable).toContainText("AC-2");
  await expect(mappingsTable).toContainText("Plain-language rationale");
});

test('compare stig chain traces DISA items through CCI to NIST controls', async ({ page }) => {
  await page.goto('/?view=matrix');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.locator('.intent-card', { hasText: 'STIG/SRG to controls' }).click();
  await expect(page.getByLabel('Catalog')).toBeVisible();
  await page.getByRole('button', { name: 'View mapping trace' }).first().click();
  await expect(page.getByText('Selected chain')).toBeVisible();
  const chainPanel = page.locator('.chain-grid');
  await expect(chainPanel.getByText('CCI links', { exact: true })).toBeVisible();
  await expect(chainPanel.getByText('NIST controls', { exact: true })).toBeVisible();
  await expect(chainPanel.getByText('Official link').first()).toBeVisible();
  await page.locator('.compare-results-panel details.export-disclosure summary').click();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export Markdown', exact: true })).toBeVisible();
});

test('compare baselines shows delta controls and source versions', async ({ page }) => {
  await page.goto('/?view=matrix&workbench=baseline-compare');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByLabel('Baseline A').selectOption('nist-800-53b:LOW');
  await page.getByLabel('Baseline B').selectOption('nist-800-53b:MODERATE');
  await expect(page.getByText('Baseline A:').first()).toBeVisible();
  await expect(page.getByText('Baseline B:').first()).toBeVisible();
  await expect(page.getByText('Shared controls').first()).toBeVisible();
  await expect(page.getByText('Only in B', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.chain-grid')).toContainText('AC-');
  await page.locator('details.export-disclosure summary').click();
  await expect(page.getByRole('button', { name: 'Export Markdown', exact: true })).toBeVisible();
});

test('sources, templates, and playbooks follow trust-first, artifact-first, and outcome-first flows', async ({ page }) => {
  await page.goto('/?view=sources');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Review sources before you rely on a match' })).toBeVisible();
  await page.getByRole('button', { name: 'Refine sources' }).click();
  await page.getByLabel('Included in map').selectOption('excluded');
  await page.getByRole('button', { name: /Federal referenced/i }).click();
  const communityCard = page.locator('.source-card').filter({ hasText: 'Community CCI Research' });
  await expect(communityCard).toBeVisible();
  await expect(communityCard.getByText('This source is not used in the public map by default.')).toBeVisible();
  await communityCard.getByRole('button', { name: 'View source details' }).click();
  await expect(page.getByText('How Control Atlas uses it', { exact: true })).toBeVisible();
  await expect(page.getByText('Trust and status', { exact: true })).toBeVisible();

  await page.goto('/?view=templates');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'What are you trying to create?' })).toBeVisible();
  await page.locator('.intent-card').first().click();
  await expect(page.getByText('What this template is for')).toBeVisible();
  await expect(page.getByText('What it includes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'More options' })).toBeVisible();

  await page.goto('/?view=playbooks');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'Compliance playbooks' })).toBeVisible();
  await page.locator('.intent-card').first().click();
  await expect(page.getByText('Purpose')).toBeVisible();
  await expect(page.getByText('Common mistakes', { exact: true })).toBeVisible();
  await expect(page.getByText('Next action', { exact: true })).toBeVisible();
});

test('legacy view query redirects to hash route on boot', async ({ page }) => {
  await page.goto('/?view=atlas-map');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/atlas-map/);
  await expect(page.locator("main").getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
});

test('hash deep route survives refresh on built site', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#/explore');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
  await page.reload();
  await dismissOnboarding(page);
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/explore/);
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
});

test('footer about link opens the trust page with full disclaimer', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('link', { name: 'About & trust' }).click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole('heading', { name: 'What Control Atlas is — and is not' })).toBeVisible();
  await expect(page.locator('main').getByText('not an official government system')).toBeVisible();
  await expect(page.locator('main').getByText('reference aids based on public sources')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review the Sources registry' })).toBeVisible();
});
