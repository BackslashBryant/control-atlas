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

async function openAtlas(page, path = "/#/atlas") {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoApp(page, path);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator(".atlas-tree")).toBeVisible();
}

async function selectTreeNode(page, id) {
  await page
    .locator(`.react-flow__node:has([data-atlas-node-id="${id}"])`)
    .dispatchEvent("click");
}

async function drillNode(page, id) {
  await selectTreeNode(page, id);
}

test("Atlas overview hands off to publisher-native navigation and preserves history", async ({ page }) => {
  test.setTimeout(120_000);
  await openAtlas(page);

  const tree = page.locator(".atlas-tree");
  await expect(tree).toHaveAttribute("data-tree-node-count", "13");
  await expect(page.getByText("Start with a topic and work toward the details.", { exact: true })).toBeVisible();
  await expect(tree.locator('[data-atlas-node-id="atlas:TRUNK"]')).toBeVisible();
  await expect(tree.locator('[data-atlas-node-id^="authority-aggregate:"]')).toHaveCount(3);
  await expect(tree.locator('[data-atlas-node-id^="atlas:LIMB-"]')).toHaveCount(9);
  const stage = tree.locator(".atlas-tree__stage");
  await expect(stage).toHaveAttribute("data-semantic-level", "orientation");
  await page.waitForTimeout(550);
  for (let step = 0; step < 4; step += 1) await page.getByTitle("Zoom in").click();
  await expect(stage).toHaveAttribute("data-semantic-level", "justification");

  await drillNode(page, "atlas:LIMB-IMPLEMENTATION");
  await expect(stage).toHaveAttribute("data-semantic-level", "justification");
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-IMPLEMENTATION/);
  await drillNode(page, "disa-stig:CATALOG");
  await expect(page).toHaveURL(/atlasFramework=disa-stig/);
  const explorer = page.locator("[data-atlas-structural-explorer]");
  await expect(explorer.getByRole("heading", { name: "DISA STIG Catalog" })).toBeVisible();
  await expect(tree.locator(".react-flow")).toHaveCount(0);
  await expect(tree.locator("select")).toHaveCount(0);
  await explorer.getByLabel("Search this publication").fill("Oracle Linux 9");
  await explorer.getByRole("button", { name: /Oracle Linux 9/ }).click();
  await expect(page).toHaveURL(/\/#\/atlas\/disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG\?/);
  await expect(explorer.getByRole("heading", { name: /Oracle Linux 9/ })).toBeVisible();

  await page.reload();
  await waitForAppReady(page);
  await expect(page.locator("[data-atlas-structural-explorer]").getByRole("heading", { name: /Oracle Linux 9/ })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/\/#\/atlas\/disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG/);
  await expect(page.locator("[data-atlas-structural-explorer]").getByRole("heading", { name: "DISA STIG Catalog" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/#\/atlas\/disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG\?/);
  await expect(page.locator("[data-atlas-structural-explorer]").getByRole("heading", { name: /Oracle Linux 9/ })).toBeVisible();

  await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-THREAT&atlasFramework=mitre-attack");
  await waitForAppReady(page);
  await page.locator("[data-atlas-structural-explorer]").getByRole("button", { name: /TA0001/ }).click();
  await expect(page).toHaveURL(/\/#\/atlas\/mitre-attack:TACTIC-TA0001\?/);
  await page.reload();
  await waitForAppReady(page);
  await expect(page.locator("[data-atlas-structural-explorer]").getByRole("heading", { name: /Initial Access/ })).toBeVisible();
});

test("focused trace matches the record rail and local connections never replace containment", async ({ page }) => {
  test.setTimeout(120_000);
  const monolithic = [];
  page.on("request", (request) => {
    if (/\/(nodes|edges)\.json(?:\.gz)?(?:\?|$)/.test(request.url())) monolithic.push(request.url());
  });

  await gotoApp(page, "/#/record/disa-cci/CCI-000366");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  const recordTrace = await page
    .locator('[data-template="E"] [data-displayed-trace]')
    .getAttribute("data-displayed-trace");
  expect(recordTrace).toBeTruthy();

  await openAtlas(page, "/#/atlas?node=disa-cci%3ACCI-000366");
  const tree = page.locator(".atlas-tree");
  const atlasTrace = await tree.locator("[data-authority-trace]").getAttribute("data-authority-trace");
  expect(atlasTrace).toBe(recordTrace);

  await expect(tree.locator(".react-flow")).toHaveCount(0);
  const pathBefore = await tree.locator("[data-authority-trace]").getAttribute("data-authority-trace");
  await page.getByRole("button", { name: "Show local connections" }).click();
  await expect(tree.locator(".atlas-tree__overlay-highlight")).toHaveCount(24);
  await expect(tree.getByRole("button", { name: /3,467 more .* open Compare/ })).toBeVisible();
  expect(await tree.locator("[data-authority-trace]").getAttribute("data-authority-trace")).toBe(pathBefore);
  await page.getByRole("button", { name: "Show local connections" }).click();
  await expect(tree.locator(".atlas-tree__overlay-highlight")).toHaveCount(0);
  expect(monolithic).toEqual([]);
});

test("mobile Atlas keeps keyboard overview navigation and uses a structural Browse drawer", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const tree = page.getByRole("tree", { name: "Atlas map hierarchy" });
  await expect(tree).toBeVisible();
  await expect(tree.getByRole("treeitem")).toHaveCount(13);
  const compliance = tree.getByRole("treeitem", { name: /Compliance/ });
  await compliance.focus();
  await page.keyboard.press("ArrowDown");
  await expect(compliance).not.toBeFocused();
  await compliance.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);

  await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-IMPLEMENTATION&atlasFramework=disa-stig");
  await waitForAppReady(page);
  await page.getByRole("button", { name: "Browse structure" }).click();
  const browse = page.getByRole("navigation", { name: "Current publication structure" });
  await expect(browse).toBeVisible();
  await browse.getByLabel("Search this publication").fill("Oracle Linux 9");
  await browse.getByRole("button", { name: /BENCHMARK-ORACLE-LINUX-9-STIG/ }).click();
  await expect(page).toHaveURL(/\/#\/atlas\/disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG\?/);
  await expect(page.locator("[data-atlas-structural-explorer]").getByRole("heading", { name: /Oracle Linux 9/ })).toBeVisible();
  const reopen = page.locator(".atlas-tree__mobile-bar").getByRole("button", { name: "Browse structure" });
  await expect(reopen).toBeVisible();
  const target = await reopen.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth)).toBe(0);
});

test("two cold publication loads produce identical structural result order", async ({ browser }) => {
  test.setTimeout(120_000);
  const snapshots = [];
  for (let index = 0; index < 2; index += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-THREAT&atlasFramework=mitre-attack");
    await waitForAppReady(page);
    const explorer = page.locator("[data-atlas-structural-explorer]");
    await expect(explorer).toBeVisible();
    await expect(page.locator(".atlas-tree .react-flow")).toHaveCount(0);
    snapshots.push(await explorer.locator(".atlas-publisher-explorer__list > li").allTextContents());
    await context.close();
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
});

test("twenty consecutive Atlas map cold navigations resolve within five seconds", async ({ browser }) => {
  test.setTimeout(150_000);
  for (let index = 0; index < 20; index += 1) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const started = Date.now();
    await gotoApp(page, `/#/atlas?coldRun=${index}`);
    await expect(page.locator('[data-route-content-ready="true"]')).toBeVisible({ timeout: 5_000 });
    expect(Date.now() - started, `cold load ${index + 1}`).toBeLessThanOrEqual(5_000);
    await context.close();
  }
});
