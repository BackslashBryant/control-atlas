import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("homepage reads as a connected federal cybersecurity reference system", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Make federal cybersecurity compliance make sense." })).toBeVisible();
  await expect(page.getByText("Understand what applies, what it means, and what to do next.", { exact: true })).toBeVisible();
  await expect(page.locator(".home-ecosystem")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Choose a Control Atlas destination" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "See what's inside Control Atlas." }).locator(".home-library-kpi")).toHaveCount(6);
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
  await expect(page.getByRole("heading", { name: "Browse by Collection" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("aria-current", "page");
});

test("Atlas overview aggregates the ecosystem and drills directly", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByText("Explore areas, publications, and the published connections between them.", { exact: true })).toBeVisible();
  const network = page.getByTestId("atlas-network");
  await expect(network).toHaveAttribute("data-projection-level", "landscape");
  await expect(network.getByRole("button", { name: /Area ·/ })).toHaveCount(9);
  await expect(network).toHaveClass(/atlas-network--semantic/);
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-graph-first.png"), fullPage: true });

  await network.getByRole("button", { name: /^Governance\s+Area ·/ }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas(?::|%3A)LIMB-GOVERNANCE/);
  await expect(page.getByTestId("atlas-network")).toHaveAttribute("data-projection-level", "area");
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-workbench.png"), fullPage: true });
});

test("mobile homepage preserves the product story without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Make federal cybersecurity compliance make sense." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "See what's inside Control Atlas." }).locator(".home-library-kpi")).toHaveCount(6);
  await expect(page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth)).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath("epic13-home-mobile.png"), fullPage: true });
});
