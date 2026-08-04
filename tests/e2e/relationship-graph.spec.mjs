import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas standalone route opens straight to Connections, with Hierarchy and List as panels", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("Atlas default route is the semantic authority hierarchy, not an empty relationship graph", async ({ page }) => {
  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("application", { name: "Interactive Control Atlas hierarchy" })).toBeVisible();
  await expect(page.locator(".atlas-universe__area")).toHaveCount(9);
  await expect(page.locator(".react-flow")).toHaveCount(1);
  await expect(page.locator(".ca-flow-wrap")).toHaveCount(0);
});

test("relationship graph on detail page retains its accessible List fallback", async ({ page }) => {
  await page.goto(
    "/#/record/nist-800-53/AC-2?relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("record detail Map uses the shared graph and keeps its controls stable", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2?relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-is-cluster="true"]').first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();

  const viewport = page.locator(".react-flow__viewport");
  await expect(
    page.locator(".ca-flow-wrap > p[aria-live='polite']"),
  ).toContainText("Diagram ready", { timeout: 15000 });
  await page.waitForTimeout(500);
  const before = await viewport.getAttribute("style");
  await page.waitForTimeout(500);
  await expect(viewport).toHaveAttribute("style", before || "");
  await page.locator("[data-graph-shortcut]:not([data-is-cluster])").nth(1).click();
  await page.waitForTimeout(350);
  await expect(viewport).toHaveAttribute("style", before || "");
});

test("record detail opens the same record in the new Atlas", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open in the Atlas" }).first().click();
  await expect(page).toHaveURL(/#\/explore/);
  await expect(page.getByRole("heading", { name: "AC-2", level: 1 })).toBeVisible();
});
