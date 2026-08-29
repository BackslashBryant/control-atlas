import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("homepage reads as a connected federal cybersecurity reference system", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Make federal cybersecurity make sense." })).toBeVisible();
  await expect(page.getByText("Understand what applies, what it means, and what to do next.", { exact: true })).toBeVisible();
  await expect(page.locator(".home-ecosystem")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Choose a Control Atlas destination" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "Start with what you came to find." }).locator(".home-library-kpi")).toHaveCount(5);
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
  await expect(page.getByText("Open any part of the landscape to see what is published inside it, and how much.", { exact: true })).toBeVisible();
  const atlas = page.getByTestId("atlas-map");
  await expect(atlas).toHaveAttribute("data-scope-level", "root");
  const areas = atlas.locator('.atlas-decomp__column[data-column="area"]');
  await expect(areas).toHaveAttribute("data-row-count", "12");
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-graph-first.png"), fullPage: true });

  await areas.getByRole("button", { name: /^Governance/ }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas(?::|%3A)LIMB-GOVERNANCE/);
  await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "area");
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-workbench.png"), fullPage: true });
});

test("mobile homepage preserves the product story without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "Make federal cybersecurity make sense." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Start with what you came to find." }).locator(".home-library-kpi")).toHaveCount(5);
  await expect(page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth)).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath("epic13-home-mobile.png"), fullPage: true });
});
