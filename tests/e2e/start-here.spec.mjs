import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('start here recommendations navigate to templates, patterns, library, and compare', async ({ page }) => {
  await page.goto('/?view=start-here');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');

  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compare', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Patterns', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Templates', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Generate Inheritance Worksheet', exact: true }).click();
  await expect(page).toHaveURL(/view=templates&templateType=inheritance_worksheet/);
  await expect(page.getByText('Inheritance Worksheet')).toBeVisible();

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Read pattern', exact: true }).first().click();
  await expect(page).toHaveURL(/view=patterns&pattern=/);

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Open in Library', exact: true }).first().click();
  await expect(page).toHaveURL(/view=browse&framework=fedramp-rev5|view=search&filter=fedramp-rev5/);

  await page.goto('/?view=start-here&systemType=Hybrid&dataSensitivity=High&environment=DoD');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Open Compare', exact: true }).first().click();
  await expect(page).toHaveURL(/view=matrix&workbench=stig-chain/);
});

test('header search surfaces glossary results from any page', async ({ page }) => {
  await page.goto('/?view=matrix');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('Search library and glossary').fill('reciprocity');
  await page.getByLabel('Search library and glossary').press('Enter');

  await expect(page).toHaveURL(/view=search&q=reciprocity/);
  await expect(page.getByRole('heading', { name: 'Glossary', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open term details', exact: true }).first()).toBeVisible();
});

test('library detail exposes related glossary terms', async ({ page }) => {
  await page.goto('/?view=library-detail&node=nist-800-53%3AAC-2');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText('Related terms', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'RMF', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#glossary-term-rmf')).toBeVisible();
});
