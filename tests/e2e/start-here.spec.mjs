import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Start here opens publications without determination questions", async ({
  page,
}) => {
  await page.goto("/#/start");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Find the publication you need" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Each link opens the records and relationships loaded from that publisher/i),
  ).toBeVisible();
  await expect(page.getByLabel("System type")).toHaveCount(0);
  await expect(page.getByLabel("Data sensitivity")).toHaveCount(0);
  await expect(page.getByLabel("Operational environment")).toHaveCount(0);
});

test("Start here opens a named public source catalog", async ({ page }) => {
  await page.goto("/#/start");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: /FedRAMP Rev\. 5/ }).click();
  await expect(page).toHaveURL(/#\/catalog\/fedramp-rev5/);
});

test("retired questionnaire parameters are removed with visible recovery", async ({
  page,
}) => {
  await page.goto(
    "/#/start?systemType=Cloud+SaaS&dataSensitivity=CUI&environment=Contractor&step=results",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page).toHaveURL(/#\/start$/);
  await expect(
    page.getByText(/unsupported link settings were removed/i),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find the publication you need" }),
  ).toBeVisible();
});

test("catalog detail keeps source context and opens a specific record", async ({
  page,
}) => {
  await page.goto("/#/catalog/nist-800-171-rev2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "SP 800-171 Rev. 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View official source/ }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Search this catalog" }).fill("3.1.1");
  const row = page
    .locator(".catalog-record-row")
    .filter({ hasText: "3.1.1" })
    .first();
  await row.getByRole("button").click();
  await expect(page).toHaveURL(/#\/record\/nist-800-171-rev2\/3.1.1/);
});
