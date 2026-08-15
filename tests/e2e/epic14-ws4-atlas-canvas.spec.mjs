import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const POPULATED_AREAS = [
  ["atlas:LIMB-GOVERNANCE", "Governance"],
  ["atlas:LIMB-RISK", "Risk"],
  ["atlas:LIMB-COMPLIANCE", "Compliance"],
  ["atlas:LIMB-ARCHITECTURE", "Architecture"],
  ["atlas:LIMB-IMPLEMENTATION", "Implementation"],
  ["atlas:LIMB-ASSESSMENT", "Assessment"],
  ["atlas:LIMB-THREAT", "Threats & Defense"],
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

async function openAtlas(page, viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

async function clickFlowNode(page, id) {
  const node = page.locator(`.react-flow__node:has([data-atlas-node-id="${id}"])`);
  await expect(node).toBeVisible();
  await node.dispatchEvent("click");
}

test("Template D is graph-first and discloses map details without covering the canvas", async ({ page }) => {
  await openAtlas(page);

  const template = page.locator('[data-page-template="canvas"]');
  const workbench = template.locator(".atlas-tree__workbench");
  const leftDock = workbench.locator(".atlas-tree__dock--left");
  const canvas = workbench.locator(".atlas-tree__canvas");
  const detailsToggle = template.locator('button[aria-controls="atlas-map-inspector"]');

  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByText("Start with a topic and work toward the details.", { exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Jump to a record" })).toBeVisible();
  await expect(template.locator(".atlas-tree")).toHaveAttribute("data-layout-status", "ready");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
  await expect(workbench.locator(".atlas-tree__inspector")).toHaveCount(0);
  await expect(template).not.toContainText(/\b(?:trunks?|limbs?|twigs?|acorns?)\b/i);
  await expect(template.locator(".atlas-ancestry > .atlas-choice-trail")).toHaveCount(0);
  await expect(workbench).toBeVisible();
  await expect(canvas.getByRole("application", { name: "Interactive Atlas map hierarchy" })).toBeVisible();

  const geometry = await Promise.all([leftDock, canvas].map((locator) => locator.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, width: box.width };
  })));
  expect(geometry[0].width).toBeCloseTo(280, 0);
  expect(geometry[0].right).toBeLessThanOrEqual(geometry[1].left);
  expect(geometry[1].top).toBeLessThan(900);
  expect(geometry[1].width).toBeGreaterThan(900);

  await detailsToggle.click();
  const inspector = workbench.locator(".atlas-tree__inspector");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "true");
  await expect(inspector.getByText("Atlas overview", { exact: true })).toBeVisible();
  await expect(inspector).toContainText("Browse cybersecurity areas and the publications under them.");
  const openGeometry = await Promise.all([canvas, inspector].map((locator) => locator.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width };
  })));
  expect(openGeometry[1].width).toBeCloseTo(320, 0);
  expect(openGeometry[1].left).toBeGreaterThanOrEqual(openGeometry[0].right);
  await page.keyboard.press("Escape");
  await expect(inspector).toHaveCount(0);
  await expect(detailsToggle).toBeFocused();

  const areaControls = leftDock.locator("[data-area-id]");
  await expect(areaControls).toHaveCount(9);
  await expect(leftDock.locator('[data-area-id][data-empty="true"]')).toHaveCount(2);
  await expect(leftDock.getByRole("button", { name: /Operations/ })).toBeDisabled();
  await expect(leftDock.getByRole("button", { name: /Knowledge/ })).toBeDisabled();
  await expect(leftDock.getByText("No records yet.", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Open this (?:area|publication|branch)/ })).toHaveCount(0);
});

