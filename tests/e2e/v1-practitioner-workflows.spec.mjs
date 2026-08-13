import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

async function open(page, route) {
  await page.goto(route);
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

test("V1 workflow 01 — find a known identifier", async ({ page }) => {
  await open(page, "/#/");
  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("dialog", { name: "Search Control Atlas" })
    .getByRole("searchbox", { name: "Search Control Atlas" });
  await search.fill("AC-2");
  await search.press("Enter");
  await expect(page).toHaveURL(/#\/library\?q=AC-2/);
  await expect(page.locator('[data-record-id="nist-800-53:AC-2"]')).toBeVisible();
});

test("V1 workflow 02 — search a topic without an identifier", async ({ page }) => {
  await open(page, "/#/search?q=account%20management");
  await expect(page.getByLabel("Filter results by ID, title, or topic")).toHaveValue(
    "account management",
  );
  await expect(page.locator("#library-results .workspace-result-row").first()).toBeVisible();
});

test("V1 workflow 03 — distinguish exact, ambiguous, and honest zero results", async ({
  page,
}) => {
  await open(page, "/#/search?q=AC-2");
  await expect(page.locator('[data-record-id="nist-800-53:AC-2"]')).toBeVisible();

  await open(page, "/#/search?q=account");
  await expect
    .poll(() => page.locator("#library-results .workspace-result-row").count())
    .toBeGreaterThan(1);

  await open(page, "/#/search?q=qzxv9417nohit");
  await expect(
    page.getByRole("heading", { name: "No records found." }),
  ).toBeVisible();
});

test("V1 workflow 04 — verify official record identity and source", async ({ page }) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await expect(
    page.getByRole("heading", { name: "NIST AC-2", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".record-official-name")).toHaveText("Account Management");
  await expect(page.getByRole("heading", { name: "Control Statement", exact: true })).toBeVisible();
  const facts = page.locator(".record-source-facts");
  await expect(facts).toContainText("Publisher");
  await expect(facts).toContainText("NIST");
  await expect(facts).toContainText("Version");
  await expect(facts).toContainText(/Revision 5|Rev\. 5/);
  await expect(facts).toContainText("Retrieved");
  await expect(facts).toContainText("Last verified");

  await open(page, "/#/record/nist-mobile-threats/CEL-1");
  const retrievedOnlyFacts = page.locator(".record-source-facts");
  await expect(retrievedOnlyFacts).toContainText("Retrieved");
  await expect(retrievedOnlyFacts).not.toContainText("Last verified");
});

test("V1 workflow 05 — follow a record and return without losing search state", async ({
  page,
}) => {
  await open(page, "/#/search?q=AC-2");
  await page.locator('[data-record-id="nist-800-53:AC-2"] .workspace-result-row__link').click();
  await expect(page).toHaveURL(/#\/record\/nist-800-53\/AC-2/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/library\?q=AC-2/);
  await expect(page.getByLabel("Filter results by ID, title, or topic")).toHaveValue("AC-2");
});

test("V1 workflow 06 — explore one record through Connections, Hierarchy, and the full list", async ({
  page,
}) => {
  await open(page, "/#/explore?node=nist-800-53%3AAC-2");

  // The Atlas map skill tree is the workspace: it is present without
  // choosing a supporting panel.
  await expect(page.locator(".atlas-tree")).toBeVisible();
  // Orientation stays on screen without opening anything.
  await expect(page.locator(".atlas-tree__breadcrumb")).toContainText(
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
    hierarchy.getByRole("link", { name: "AC-2.1", exact: true }),
  ).toBeVisible();

  // The complete list supports the Atlas map instead of replacing it.
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(page).toHaveURL(/relationshipView=list/);
  await expect(
    page.getByRole("table", { name: "Relationship table" }),
  ).toBeVisible();
  await expect(page.locator(".atlas-tree")).toBeVisible();
});

test("V1 workflow 07 — compare with a shareable explicit configuration", async ({
  page,
}) => {
  await open(
    page,
    "/#/compare?workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await expect(page).toHaveURL(/#\/compare\/relationships\?source=nist-800-53&target=csf-2$/);
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
  await expect(page.getByLabel("Search publications")).toHaveValue("NIST");
  await expect(page.locator(".source-register-row").first()).toBeVisible();

  await open(
    page,
    "/#/sources?source=nist-iot-device-cybersecurity-requirement-catalogs",
  );
  const iotDetail = page.locator(".sources-page");
  await expect(iotDetail).toContainText("Publisher version");
  await expect(iotDetail).toContainText("Spring 2021");
  await expect(iotDetail).toContainText("Retrieved");
  await expect(iotDetail).toContainText("Last verified");
  await expect(iotDetail).toContainText("Not recorded");
  await expect(iotDetail).not.toContainText("undefined");

  await open(page, "/#/sources?source=nist-800-53a-assessment-procedures");
  const assessmentDetail = page.locator(".source-detail-grid");
  await expect(
    assessmentDetail.getByRole("link", { name: "https://csrc.nist.gov/pubs/sp/800/53/a/r5/final" }),
  ).toBeVisible();
  await expect(assessmentDetail).toContainText("Retrieved artifact");
  await expect(assessmentDetail).toContainText("NIST_SP-800-53_rev5_catalog.json");
});

test("V1 workflow 09 — find an external tool or starter resource", async ({ page }) => {
  await open(page, "/#/resources?q=OSCAL");
  await expect(page).toHaveURL(/#\/resources\?q=OSCAL/);
  await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Find resources" })).toHaveValue("OSCAL");
  await expect(page.locator(".workspace-result-row--resource").first()).toBeVisible();
});

test("V1 workflow 10 — recover from invalid settings, missing records, and empty filters", async ({
  page,
}) => {
  await open(page, "/#/explore?relationshipView=unsupported&bogus=value");
  await expect(page.locator(".route-recovery")).toContainText("unsupported link settings");
  await open(page, "/#/record/nist-800-53/NOT-A-REAL-CONTROL");
  await expect(page.getByRole("heading", { name: "Record not found" })).toBeVisible();
});

test("V1 workflow 11 — refresh and browser history preserve valid URL state", async ({
  page,
}) => {
  await open(page, "/#/library?q=AC-2&kind=requirements&sort=identifier");
  const kindFilter = page.getByRole("group", { name: "Content kind" }).getByRole("checkbox", { name: /Requirements/ });
  const sort = page.getByLabel("Sort Library results");
  await expect(kindFilter).toBeChecked();
  await expect(sort).toHaveValue("identifier");
  await page.reload();
  await expect(kindFilter).toBeChecked();
  await expect(sort).toHaveValue("identifier");
  await sort.selectOption("title");
  await expect(page).toHaveURL(/sort=title/);
  await page.goBack();
  await expect(kindFilter).toBeChecked();
  await expect(sort).toHaveValue("identifier");
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
