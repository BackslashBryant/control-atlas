import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("homepage reads as a connected federal cybersecurity reference system", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "See the landscape. Trace the source. Move the work forward." })).toBeVisible();
  await expect(page.getByText("Control Atlas brings the federal cybersecurity landscape together in one place", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Federal cybersecurity ecosystem preview")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Choose a Control Atlas destination" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Resources", exact: true })).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);

  await page.screenshot({ path: testInfo.outputPath("epic13-home-desktop.png"), fullPage: true });
});

test("Resources is a first-class durable destination", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/resources");
  await waitForAppReady(page);

  await expect(page).toHaveURL(/#\/resources$/);
  await expect(page.getByRole("heading", { name: "Find the ecosystem around the work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse eight practical collections" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("aria-current", "page");
});

test("Atlas overview aggregates the ecosystem and uses inspector-led drilldown", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);

  await expect(page.getByRole("heading", { name: "Federal cybersecurity, from authority to action" })).toBeVisible();
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-tree-node-count", "13");
  await expect(page.locator(".atlas-tree__workbench")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cybersecurity", exact: true })).toBeVisible();

  await page.locator('[data-atlas-node-id="atlas:LIMB-GOVERNANCE"]').click();
  await expect(page.locator(".atlas-tree__inspector").getByRole("heading", { name: "Governance", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/atlas$/);
  await page.screenshot({ path: testInfo.outputPath("epic13-atlas-workbench.png"), fullPage: true });

  await page.getByRole("button", { name: "Open this area" }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-GOVERNANCE/);
});

test("mobile homepage preserves the product story without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/");

  await expect(page.getByRole("heading", { name: "See the landscape. Trace the source. Move the work forward." })).toBeVisible();
  await expect(page.getByLabel("Federal cybersecurity ecosystem preview")).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath("epic13-home-mobile.png"), fullPage: true });
});
