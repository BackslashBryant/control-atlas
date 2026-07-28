import { expect, test } from "@playwright/test";
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("start here requires all three answers before browsing sources", async ({ page }) => {
  await page.goto("/?view=start-here");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const submit = page.getByRole("button", { name: "Browse sources" });
  await expect(submit).toBeHidden();
  await page.getByLabel("System type").selectOption("Cloud SaaS");
  await page.getByLabel("Data sensitivity").selectOption("Moderate");
  await page.getByLabel("Operational environment").selectOption("CSP");
  await expect(submit).toBeVisible();
});

test("start here keeps answers as context and opens a public source catalog", async ({ page }) => {
  await page.goto("/?view=start-here");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("System type").selectOption("Cloud SaaS");
  await page.getByLabel("Data sensitivity").selectOption("Moderate");
  await page.getByLabel("Operational environment").selectOption("CSP");
  await page.getByRole("button", { name: "Browse sources" }).click();

  await expect(page.getByRole("heading", { name: "Source navigator" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Public sources to browse" })).toBeVisible();
  await expect(page.getByText(/do not determine a classification, baseline, authorization path, or applicability result/i)).toBeVisible();
  await page.getByRole("button", { name: "FedRAMP Rev. 5", exact: true }).click();
  await expect(page).toHaveURL(/#\/catalog\/fedramp-rev5/);
});

test("start here does not infer a contractor authorization path", async ({ page }) => {
  await page.goto("/#/start?systemType=Cloud+SaaS&dataSensitivity=CUI&environment=Contractor&step=results");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Source navigator" })).toBeVisible();
  await expect(page.getByText(/do not determine a classification, baseline, authorization path, or applicability result/i)).toBeVisible();
  await expect(page.getByText("NIST SP 800-171 Rev. 2", { exact: true })).toBeVisible();
});

test("catalog detail keeps framework context and opens a specific record", async ({ page }) => {
  await page.goto("/#/library/nist-800-171-rev2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "SP 800-171 Rev. 2", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /View official source/ })).toBeVisible();
  await page.getByPlaceholder("Search SP 800-171 Rev. 2").fill("3.1.1");
  const row = page.locator(".catalog-record-row").filter({ hasText: "3.1.1" }).first();
  await expect(row).toContainText("No narrative description was published for this record.");
  await row.getByRole("button").click();
  await expect(page).toHaveURL(/#\/record\/nist-800-171-rev2\/3.1.1/);
  await expect(page.getByRole("button", { name: "Back to Catalog" })).toBeVisible();
});

test("header search surfaces glossary results from any page", async ({ page }) => {
  await page.goto("/?view=matrix");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByLabel("Search records and glossary").fill("reciprocity");
  await page.getByLabel("Search records and glossary").press("Enter");
  await expect(page).toHaveURL(/#\/search\?.*q=reciprocity/);
  await expect(page.getByRole("button", { name: /^Glossary \(\d+\)$/ })).toBeVisible();
});

test("library detail exposes related glossary terms", async ({ page }) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "RMF", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
