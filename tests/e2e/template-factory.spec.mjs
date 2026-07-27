import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(__dirname, '../../data/template-registry.json'), 'utf8'));

const TEMPLATE_WORKFLOW = {
  stig_evidence_checklist: 'Run and document a STIG assessment',
  conmon_calendar: 'Organize continuous monitoring deliverables',
  ppsm_preparation_worksheet: 'Prepare PPSM information',
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

for (const template of registry.templates) {
  test(`generates download for ${template.display_name}`, async ({ page }) => {
    await page.goto('/?view=templates');
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const workflowButton = page.getByRole('button', {
        name: new RegExp(
          `^${escapeRegex(TEMPLATE_WORKFLOW[template.name] || 'Build an authorization package')}\\b`,
        ),
      });
    if (!(await workflowButton.isVisible())) {
      await page.getByText(/More document tasks/).click();
    }
    await workflowButton.click();

    const card = page
      .locator('#companion-templates')
      .getByRole('button', { name: new RegExp(`^${escapeRegex(template.display_name)}\\b`) });
    // A task leads with the documents it declares; everything else stays
    // reachable behind "Other starter documents". Expand that when the wanted
    // template is not one this task declares.
    if (!(await card.count()) || !(await card.first().isVisible())) {
      const others = page.locator(
        '#companion-templates details.other-templates > summary',
      );
      if (await others.count()) {
        await others.first().click();
      }
    }
    await card.first().click();
    await expect(page.getByText('What this template is for')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`templateType=${template.name}`));

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: new RegExp(`Download ${escapeRegex(template.display_name)} \\(`) }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(new RegExp(`${template.name.replace(/_/g, '-')}-\\d{4}-\\d{2}-\\d{2}\\.`));
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${template.supported_formats[0]}$`));
    await assertZipDownload(download);
  });
}

test('deep link pre-selects security plan starter', async ({ page }) => {
  await page.goto('/?view=templates&templateType=security_plan_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText('What this template is for')).toBeVisible();
  await expect(page.getByRole('button', { name: /Download Security Plan Starter \(/ })).toBeVisible();
});

test('document preview is visible before download', async ({ page }) => {
  await page.goto('/?view=templates&templateType=inheritance_worksheet');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const preview = page.locator('.template-document-preview');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('Control Atlas');
  await expect(preview).toContainText('Inheritance');
  await expect(preview.locator('table')).toHaveCount(1);
});

// CATL-73: office-format export runs entirely client-side. A downloaded file
// that starts with the ZIP local-file-header magic ("PK\x03\x04") is a real
// OOXML package, not a text stub.
async function assertZipDownload(download) {
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path);
  expect(bytes.length).toBeGreaterThan(0);
  expect(bytes[0]).toBe(0x50); // P
  expect(bytes[1]).toBe(0x4b); // K
  expect(bytes[2]).toBe(0x03);
  expect(bytes[3]).toBe(0x04);
}

test('tabular template exports a real .xlsx workbook client-side', async ({ page }) => {
  await page.goto('/?view=templates&templateType=poam_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator("#field-format").selectOption("xlsx");

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download POA&M Working Register \(/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  await assertZipDownload(download);
});

test('SSP starter exports a real .docx document client-side', async ({ page }) => {
  await page.goto('/?view=templates&templateType=security_plan_starter');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator("#field-format").selectOption("docx");

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download Security Plan Starter \(/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
  await assertZipDownload(download);
});
