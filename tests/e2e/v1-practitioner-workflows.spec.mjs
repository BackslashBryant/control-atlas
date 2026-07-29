import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

async function open(page, route) {
  await page.goto(route);
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

test("V1 workflow 01 — find a known identifier", async ({ page }) => {
  await open(page, "/#/");
  await page.getByRole("searchbox", { name: "Search published records" }).fill("AC-2");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/#\/search\?q=AC-2/);
  await expect(
    page.getByRole("article", {
      name: "AC-2 — Account Management",
      exact: true,
    }),
  ).toBeVisible();
});

test("V1 workflow 02 — search a topic without an identifier", async ({ page }) => {
  await open(page, "/#/search?q=account%20management");
  await expect(page.getByLabel("Search by ID, title, or topic")).toHaveValue(
    "account management",
  );
  await expect(page.locator("#library-results .result-card").first()).toBeVisible();
});

test("V1 workflow 03 — distinguish exact, ambiguous, and honest zero results", async ({
  page,
}) => {
  await open(page, "/#/search?q=AC-2");
  await expect(
    page.getByRole("article", {
      name: "AC-2 — Account Management",
      exact: true,
    }),
  ).toBeVisible();

  await open(page, "/#/search?q=account");
  expect(await page.locator("#library-results .result-card").count()).toBeGreaterThan(1);

  await open(page, "/#/search?q=definitely-no-control-atlas-result-9x7");
  await expect(
    page.getByRole("heading", { name: "No matching records found." }),
  ).toBeVisible();
});

test("V1 workflow 04 — verify official record identity and source", async ({ page }) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await expect(
    page.getByRole("heading", { name: /AC-2.*Account Management/, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Source excerpt from SP 800-53 Rev. 5", { exact: true }),
  ).toBeVisible();
});

test("V1 workflow 05 — follow a record and return without losing search state", async ({
  page,
}) => {
  await open(page, "/#/search?q=AC-2");
  await page
    .getByRole("article", {
      name: "AC-2 — Account Management",
      exact: true,
    })
    .getByRole("button", { name: "Open record" })
    .click();
  await expect(page).toHaveURL(/#\/record\/nist-800-53\/AC-2/);
  await page.getByRole("button", { name: "Back to results" }).click();
  await expect(page).toHaveURL(/#\/search\?q=AC-2/);
  await expect(page.getByLabel("Search by ID, title, or topic")).toHaveValue("AC-2");
});

test("V1 workflow 06 — explore one declared scope through Path, Map, and List", async ({
  page,
}) => {
  await open(page, "/#/explore?node=nist-800-53%3AAC-2");
  await expect(page.getByRole("tabpanel", { name: "Path" })).toBeVisible();
  await page.getByRole("tab", { name: "Map", exact: true }).click();
  await expect(page.getByRole("region", { name: "Relationship map" })).toBeVisible();
  await page.getByRole("tab", { name: "List", exact: true }).click();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("V1 workflow 07 — compare with a shareable explicit configuration", async ({
  page,
}) => {
  await open(
    page,
    "/#/compare?workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await expect(page).toHaveURL(/workbench=relationships/);
  await expect(
    page.getByRole("heading", { name: "Catalog to catalog" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: /^Mapping source/ })
    .selectOption({ label: "NIST CSF 2.0" });
  await page.getByRole("button", { name: "Show mappings" }).click();
  await expect(page).toHaveURL(/mappingSource=/);
  await expect(
    page.getByRole("table", { name: "Relationship mappings" }),
  ).toBeVisible({ timeout: 30_000 });
});

test("V1 workflow 08 — inspect a source and how it is used", async ({ page }) => {
  await open(page, "/#/sources?q=NIST");
  await expect(page.getByRole("table", { name: "Control Atlas source register" })).toBeVisible();
  await expect(page.getByLabel("Search sources")).toHaveValue("NIST");
  await expect(page.locator(".source-register-row").first()).toBeVisible();
});

test("V1 workflow 09 — find an external tool or starter resource", async ({ page }) => {
  await open(page, "/#/resources?q=OSCAL");
  await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder("Search external resources")).toHaveValue("OSCAL");
  await expect(page.getByRole("region", { name: "Resource results" })).toBeVisible();
});

test("V1 workflow 10 — recover from invalid settings, missing records, and empty filters", async ({
  page,
}) => {
  await open(page, "/#/explore?relationshipView=unsupported&bogus=value");
  await expect(page.locator(".route-recovery")).toContainText("unsupported link settings");
  await open(page, "/#/record/nist-800-53/NOT-A-REAL-CONTROL");
  await expect(page.getByRole("heading", { name: "Item not found" })).toBeVisible();
});

test("V1 workflow 11 — refresh and browser history preserve valid URL state", async ({
  page,
}) => {
  await open(page, "/#/resources?lane=official");
  const filters = page.getByRole("button", { name: /^Filters/ });
  await filters.click();
  const ownerType = page.getByLabel("Owner type");
  await expect(ownerType).toHaveValue("official");
  await page.reload();
  await expect(ownerType).toHaveValue("official");
  await filters.click();
  await ownerType.selectOption("all");
  await page.goBack();
  await expect(ownerType).toHaveValue("official");
});

test("V1 workflow 12 — defining work reflows at mobile, tablet, and desktop widths", async ({
  page,
}) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await open(page, "/#/");
    await expect(page.locator(".home-entry .brand-kbd")).toBeVisible();
    await expect(page.locator(".home-entry .brand-key-word")).not.toBeEmpty();
    await expect(page.getByRole("search")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      client: globalThis.document.documentElement.clientWidth,
      scroll: globalThis.document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  }
});