test("every populated area drills directly and the live breadcrumb reverses the path", async ({ page }) => {
  await openAtlas(page);
  const breadcrumb = page.getByRole("navigation", { name: "Atlas breadcrumb" });

  for (const [id, label] of POPULATED_AREAS) {
    await page.locator(`.atlas-tree__areas [data-area-id="${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`atlasLimb=${id}`));
    await expect(breadcrumb.getByText(label, { exact: true })).toHaveAttribute("aria-current", "page");
  }

  await breadcrumb.getByRole("button", { name: "Atlas", exact: true }).click();
  await expect(page).toHaveURL(/#\/atlas$/);
  await expect(breadcrumb.getByText("Atlas", { exact: true })).toHaveAttribute("aria-current", "page");

  await clickFlowNode(page, "atlas:LIMB-OPERATIONS");
  await expect(page).toHaveURL(/#\/atlas$/);
  const inspector = page.locator(".atlas-tree__inspector");
  await expect(inspector).toContainText("Operations");
  await expect(inspector).toContainText("No records yet.");
  await expect(page.getByRole("button", { name: "Hide map details" })).toHaveAttribute("aria-expanded", "true");
});

for (const width of [1024, 1199, 1200, 1440]) {
  test(`graph-first Atlas uses the available workspace at ${width}px`, async ({ page }) => {
    await openAtlas(page, { width, height: 900 });
    const workbench = page.locator(".atlas-tree__workbench");
    const canvas = workbench.locator(".atlas-tree__canvas");
    await expect(workbench).toHaveClass(/is-overview/);
    await expect(workbench).not.toHaveClass(/has-open-inspector/);
    await expect(page.locator(".atlas-tree__inspector")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Map details", exact: true })).toBeVisible();
    await expect(canvas.getByRole("application", { name: "Interactive Atlas map hierarchy" })).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(13);

    const occupancy = await page.locator(".react-flow__node").evaluateAll((nodes, canvasSelector) => {
      const canvasElement = globalThis.document.querySelector(canvasSelector);
      if (!canvasElement || !nodes.length) return null;
      const canvasBox = canvasElement.getBoundingClientRect();
      const boxes = nodes.map((node) => node.getBoundingClientRect());
      const left = Math.min(...boxes.map((box) => box.left));
      const right = Math.max(...boxes.map((box) => box.right));
      const top = Math.min(...boxes.map((box) => box.top));
      const bottom = Math.max(...boxes.map((box) => box.bottom));
      return {
        heightRatio: (bottom - top) / canvasBox.height,
        widthRatio: (right - left) / canvasBox.width,
      };
    }, ".atlas-tree__canvas");
    expect(occupancy?.widthRatio, `${width}px graph width occupancy`).toBeGreaterThanOrEqual(.55);
    expect(occupancy?.heightRatio, `${width}px graph height occupancy`).toBeGreaterThanOrEqual(.7);
    expect(
      await page.locator("html").evaluate((element) => element.scrollWidth - element.clientWidth),
      `${width}px Atlas overflow`,
    ).toBeLessThanOrEqual(1);

    if (width < 1200) {
      await expect(workbench.locator(".atlas-tree__dock--left")).toBeHidden();
      await expect(page.getByRole("button", { name: "Browse structure" })).toBeVisible();
    } else {
      await expect(workbench.locator(".atlas-tree__dock--left")).toBeVisible();
    }
  });
}

test("a populated node drills two levels without a second confirmation", async ({ page }) => {
  await openAtlas(page);

  await clickFlowNode(page, "atlas:LIMB-COMPLIANCE");
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-layout-status", "ready");
  await clickFlowNode(page, "nist-800-53:CATALOG");
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  const breadcrumb = page.getByRole("navigation", { name: "Atlas breadcrumb" });
  await expect(breadcrumb).toContainText("Compliance");
  await expect(breadcrumb).toContainText("SP 800-53 Rev. 5 Catalog");
  await breadcrumb.getByRole("button", { name: "Compliance", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  await expect(page).not.toHaveURL(/atlasFramework=/);
});

for (const width of [320, 375, 390, 768, 1023]) {
  test(`compact Atlas keyboard navigation skips non-actionable nodes at ${width}px`, async ({ page }) => {
    await openAtlas(page, { width, height: width < 768 ? 844 : 900 });

    const tree = page.getByRole("tree", { name: "Atlas map hierarchy" });
    await expect(tree).toBeVisible();
    await expect(tree.getByRole("treeitem")).toHaveCount(13);
    await expect(tree.getByRole("treeitem", { name: /Statutes 7 instruments/ })).toBeDisabled();
    await expect(tree.getByRole("treeitem", { name: /Operations/ })).toBeDisabled();

    const enabled = tree.locator('button[role="treeitem"]:not(:disabled)');
    const enabledCount = await enabled.count();
    expect(enabledCount).toBe(8);
    await enabled.first().focus();
    for (let index = 1; index < enabledCount; index += 1) {
      await page.keyboard.press("ArrowDown");
      await expect(enabled.nth(index)).toBeFocused();
    }
    for (let index = enabledCount - 2; index >= 0; index -= 1) {
      await page.keyboard.press("ArrowUp");
      await expect(enabled.nth(index)).toBeFocused();
    }

    const compliance = tree.getByRole("treeitem", { name: /Compliance/ });
    await compliance.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
    await expect(page.locator(".atlas-tree__mobile-bar")).toContainText("Compliance");
    expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth)).toBe(0);
  });
}

test("Atlas navigation remains coherent across the 1199 and 1200 pixel breakpoint", async ({ page }) => {
  await openAtlas(page, { width: 1199, height: 900 });
  const workbench = page.locator(".atlas-tree__workbench");
  const browse = page.getByRole("button", { name: "Browse structure" });
  await expect(workbench.locator(".atlas-tree__dock--left")).toBeHidden();
  await expect(browse).toBeVisible();

  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(workbench.locator(".atlas-tree__dock--left")).toBeVisible();
  await expect(browse).toBeHidden();

  await page.setViewportSize({ width: 1199, height: 900 });
  await expect(workbench.locator(".atlas-tree__dock--left")).toBeHidden();
  await expect(browse).toBeVisible();
  await browse.click();
  await expect(workbench.locator(".atlas-tree__dock--left")).toBeVisible();
});

for (const width of [768, 1023]) {
  test(`compact browse selection returns focus to updated Atlas content at ${width}px`, async ({ page }) => {
    await openAtlas(page, { width, height: 900 });
    const browse = page.getByRole("button", { name: "Browse structure" });
    await browse.click();
    const workbench = page.locator(".atlas-tree__workbench");
    const canvas = workbench.locator(".atlas-tree__canvas");
    await expect(workbench.locator(".atlas-tree__dock--left")).toBeVisible();
    await workbench.locator('[data-area-id="atlas:LIMB-COMPLIANCE"]').click();
    await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
    await expect(workbench.locator(".atlas-tree__dock--left")).toBeHidden();
    await expect(canvas).toBeFocused();
    await expect(canvas.getByRole("tree", { name: "Atlas map hierarchy" })).toBeVisible();
  });
}

test("Adaptive Explorer is bounded, responsive, and incrementally rendered at every supported width", async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await gotoApp(page, "/#/atlas?atlasLimb=atlas:LIMB-IMPLEMENTATION&atlasFramework=disa-stig");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const explorer = page.locator("[data-atlas-structural-explorer]");
    await expect(explorer, `${width}px structural explorer`).toBeVisible();
    await expect(page.locator(".atlas-tree__inspector"), `${width}px permanent inspector`).toHaveCount(0);
    await expect(page.locator(".atlas-tree select"), `${width}px giant native select`).toHaveCount(0);
    await expect(page.locator(".atlas-tree .react-flow"), `${width}px unbounded graph`).toHaveCount(0);
    expect(await explorer.locator(".atlas-publisher-explorer__list > li").count(), `${width}px initial DOM`).toBeLessThanOrEqual(40);
    expect(
      await page.locator("html").evaluate((element) => element.scrollWidth - element.clientWidth),
      `${width}px overflow`,
    ).toBeLessThanOrEqual(1);

    const explorerBox = await explorer.boundingBox();
    expect(explorerBox?.y, `${width}px useful content position`).toBeLessThan(600);
    expect(explorerBox?.width, `${width}px useful content width`).toBeGreaterThan(Math.min(280, width * 0.7));

    const browse = page.getByRole("button", { name: "Browse structure" });
    if (width < 1200) {
      await expect(browse).toBeVisible();
      await browse.click();
      await expect(page.getByRole("navigation", { name: "Current publication structure" })).toBeVisible();
      const closeBrowse = page.getByRole("button", { name: "Close browse" });
      await expect(closeBrowse).toBeVisible();
      if (width < 768) {
        const closeBox = await closeBrowse.boundingBox();
        const parentBox = await page.locator(".atlas-tree__local-parent").boundingBox();
        expect(parentBox?.y, `${width}px parent control below close button`).toBeGreaterThanOrEqual(closeBox?.y + closeBox?.height);
      }
      await closeBrowse.click();
    } else {
      await expect(page.getByRole("navigation", { name: "Current publication structure" })).toBeVisible();
    }
  }
});

test("Atlas hierarchy and local record controls keep generated IDs out of primary and accessible copy", async ({ page }) => {
  test.setTimeout(120_000);
  const stableId = "MAPPING-CONTRIBUTOR-APPGATE-835EC7F121";
  const route = `/#/atlas?node=${encodeURIComponent(`nist-zt:${stableId}`)}&relationshipView=path`;

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoApp(page, route);
    await waitForAppReady(page);
    await dismissOnboarding(page);

    await expect(page.getByRole("region", { name: "Page context" })).toContainText("Appgate");
    await expect(page.getByRole("region", { name: "Appgate" })).toBeVisible();
    const hierarchy = page.locator("#atlas-hierarchy-panel");
    await expect(hierarchy.getByRole("heading", { name: "Decomposes into", level: 3 })).toBeVisible();
    const child = hierarchy.getByRole("link", {
      name: /Open Appgate.*Product component, NIST Zero Trust/,
    }).first();
    await expect(child).toBeVisible();
    await expect(child).toContainText("Appgate");
    await expect(hierarchy).not.toContainText(/PRODUCT-COMPONENT-.*-[0-9A-F]{10}/);
    await expect(page.locator("main")).not.toContainText(stableId);
    expect(
      await page.locator("html").evaluate((element) => element.scrollWidth - element.clientWidth),
      `${width}px generated Atlas overflow`,
    ).toBeLessThanOrEqual(1);
  }
});
