import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('start here requires all three answers before showing a recommendation', async ({ page }) => {
  await page.goto('/?view=start-here');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const submit = page.getByRole('button', { name: 'Show recommendation' });
  await expect(submit).toBeHidden();

  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await expect(submit).toBeVisible();
});

test('start here completes the questionnaire with one result and opens the named catalog', async ({ page }) => {
  await page.goto('/?view=start-here');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await page.getByRole('button', { name: 'Show recommendation' }).click();

  await expect(page.getByRole('heading', { name: 'FedRAMP authorization path' })).toBeVisible();
  await expect(page.getByText('Based on', { exact: true })).toBeVisible();
  await expect(page.getByLabel('System type')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Change answers' })).toBeVisible();
  await page.getByText(/Related guides, documents, and comparisons/).click();

  await page.getByRole('button', { name: 'Inheritance Worksheet', exact: true }).click();
  await expect(page).toHaveURL(/#\/build\?.*templateType=inheritance_worksheet|view=templates&templateType=inheritance_worksheet/);
  await expect(
    page.getByRole("heading", { name: "Inheritance Worksheet" }),
  ).toBeVisible();

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByText(/Related guides, documents, and comparisons/).click();
  await page.locator('.start-here-resource-row').filter({ hasText: 'Using FedRAMP Inheritance' }).getByRole('button').click();
  await expect(page).toHaveURL(/#\/playbooks\?.*pattern=|view=playbooks&pattern=/);

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'View FedRAMP Rev. 5 Baselines' }).click();
  await expect(page).toHaveURL(/#\/library\/fedramp-rev5/);
  await expect(page.getByRole('heading', { name: 'FedRAMP Rev. 5', exact: true })).toBeVisible();
  await expect(page.getByText(/organize the controls used to assess and authorize cloud services/i)).toBeVisible();

  await page.goto('/?view=start-here&systemType=Hybrid&dataSensitivity=High&environment=DoD&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByText(/Related guides, documents, and comparisons/).click();
  await page.locator('.start-here-resource-row').filter({ hasText: 'Trace STIG rules to controls' }).getByRole('button').click();
  await expect(page).toHaveURL(/#\/compare\?.*workbench=stig-chain|view=matrix&workbench=stig-chain/);
});

test('contractor guidance distinguishes CUI from contractor status', async ({ page }) => {
  await page.goto('/#/start?systemType=Cloud+SaaS&dataSensitivity=CUI&environment=Contractor&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'Contractor handling CUI' })).toBeVisible();
  await expect(page.getByText(/confirm the required revision before relying on it/i)).toBeVisible();
  await page.getByRole('button', { name: 'View NIST SP 800-171 Rev. 2' }).click();
  await expect(page).toHaveURL(/#\/catalog\/nist-800-171-rev2/);
  await expect(page.locator('.catalog-facts')).toContainText('111 requirements');
  await expect(page.locator('.catalog-facts')).toContainText('15 families');

  await page.goto('/#/start?systemType=On-premises&dataSensitivity=Low&environment=Contractor&step=results');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'Confirm the contract requirements' })).toBeVisible();
  await expect(page.getByText(/Contractor status alone does not determine/i)).toBeVisible();
  await expect(page.getByText('NIST SP 800-171 Rev. 2', { exact: true })).toBeHidden();
});

test('catalog detail keeps framework context and opens a specific record', async ({ page }) => {
  await page.goto('/#/library/nist-800-171-rev2');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole('heading', { name: 'SP 800-171 Rev. 2', exact: true })).toBeVisible();
  await expect(page.getByText(/Security requirements for protecting Controlled Unclassified Information/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /View official source/ })).toBeVisible();

  await page.getByPlaceholder('Search SP 800-171 Rev. 2').fill('3.1.1');
  const row = page.locator('.catalog-record-row').filter({ hasText: '3.1.1' }).first();
  await expect(row).toContainText('Limit system access');
  await row.getByRole('button').click();
  await expect(page).toHaveURL(/#\/record\/nist-800-171-rev2\/3.1.1/);
  await expect(page.getByRole('button', { name: 'Back to Catalog' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Catalog' }).click();
  // "Back to Catalog" here returns via browser history (returnToOrigin), which
  // lands on the exact prior URL — the pre-rename /library/ alias this test's
  // own page.goto() used, not the new canonical /catalog/ path.
  await expect(page).toHaveURL(/#\/library\/nist-800-171-rev2/);
});

test('header search surfaces glossary results from any page', async ({ page }) => {
  await page.goto('/?view=matrix');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('Search records and glossary').fill('reciprocity');
  await page.getByLabel('Search records and glossary').press('Enter');

  await expect(page).toHaveURL(/#\/explore\?.*q=reciprocity|view=explore&q=reciprocity/);
  await expect(page.getByRole('button', { name: /^Glossary \(\d+\)$/ })).toBeVisible();
  await expect(page.locator('.result-card .card-title-action').first()).toBeVisible();
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
