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

  // The landing page directly presents the primary intent paths
  await expect(
    page.getByRole("button", { name: "Research & Learn", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Atlas Map", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Build & Create", exact: true }),
  ).toBeVisible();
});

test("critical path: Atlas matrix table links to graph node", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Framework Map" }).click();
  await expect(page).toHaveURL(/node=foundation/);

  // Coverage matrix now lives in a collapsible drawer (graph-first redesign).
  await page.getByText("Coverage matrix", { exact: true }).click();
  const matrix = page.getByRole("table", { name: "Atlas coverage matrix" });
  await expect(matrix).toBeVisible();
  const firstRow = matrix.locator("tbody tr").first();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-selected", "true");
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
  await expect(page.getByText("Official link").first()).toBeVisible();
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
  await expect(page.getByText("Official link").first()).toBeVisible();
  await expect(table).toContainText("Plain-language rationale");
});

test("critical path: STIG chain summary table is labeled for screen readers", async ({
  page,
}) => {
  await page.goto("/?view=matrix&workbench=stig-chain");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("table", { name: "STIG chain summary" }),
  ).toBeVisible();
  await expect(
    page.getByText("Official link = published mapping"),
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
    page.getByRole("button", { name: "Open record" }).first(),
  ).toBeVisible({
    timeout: 90000,
  });
  await page.getByRole("button", { name: "Open record" }).first().click();
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
    page.getByText("Official link = MITRE published mapping"),
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
  await primaryNav.getByRole("button", { name: "Research · Learn" }).click();
  const startHere = primaryNav.getByRole("menuitem", {
    name: "Start",
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
