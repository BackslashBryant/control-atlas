import { expect, test } from '@playwright/test';

async function dismissOnboarding(page) {
  const skipOnboarding = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skipOnboarding.isVisible()) {
    await skipOnboarding.click();
  }
}

test('control atlas staged shell exposes the epic 0 navigation and key journeys', async ({ page }) => {
  await page.goto('/');
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });

  await expect(page).toHaveTitle(/Control Atlas/);
  await dismissOnboarding(page);
  await expect(primaryNav.getByRole('button', { name: 'Library', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Crosswalks', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Patterns', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Templates', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Sources', exact: true })).toBeVisible();
  await expect(primaryNav.getByRole('button', { name: 'Start Here', exact: true })).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find the right public entry point before diving into the graph' })).toBeVisible();
  await page.selectOption('#sh-system-type', 'Cloud SaaS');
  await page.selectOption('#sh-data-sensitivity', 'Moderate');
  await page.selectOption('#sh-environment', 'CSP');
  await page.getByRole('button', { name: 'Get Recommendations', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your public reference pathway' })).toBeVisible();
  await expect(page.getByText('Suggested Frameworks & Baselines')).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Crosswalks', exact: true }).click();
  await expect(page.getByText('Loading the public compliance map')).toBeHidden({ timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Crosswalk Workbench' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Relationship Table', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'STIG -> CCI -> NIST', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baseline Compare', exact: true })).toBeVisible();

  await primaryNav.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(page.getByText('Loading the public compliance map')).toBeHidden({ timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Source check and data issues' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel('Source type', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Included in map', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Status', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Access', { exact: true })).toBeVisible();
  await page.getByLabel('Included in map', { exact: true }).selectOption('excluded');
  const communityCard = page.locator('.source-card').filter({ hasText: 'Community CCI Research' });
  await expect(communityCard).toBeVisible();
  await expect(communityCard.getByText('Not used in the public map.')).toBeVisible();
  await communityCard.getByRole('button', { name: 'View source details' }).click();
  await expect(page.getByRole('heading', { name: 'Community CCI Research' })).toBeVisible();
  await expect(page.getByText('Use rules')).toBeVisible();
  await expect(page.getByText('Old or draft content. Check it carefully.')).toBeVisible();
});

test('library detail opens from a copied deep link', async ({ page }) => {
  await page.goto('/?view=library-detail&node=nist-800-53%3AAC-2');
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Account Management', exact: true })).toBeVisible();
  await expect(page.locator('.item-id').filter({ hasText: 'AC-2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
});

test('library filters narrow results without a page reload', async ({ page }) => {
  await page.goto('/');
  await dismissOnboarding(page);
  await page.getByLabel('ID, title, or topic').fill('AC-2');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByLabel('Object type').selectOption('control');
  await expect(page.locator('#library-results .item-card')).toHaveCount(1);
  await expect(page.locator('#library-results')).toContainText('Account Management');
});

test('crosswalk workbench deep links into relationship mode with visible-only exports', async ({ page }) => {
  await page.goto('/?view=matrix&workbench=relationships&source=nist-800-53&target=csf-2&items=AC-10');
  await dismissOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Crosswalk Workbench' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Relationship Table', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Show inferred mappings')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export Markdown', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON', exact: true })).toBeVisible();
  await expect(page.getByText('Only the currently visible results are exported.')).toBeVisible();
  await expect(page.locator('table')).toContainText('AC-10');
});

test('crosswalk workbench compares public baselines', async ({ page }) => {
  await page.goto('/');
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Crosswalks', exact: true }).click();
  await page.getByRole('button', { name: 'Baseline Compare', exact: true }).click();
  await page.getByLabel('Baseline A').selectOption('nist-800-53b:MODERATE');
  await page.getByLabel('Baseline B').selectOption('fedramp-rev5:MODERATE');
  await page.getByRole('button', { name: 'Compare baselines', exact: true }).click();
  await expect(page.getByText('Shared controls')).toBeVisible();
  await expect(page.getByText('Only in A')).toBeVisible();
  await expect(page.getByText('Only in B')).toBeVisible();
  await expect(page.getByText(/Defining source:/)).toHaveCount(2);
});
