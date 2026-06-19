import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('control atlas staged shell exposes the translation-first nav order and guided start path', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });

  await expect(page).toHaveTitle(/Control Atlas/);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Control Atlas', exact: true })).toBeVisible();
  await expect(page.getByText('A public cyber compliance reference workspace that turns complex guidance into clear, traceable action.')).toBeVisible();

  const navLabels = await primaryNav.locator('button').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''),
  );
  expect(navLabels).toEqual(['Start Here', 'Library', 'Compare', 'Patterns', 'Templates', 'Sources']);

  await primaryNav.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find the best place to start' })).toBeVisible();
  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await expect(page.getByText('Suggested frameworks and baselines')).toBeVisible();
  await expect(page.getByText('What to do next')).toBeVisible();
  await expect(page.getByText('FedRAMP Rev. 5')).toBeVisible();
});

test('library detail deep links stay compatible and keep advanced details collapsed by default', async ({ page }) => {
  await page.goto('/?view=library-detail&node=nist-800-53%3AAC-2&mode=expert');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Account Management', exact: true })).toBeVisible();
  await expect(page.getByText('What this is')).toBeVisible();
  await expect(page.getByText('Why it matters')).toBeVisible();
  await expect(page.getByText('Where it appears')).toBeVisible();
  await expect(page.getByText('What it connects to')).toBeVisible();
  await expect(page.getByText('Source support', { exact: true })).toBeVisible();
  await expect(page.getByText('Next actions', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await expect(page.getByText('Source location')).not.toBeVisible();
  await page.getByRole('button', { name: 'Advanced details' }).click();
  await expect(page.getByText('Source location')).toBeVisible();
});

test('library filters narrow results without a page reload', async ({ page }) => {
  await page.goto('/?view=search&q=AC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Search the public reference library' })).toBeVisible();
  await page.getByRole('button', { name: 'Refine results' }).click();
  await page.getByLabel('Item type').selectOption('control');
  await expect(page.locator('#library-results .result-card')).toHaveCount(1);
  await expect(page.locator('#library-results')).toContainText('Account Management');
});

test('compare starts with intent cards and opens summary-first framework results', async ({ page }) => {
  await page.goto('/?view=matrix');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'What do you want to compare?' })).toBeVisible();
  await expect(page.getByText('Framework to framework')).toBeVisible();
  await expect(page.getByText('STIG/SRG to controls')).toBeVisible();
  await page.locator('.intent-card', { hasText: 'Framework to framework' }).getByRole('button', { name: 'Use this path' }).click();
  await expect(page.getByLabel('Framework A')).toBeVisible();
  await expect(page.getByLabel('Framework B')).toBeVisible();
  await page.getByLabel('Framework A').selectOption('nist-800-53');
  await page.getByLabel('Framework B').selectOption('csf-2');
  await expect(page.getByText('What this is')).toBeVisible();
  await expect(page.getByText('Why it matters')).toBeVisible();
  await expect(page.getByText('What to do next')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export Markdown', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Detailed mappings' }).click();
  await expect(page.locator('table')).toContainText('AC-2');
});

test('sources, templates, and patterns follow trust-first, artifact-first, and outcome-first flows', async ({ page }) => {
  await page.goto('/?view=sources');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Review sources before you rely on a match' })).toBeVisible();
  await page.getByLabel('Included in map').selectOption('excluded');
  const communityCard = page.locator('.source-card').filter({ hasText: 'Community CCI Research' });
  await expect(communityCard).toBeVisible();
  await expect(communityCard.getByText('This source is not used in the public map by default.')).toBeVisible();
  await communityCard.getByRole('button', { name: 'View source details' }).click();
  await expect(page.getByText('How Control Atlas uses it', { exact: true })).toBeVisible();
  await expect(page.getByText('Trust and status', { exact: true })).toBeVisible();

  await page.goto('/?view=templates');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'What are you trying to create?' })).toBeVisible();
  await page.locator('.intent-card').first().getByRole('button', { name: 'Choose artifact' }).click();
  await expect(page.getByText('What this template is for')).toBeVisible();
  await expect(page.getByText('What it includes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'More options' })).toBeVisible();

  await page.goto('/?view=patterns');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'Patterns organized around user outcomes' })).toBeVisible();
  await page.locator('.intent-card').first().getByRole('button', { name: 'Open pattern' }).click();
  await expect(page.getByText('What this helps with')).toBeVisible();
  await expect(page.getByText('Common mistakes', { exact: true })).toBeVisible();
  await expect(page.getByText('Next action', { exact: true })).toBeVisible();
});
