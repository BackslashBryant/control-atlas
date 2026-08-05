import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

async function open(page, route) {
  await page.goto(route);
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

test("V1 workflow 01 — find a known identifier", async ({ page }) => {
  await open(page, "/#/");
  await page.getByRole("searchbox", { name: "Search Control Atlas" }).fill("AC-2");
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
  await expect(page.locator("#library-results .search-result-row").first()).toBeVisible();
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
  expect(await page.locator("#library-results .search-result-row").count()).toBeGreaterThan(1);

  await open(page, "/#/search?q=qzxv9417nohit");
  await expect(
    page.getByRole("heading", { name: "No matching results found." }),
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
    .getByRole("button", { name: "AC-2 — Account Management" })
    .click();
  await expect(page).toHaveURL(/#\/record\/nist-800-53\/AC-2/);
  await page.getByRole("button", { name: "Back to results" }).click();
  await expect(page).toHaveURL(/#\/search\?q=AC-2/);
  await expect(page.getByLabel("Search by ID, title, or topic")).toHaveValue("AC-2");
});

test("V1 workflow 06 — explore one record through Connections, Hierarchy, and the full list", async ({
  page,
}) => {
  await open(page, "/#/explore?node=nist-800-53%3AAC-2");

  // Connections is the workspace: it is present without choosing a mode.
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible();
  // Orientation stays on screen without opening anything.
  await expect(page.locator(".atlas-workspace-crumb")).toContainText(
    "SP 800-53 Rev. 5",
  );

  // Hierarchy is a supporting panel with real structural substance.
  await page.getByRole("button", { name: "Hierarchy" }).click();
  await expect(page).toHaveURL(/relationshipView=path/);
  const hierarchy = page.locator("#atlas-hierarchy-panel");
  await expect(hierarchy).toContainText("Control Atlas structure");
  await expect(hierarchy).toContainText("Publisher hierarchy");
  await expect(hierarchy).toContainText("Decomposes into");
  await expect(
    hierarchy.getByRole("button", { name: "AC-2.1", exact: true }),
  ).toBeVisible();

  // The complete list supports the map instead of replacing it.
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(page).toHaveURL(/relationshipView=list/);
  await expect(
    page.getByRole("table", { name: "Relationship table" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible();
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
    .getByRole("combobox", { name: /^Mapping publication/ })
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
  await expect(page.getByRole("heading", { name: "Find the ecosystem around the work", level: 1 })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Find resources" })).toHaveValue("OSCAL");
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
  const owner = "National Institute of Standards and Technology";
  await open(page, `/#/resources?owner=${encodeURIComponent(owner)}`);
  const filters = page.getByRole("button", { name: /^Filters/ });
  await filters.click();
  const ownerFilter = page.getByLabel("Owner");
  await expect(ownerFilter).toHaveValue(owner);
  await page.reload();
  await expect(ownerFilter).toHaveValue(owner);
  await filters.click();
  await ownerFilter.selectOption("");
  await page.goBack();
  await expect(ownerFilter).toHaveValue(owner);
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
    await expect(page.locator(".site-header:visible .brand-name").last()).toBeVisible();
    await expect(page.getByRole("search")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      client: globalThis.document.documentElement.clientWidth,
      scroll: globalThis.document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  }
});
