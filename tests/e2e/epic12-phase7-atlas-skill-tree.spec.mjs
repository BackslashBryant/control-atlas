import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const BENCHMARK_ID = "disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG";

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

async function drillSelectedNode(page, id, actionName) {
  await selectTreeNode(page, id);
  await page.getByRole("button", { name: actionName, exact: true }).click();
}

test("Atlas map branches down, gates technology, restores the URL, and honors history", async ({ page }) => {
  test.setTimeout(120_000);
  await openAtlas(page);

  const tree = page.locator(".atlas-tree");
  await expect(tree).toHaveAttribute("data-tree-node-count", "13");
  await expect(tree.locator("[data-orientation-explanation]")).toHaveCount(1);
  await expect(tree.locator('[data-atlas-node-id="atlas:TRUNK"]')).toBeVisible();
  await expect(tree.locator('[data-atlas-node-id^="authority-aggregate:"]')).toHaveCount(3);
  await expect(tree.locator('[data-atlas-node-id^="atlas:LIMB-"]')).toHaveCount(9);
  const stage = tree.locator(".atlas-tree__stage");
  await expect(stage).toHaveAttribute("data-semantic-level", "orientation");
  await page.waitForTimeout(550);
  for (let step = 0; step < 4; step += 1) await page.getByTitle("Zoom in").click();
  await expect(stage).toHaveAttribute("data-semantic-level", "justification");

  await selectTreeNode(page, "atlas:LIMB-IMPLEMENTATION");
  await expect(page).not.toHaveURL(/atlasLimb=/);
  await expect(page.getByRole("heading", { name: "Implementation", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open this area", exact: true }).click();
  await expect(stage).toHaveAttribute("data-semantic-level", "justification");
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-IMPLEMENTATION/);
  await drillSelectedNode(page, "disa-stig:CATALOG", "Open this publication");
  await expect(page).toHaveURL(/atlasFramework=disa-stig/);
  await expect(page.getByRole("heading", { name: "Choose a technology" })).toBeVisible();
  const picker = page.getByLabel(/Technology benchmark, 353 available/);
  await expect(picker.locator("option")).toHaveCount(354);
  await page.getByLabel("Search technologies").fill("Oracle Linux 9");
  await expect(picker.locator("option")).toHaveCount(2);
  await picker.selectOption(BENCHMARK_ID);
  await expect(page).toHaveURL(/atlasBenchmark=disa-stig%3ABENCHMARK-ORACLE-LINUX-9-STIG/);
  await expect(tree).toHaveAttribute("data-tree-node-count", "16");
  await expect(tree.locator('[data-atlas-node-id^="aggregate:disa-stig:BENCHMARK-ORACLE-LINUX-9-STIG"]')).toHaveCount(12);

  await page.reload();
  await waitForAppReady(page);
  await expect(page.getByLabel(/Technology benchmark, 353 available/)).toHaveValue(BENCHMARK_ID);
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-tree-node-count", "16");

  await page.goBack();
  await expect(page).not.toHaveURL(/atlasBenchmark=/);
  await expect(page.getByRole("heading", { name: "Choose a technology" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/atlasBenchmark=/);
  await expect(page.getByLabel(/Technology benchmark, 353 available/)).toHaveValue(BENCHMARK_ID);

  await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-THREAT&atlasFramework=mitre-attack");
  await waitForAppReady(page);
  await drillSelectedNode(page, "mitre-attack:TACTIC-TA0001", "Open this branch");
  await expect(page).toHaveURL(/atlasFamily=mitre-attack%3ATACTIC-TA0001/);
  await page.reload();
  await waitForAppReady(page);
  await expect(page.locator('[data-atlas-node-id="mitre-attack:TACTIC-TA0001"]')).toBeVisible();
});

test("focused trace matches the record rail and overlay preserves tree identity without full graph requests", async ({ page }) => {
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

  const nodeIdsBefore = await tree.locator(".react-flow__node").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-id")));
  const edgeIdsBefore = await tree.locator(".react-flow__edge").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-id")));
  await page.getByRole("button", { name: "Show mapping overlay" }).click();
  await expect(tree.locator(".atlas-tree__overlay-highlight")).toHaveCount(24);
  await expect(tree.getByRole("button", { name: /3,467 more .* open Compare/ })).toBeVisible();
  expect(await tree.locator(".react-flow__node").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-id")))).toEqual(nodeIdsBefore);
  expect(await tree.locator(".react-flow__edge").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-id")))).toEqual(edgeIdsBefore);
  await page.getByRole("button", { name: "Hide mapping overlay" }).click();
  await expect.poll(
    () => tree.locator(".react-flow__node").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-id"))),
  ).toEqual(nodeIdsBefore);
  await expect.poll(
    () => tree.locator(".react-flow__edge").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-id"))),
  ).toEqual(edgeIdsBefore);
  expect(monolithic).toEqual([]);
});

test("compact Atlas map keeps equivalent hierarchy, keyboard movement, and technology selection", async ({ page }) => {
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
  await expect(page).not.toHaveURL(/atlasLimb=/);
  await expect(page.getByRole("heading", { name: "Compliance", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open this area", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-COMPLIANCE/);
  await expect(page.getByRole("button", { name: "Trace back to authority" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "Trace back to authority" })).toBeVisible();

  await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-IMPLEMENTATION&atlasFramework=disa-stig");
  await waitForAppReady(page);
  const picker = page.getByLabel(/Technology benchmark, 353 available/);
  await picker.selectOption(BENCHMARK_ID);
  await expect(page).toHaveURL(/atlasBenchmark=/);
  await expect(page.getByRole("tree", { name: "Atlas map hierarchy" })).toContainText("Oracle Linux 9");
  const target = await page.getByRole("treeitem").first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth)).toBe(0);
});

test("two cold loads produce byte-identical rendered coordinates", async ({ browser }) => {
  test.setTimeout(120_000);
  const snapshots = [];
  for (let index = 0; index < 2; index += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await gotoApp(page, "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-THREAT&atlasFramework=mitre-attack");
    await waitForAppReady(page);
    await expect(page.locator(".atlas-tree .react-flow__node").first()).toBeVisible();
    snapshots.push(await page.locator(".atlas-tree .react-flow__node").evaluateAll((nodes) => JSON.stringify(nodes.map((node) => ({
      id: node.getAttribute("data-id"),
      transform: node.style.transform,
      width: node.style.width,
      height: node.style.height,
    })).sort((left, right) => left.id.localeCompare(right.id)))));
    await context.close();
  }
  expect(snapshots[1]).toBe(snapshots[0]);
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
