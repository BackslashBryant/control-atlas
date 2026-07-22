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
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Select all three answers to continue.')).toBeVisible();

  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await expect(submit).toBeEnabled();
});

test('start here recommendations navigate to templates, playbooks, explore, and compare', async ({ page }) => {
  await page.goto('/?view=start-here');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel('System type').selectOption('Cloud SaaS');
  await page.getByLabel('Data sensitivity').selectOption('Moderate');
  await page.getByLabel('Operational environment').selectOption('CSP');
  await page.getByRole('button', { name: 'Show recommendation' }).click();

  await expect(page.getByText('Your situation', { exact: true })).toBeVisible();
  await expect(page.getByText('FedRAMP authorization path', { exact: true })).toBeVisible();
  await expect(page.getByText('Recommended next step', { exact: true })).toBeVisible();
  await page.getByText(/Other useful resources/).click();
  await expect(page.getByRole('heading', { name: 'Other frameworks', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compare', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playbooks', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Templates', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Inheritance Worksheet', exact: true }).click();
  await expect(page).toHaveURL(/#\/templates\?.*templateType=inheritance_worksheet|view=templates&templateType=inheritance_worksheet/);
  await expect(
    page.getByRole("heading", { name: "Inheritance Worksheet" }),
  ).toBeVisible();

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByText(/Other useful resources/).click();
  await page.locator('section.stack').filter({ has: page.getByRole('heading', { name: 'Playbooks', exact: true }) }).locator('.card-title-action').first().click();
  await expect(page).toHaveURL(/#\/playbooks\?.*pattern=|view=playbooks&pattern=/);

  await page.goto('/?view=start-here&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=CSP&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Open FedRAMP Rev. 5 Baselines' }).click();
  await expect(page).toHaveURL(/#\/explore\?.*(filter=|framework=)fedramp-rev5|view=browse&framework=fedramp-rev5|view=explore&filter=fedramp-rev5/);

  await page.goto('/?view=start-here&systemType=Hybrid&dataSensitivity=High&environment=DoD&step=results');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByText(/Other useful resources/).click();
  await page.locator('section.stack').filter({ has: page.getByRole('heading', { name: 'Compare', exact: true }) }).locator('.card-title-action').first().click();
  await expect(page).toHaveURL(/#\/compare\?.*workbench=stig-chain|view=matrix&workbench=stig-chain/);
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
