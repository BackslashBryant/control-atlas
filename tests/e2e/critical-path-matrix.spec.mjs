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
  await expect(page.getByText("Start with meaning")).toBeVisible();
  await expect(
    page.locator(".intent-card").filter({ hasText: "Library" }),
  ).toBeVisible();
  await expect(
    page.locator(".intent-card").filter({ hasText: "Compare" }),
  ).toBeVisible();
  await expect(
    page.locator(".intent-card").filter({ hasText: "Templates" }),
  ).toBeVisible();
});

test("critical path: compare detailed mappings expose text provenance labels", async ({
  page,
}) => {
  await page.goto("/?view=matrix");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .locator(".intent-card", { hasText: "Framework to framework" })
    .click();
  await page.getByLabel("Framework A").selectOption("nist-800-53");
  await page.getByLabel("Framework B").selectOption("csf-2");
  await page.getByRole("button", { name: "View detailed mappings" }).click();

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
    page.getByRole("heading", { name: "What it connects to" }),
  ).toBeVisible();
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
    "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=table",
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
  await page.goto("/?view=search&q=T1033");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open detail" }).first().click();
  await expect(page).toHaveURL(/view=library-detail/);
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
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
});

test("critical path: keyboard focus reaches primary nav and header search", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  const startHere = primaryNav.getByRole("button", {
    name: "Start Here",
    exact: true,
  });
  await startHere.focus();
  await expect(startHere).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Find the best place to start" }),
  ).toBeVisible();

  const search = page.getByLabel("Search library and glossary");
  await search.focus();
  await expect(search).toBeFocused();
});
