import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("critical path: landing hero and primary entry cards are visible", async ({
  page,
}) => {
  await gotoApp(page, "/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", {
      name: /Find the source\. See what connects/,
    }),
  ).toBeVisible();

  await expect(page.getByRole("search").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Understand a requirement/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Operate or defend/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Produce a document/ }),
  ).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(7);
});

test("critical path: the Atlas Path walks to a published connected record", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const connected = page
    .getByRole("table", { name: "Relationship table" })
    .locator("tbody")
    .getByRole("button")
    .first();
  await connected.click();
  const previousUrl = page.url();
  await page
    .getByRole("button", { name: "Explore from this record" })
    .click();
  await expect(page).not.toHaveURL(previousUrl);
  await expect(page).not.toHaveURL(/node=nist-800-53%3AAC-2(?:&|$)/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("critical path: Atlas selected title leaves the map for record detail", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("table", { name: "Relationship table" })
    .locator("tbody")
    .getByRole("button")
    .first()
    .click();
  const brief = page.getByLabel(/record brief/);
  await expect(brief.getByRole("button", { name: "Open full record" })).toHaveCount(0);
  await brief.locator("h2 button").click();

  await expect(page).toHaveURL(/#\/record\//);
  await expect(page.locator(".detail-page")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to Explore" }),
  ).toBeVisible();
});

test("critical path: browser back returns from a record to the original search", async ({
  page,
}) => {
  await gotoApp(page, "/#/search?q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("article", {
      name: "AC-2 — Account Management",
      exact: true,
    })
    .locator(".search-result-primary")
    .click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/#\/search\?q=AC-2/);
  await expect(page.getByLabel("Search by ID, title, or topic")).toHaveValue(
    "AC-2",
  );
});

test("critical path: compare detailed mappings expose text provenance labels", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/compare?workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("combobox", { name: /^Mapping publication/ })
    .selectOption({ label: "NIST CSF 2.0" });
  await page.getByRole("button", { name: "Show mappings" }).click();
  await expect(page.locator("#compare-results")).toBeVisible({
    timeout: 15000,
  });

  const table = page.getByRole("table", { name: "Relationship mappings" });
  await expect(table).toBeVisible();
  await expect(table).toContainText("Official rationale");
  await expect(table).toContainText("Relationship explanation");
  await expect(table.getByText("Published mapping").first()).toBeVisible();
});

test("critical path: library detail connections show meaning and source trust text", async ({
  page,
}) => {
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Connections" }).first(),
  ).toBeVisible();
  const relationshipCard = page.locator("[data-record-connection-id]").first();
  await expect(relationshipCard).toBeVisible();
  await expect(
    relationshipCard.locator(".relationship-meta"),
  ).not.toBeEmpty();
  await expect(
    relationshipCard.locator(".relationship-citation"),
  ).not.toBeEmpty();
});

test("critical path: record reading page uses a list and keeps the graph in Atlas", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/record/nist-800-53/AC-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const connections = page.locator('[data-record-section="connections"]');
  await expect(connections).toBeVisible();
  await expect(connections.locator("ul")).toBeVisible();
  await expect(page.locator(".record-template .react-flow")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See in Atlas", exact: true })).toBeVisible();
});

test("critical path: STIG chain summary table is labeled for screen readers", async ({
  page,
}) => {
  await gotoApp(page, "/?view=matrix&workbench=stig-chain");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("table", { name: "STIG chain summary" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("Published mappings come from named sources"),
  ).toBeVisible();
});

test("critical path: MITRE library search returns technique with plain-language summary", async ({
  page,
}) => {
  test.setTimeout(120000);
  await gotoApp(page, "/?view=search&q=T1033");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.locator("#library-results .search-result-primary").first(),
  ).toBeVisible({
    timeout: 90000,
  });
  await page
    .locator("#library-results .search-result-primary")
    .first()
    .click();
  await expect(page).toHaveURL(/record\/mitre-attack|library-detail/);
  await expect(
    page.getByRole("heading", { name: /T1033/, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Official source text", { exact: true })).toBeVisible();
  await expect(page.getByText("What this is", { exact: true })).toBeVisible();
});

test("critical path: threat chain summary table is labeled for screen readers", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/?view=matrix&workbench=threat-chain&chainCatalog=mitre-attack",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("table", { name: "Threat chain summary" }),
  ).toBeVisible();
  await expect(
    page.getByText("Published mappings come from MITRE"),
  ).toBeVisible();
});

test("critical path: baseline compare surfaces delta controls with export actions", async ({
  page,
}) => {
  await gotoApp(page, "/?view=matrix&workbench=baseline-compare");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("Baseline A").selectOption("nist-800-53b:LOW");
  await page.getByLabel("Baseline B").selectOption("nist-800-53b:MODERATE");
  await expect(
    page.getByText("Only in B", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".chain-grid")).toContainText("AC-");
  // The `export-disclosure` class was removed in the Orbital Archive design
  // refactor (786f10f); CompareExportDisclosure now renders a plain
  // <details><summary>Export results</summary>.
  await page.getByText("Export results", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
});

test("critical path: keyboard focus reaches primary nav and search", async ({
  page,
}) => {
  // 2026-08-03: utility navigation grew from 3 items to 5 (Resources/About
  // joined Sources/Help/Start here), which needs more header width before
  // the full desktop chrome fits — see styles/orbital.css's compactNavigation
  // breakpoint comment. Playwright's bare default viewport (1280x720) is
  // below it now, so the primary nav this test exercises would otherwise be
  // the (correctly) collapsed mobile-sheet version instead.
  await page.setViewportSize({ width: 1600, height: 900 });
  await gotoApp(page, "/?view=explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  const library = primaryNav.getByRole("button", {
    name: "Library",
    exact: true,
  });
  await library.focus();
  await expect(library).toBeFocused();
  // Scoped to the banner: the static search shell's own "Start here" button
  // can also be present in the DOM while its route is loading.
  const startHere = page.getByRole("banner").getByRole("button", {
    name: "Start here",
    exact: true,
  });
  await startHere.focus();
  await expect(startHere).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Start here", exact: true }),
  ).toBeVisible();

  const search = page.getByRole("button", { name: "Open search" });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("searchbox", { name: "Search Control Atlas" }),
  ).toBeFocused();
});
