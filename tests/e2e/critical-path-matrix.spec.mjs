import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("critical path: landing hero and primary entry cards are visible", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Start here" })).toBeVisible();
  const shortcuts = page.locator(".landing-shortcut-grid .landing-shortcut");
  await expect(shortcuts).toHaveCount(6);
  await expect(shortcuts.filter({ hasText: "Atlas" })).toBeVisible();
  await expect(shortcuts.filter({ hasText: "Library" })).toBeVisible();
  await expect(shortcuts.filter({ hasText: "Compare" })).toBeVisible();
  await expect(shortcuts.filter({ hasText: "Commons" })).toBeVisible();
  await expect(shortcuts.filter({ hasText: "Guides" })).toBeVisible();
  await expect(shortcuts.filter({ hasText: "Documents" })).toBeVisible();
});

test("critical path: the Atlas Path walks to a published connected record", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Pick a stage, then a record in it, then continue the path from that
  // record: the subject changes, which is the whole point of the walk.
  await page
    .locator(".atlas-path-stage-option:not(:disabled)")
    .first()
    .click();
  const connected = page.locator(".atlas-path-record").first();
  await expect(connected).toBeVisible();
  await connected.click();
  const previousUrl = page.url();
  await page.getByRole("button", { name: /^Continue from / }).click();
  await expect(page).not.toHaveURL(previousUrl);
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
    "AC-2 — Account Management",
  );
});

test("critical path: Atlas Open full record leaves the path for record detail", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .locator(".atlas-path-stage-option:not(:disabled)")
    .first()
    .click();
  await page.locator(".atlas-path-record").first().click();
  await page.getByRole("button", { name: "Open full record" }).click();

  await expect(page).toHaveURL(/#\/record\//);
  await expect(page.locator(".detail-page")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to Atlas" }),
  ).toBeVisible();
});

test("critical path: record back returns to the original Explore results", async ({
  page,
}) => {
  await page.goto("/#/explore?q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator(".result-card").first().getByRole("button", { name: "Open record" }).click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page
    .locator(".page-header-actions")
    .getByRole("button", { name: "Back to results" })
    .click();

  await expect(page).toHaveURL(/#\/explore\?q=AC-2/);
  await expect(page.getByLabel("Search by ID, title, or topic")).toHaveValue(
    "AC-2",
  );
});

test("critical path: compare detailed mappings expose text provenance labels", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator("#compare-results")).toBeVisible({
    timeout: 15000,
  });

  const table = page.getByRole("table", { name: "Relationship mappings" });
  await expect(table).toBeVisible();
  await expect(table).toContainText("Plain-language rationale");
  await expect(page.getByText("Published mapping").first()).toBeVisible();
});

test("critical path: library detail relationships show connection and source trust text", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Connections" }).first(),
  ).toBeVisible();
  await page.locator(".relationship-group-trigger").first().click();
  const relationshipCard = page.locator(".relationship-card").first();
  await expect(relationshipCard).toBeVisible();
  await expect(
    relationshipCard.locator(".relationship-meta span").first(),
  ).not.toBeEmpty();
  await expect(
    relationshipCard.locator(".relationship-meta span").nth(1),
  ).not.toBeEmpty();
});

test("critical path: library detail relationship map exposes table fallback", async ({
  page,
}) => {
  await page.goto(
    "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  await expect(table).toContainText("Published federal source");
  await expect(table).toContainText("Why it matters");
  await expect(table).not.toContainText("Review both sides of this");
});

test("critical path: STIG chain summary table is labeled for screen readers", async ({
  page,
}) => {
  await page.goto("/?view=matrix&workbench=stig-chain");
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
  await page.goto("/?view=search&q=T1033");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.locator("#library-results .result-card .card-title-action").first(),
  ).toBeVisible({
    timeout: 90000,
  });
  await page
    .locator("#library-results .result-card .card-title-action")
    .first()
    .click();
  await expect(page).toHaveURL(/record\/mitre-attack|library-detail/);
  await expect(page.getByText("What this is")).toBeVisible();
  await expect(page.getByText("Threat context")).toBeVisible();
});

test("critical path: threat chain summary table is labeled for screen readers", async ({
  page,
}) => {
  await page.goto(
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
  await page.goto("/?view=matrix&workbench=baseline-compare");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("Baseline A").selectOption("nist-800-53b:LOW");
  await page.getByLabel("Baseline B").selectOption("nist-800-53b:MODERATE");
  await expect(
    page.getByText("Only in B", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".chain-grid")).toContainText("AC-");
  await page.locator("details.export-disclosure summary").click();
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
});

test("critical path: keyboard focus reaches primary nav and header search", async ({
  page,
}) => {
  // The home view is a self-contained calm entrance without the persistent
  // site chrome (its own wordmark/search/buttons cover that role there) — the
  // primary nav and header search this test exercises only render once the
  // user has navigated somewhere else.
  await page.goto("/?view=explore");
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
  const startHere = page.getByRole("button", {
    name: "Start here",
    exact: true,
  });
  await startHere.focus();
  await expect(startHere).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Find the best place to start" }),
  ).toBeVisible();

  const search = page.getByLabel("Search records and glossary");
  await search.click();
  await expect(search).toBeFocused();
});
