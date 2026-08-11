import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("homepage reads as a connected federal cybersecurity reference system", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Federal cybersecurity requirements, sources, and how they connect." })).toBeVisible();
  await expect(page.getByText("Search official requirements and controls", { exact: false })).toBeVisible();
  await expect(page.locator(".home-ecosystem")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Choose a Control Atlas destination" }).getByRole("link")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Browse by area" }).getByRole("link")).toHaveCount(9);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Resources", exact: true })).toBeVisible();
  await expect(page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth)).resolves.toBe(true);

  await page.screenshot({ path: testInfo.outputPath("epic13-home-desktop.png"), fullPage: true });
});

test("Resources is a first-class durable destination", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/resources");
  await waitForAppReady(page);

  await expect(page).toHaveURL(/#\/resources$/);
  await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
  await expect(page.locator('[data-page-template="workspace"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse eight practical collections" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("aria-current", "page");
});

test("Atlas overview aggregates the ecosystem and drills directly", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByText("See the landscape, then drill in.", { exact: true })).toBeVisible();
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-tree-node-count", "13");
  await expect(page.locator(".atlas-tree__workbench")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cybersecurity", exact: true })).toBeVisible();

  await page.locator('[data-atlas-node-id="atlas:LIMB-GOVERNANCE"]').click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-GOVERNANCE/);
  await expect(page.getByRole("navigation", { name: "Atlas breadcrumb" })).toContainText("Governance");
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-workbench.png"), fullPage: true });
});

test("mobile homepage preserves the product story without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Federal cybersecurity requirements, sources, and how they connect." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Browse by area" }).getByRole("link")).toHaveCount(9);
  await expect(page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth)).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath("epic13-home-mobile.png"), fullPage: true });
});
