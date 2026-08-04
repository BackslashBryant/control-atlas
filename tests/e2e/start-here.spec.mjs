import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

// 2026-08-03: the owner asked for a genuine two-step guided flow here,
// superseding the earlier "fixed list, no questions" design. The boundary
// that design was protecting is unchanged and still enforced below: the flow
// routes to public material, it never determines applicability.
test("Start here asks two questions without making a determination", async ({
  page,
}) => {
  await page.goto("/#/start");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Start here", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1. What are you trying to do?" }),
  ).toBeVisible();
  // Step 2 only appears once a goal is chosen.
  await expect(
    page.getByRole("heading", { name: "2. What context do you already know?" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("System type")).toHaveCount(0);
  await expect(page.getByLabel("Data sensitivity")).toHaveCount(0);
  await expect(page.getByLabel("Operational environment")).toHaveCount(0);
});

test("Start here produces a plan traceable to real publications", async ({
  page,
}) => {
  await page.goto("/#/start");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Prepare for assessment" }).click();
  await expect(
    page.getByRole("heading", { name: "2. What context do you already know?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "FedRAMP cloud service" }).click();

  await expect(page.getByRole("heading", { name: /^Start with/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open FedRAMP/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Then review/ })).toBeVisible();
  // Control Atlas does not decide applicability; the plan only routes.
  await expect(
    page.getByText(/Control Atlas does not decide\s+what applies to your system/),
  ).toBeVisible();

  await page.getByRole("button", { name: /^Open FedRAMP/ }).click();
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
  await expect(page.getByRole("heading", { name: "Start here", exact: true })).toBeVisible();
});

test("Start here's chosen goal and context survive reload and back navigation", async ({
  page,
}) => {
  await page.goto("/#/start?goal=assess&context=fedramp");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: /^Start with/ })).toContainText(
    "FedRAMP Rev. 5",
  );
  await expect(page.getByRole("button", { name: /^Then review/ })).toContainText(
    "SP 800-53A Rev. 5",
  );
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
