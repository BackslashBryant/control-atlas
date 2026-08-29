import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

/**
 * The Atlas root renders the canonical containment tree as a decomposition map:
 * one labelled column per level, every row a real button with a real name and a
 * real count. These assertions exist because the previous force-directed canvas
 * shipped unlabelled marks whose only affordance was hover — the defect this
 * surface was rebuilt to remove.
 */

const AREAS_WITH_RECORDS = [
  ["atlas:LIMB-COMPLIANCE", "Compliance"],
  ["atlas:LIMB-IMPLEMENTATION", "Implementation"],
  ["atlas:LIMB-ARCHITECTURE", "Architecture"],
  ["atlas:LIMB-ASSESSMENT", "Assessment"],
  ["atlas:LIMB-THREAT", "Threats & Defense"],
];

/** Areas the source data leaves genuinely empty. */
// Neither area is a published catalog, so neither is in the record graph.
// tree-spine.json has always carried a destination for both; the Atlas now
// honours it, so these rows are doors rather than the dead "Not yet modeled"
// rows they used to be.
const OFFSITE_AREAS = [
  { label: "Knowledge", action: "Open the resource directory", href: "#/resources" },
  { label: "Operations", action: "Open the operations tasks", href: "#/build" },
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

function map(page) {
  return page.getByTestId("atlas-map");
}

function column(page, key) {
  return map(page).locator(`.atlas-decomp__column[data-column="${key}"]`);
}

test("Atlas opens as a labelled decomposition map, not an unlabelled canvas", async ({ page }) => {
  await openAtlas(page);

  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByText("THE WHOLE LANDSCAPE", { exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Jump to a record" })).toBeVisible();

  const atlas = map(page);
  await expect(atlas).toHaveAttribute("data-scope-level", "root");
  await expect(atlas).toHaveAttribute("data-level-count", "1");
  // No canvas: the map is DOM, so every node is readable and focusable.
  await expect(atlas.locator("canvas")).toHaveCount(0);

  const areas = column(page, "area");
  await expect(areas).toHaveAttribute("data-row-count", "12");
  // Seven of the twelve rows can be opened: the nine areas less the two that
  // hold nothing, and none of the three authority landmarks, which carry a
  // count but have no destination and so are never rendered as controls.
  await expect(areas.getByRole("button")).toHaveCount(7);
  await expect(areas.locator('.atlas-decomp__node[data-state="static"]')).toHaveCount(3);

  // Every visible row carries a name and a count — nothing is hover-only.
  for (const row of await areas.locator(".atlas-decomp__node").all()) {
    await expect(row.locator(".atlas-decomp__label")).not.toBeEmpty();
    await expect(row.locator(".atlas-decomp__meta")).not.toBeEmpty();
  }
});

test("areas held on another route open it instead of reporting nothing", async ({ page }) => {
  await openAtlas(page);
  const areas = column(page, "area");

  for (const { label, action, href } of OFFSITE_AREAS) {
    const row = areas.locator(".atlas-decomp__node", { hasText: label });
    await expect(row).toHaveAttribute("data-state", "offsite");
    // A real anchor, so the row opens in a new tab or copies like any other
    // destination in the map.
    await expect(row).toHaveAttribute("href", href);
    await expect(row).toContainText(action);
    // The old label was not merely unhelpful, it was false: both areas hold
    // published content, just not in a catalog the record graph indexes.
    await expect(row).not.toContainText("Not yet modeled");
    await expect(row).not.toContainText(/\d[\d,]* records/);
  }

  // The projection counts a container as one of its own records, so an empty
  // area used to advertise "1 records". No row may claim a plural one.
  await expect(map(page)).not.toContainText(/\b1 records\b/);
});

test("the map drills area to publication to section and the breadcrumb reverses it", async ({ page }) => {
  await openAtlas(page);

  await column(page, "area").getByRole("button", { name: /Compliance/ }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  await expect(map(page)).toHaveAttribute("data-scope-level", "area");
  await expect(column(page, "publication")).toBeVisible();

  await column(page, "publication")
    .getByRole("button", { name: /SP 800-53 Rev\. 5 Catalog/ })
    .click();
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(map(page)).toHaveAttribute("data-scope-level", "publication");

  const sections = column(page, "detail");
  await expect(sections).toBeVisible();
  await expect(sections.getByRole("button", { name: /Access Control/ })).toBeVisible();

  const trail = page.getByRole("navigation", { name: "Atlas scope" });
  await expect(trail).toContainText("Compliance");
  await expect(trail).toContainText("SP 800-53 Rev. 5 Catalog");

  await trail.getByRole("button", { name: "Compliance", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  await expect(page).not.toHaveURL(/atlasFramework=/);

  await trail.getByRole("button", { name: "Everything", exact: true }).click();
  await expect(map(page)).toHaveAttribute("data-scope-level", "root");
});

test("every populated area opens directly from the first column", async ({ page }) => {
  await openAtlas(page);

  for (const [id, label] of AREAS_WITH_RECORDS) {
    await gotoApp(page, "/#/atlas");
    await waitForAppReady(page);
    await column(page, "area").getByRole("button", { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(new RegExp(`atlasLimb=${id}`));
    await expect(page.getByRole("navigation", { name: "Atlas scope" })).toContainText(label);
  }
});

test("the opened row stays marked as current in its column", async ({ page }) => {
  await openAtlas(page);
  await column(page, "area").getByRole("button", { name: /Compliance/ }).click();

  const selected = column(page, "area").locator('.atlas-decomp__node[data-state="selected"]');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText("Compliance");
});

test("the layout switch offers both orientations above the stacking width", async ({ page }) => {
  await openAtlas(page);
  const across = page.getByRole("button", { name: "Across" });
  const down = page.getByRole("button", { name: "Down" });

  await expect(across).toHaveAttribute("aria-pressed", "true");
  await down.click();
  await expect(map(page)).toHaveAttribute("data-orientation", "down");
  await expect(down).toHaveAttribute("aria-pressed", "true");
  await across.click();
  await expect(map(page)).toHaveAttribute("data-orientation", "across");
});

for (const width of [320, 375, 390, 768, 1024, 1200, 1440]) {
  test(`Atlas stays readable and free of horizontal overflow at ${width}px`, async ({ page }) => {
    await openAtlas(page, { width, height: width < 768 ? 844 : 900 });

    const areas = column(page, "area");
    await expect(areas).toBeVisible();
    await expect(areas.getByRole("button").first()).toBeVisible();

    const box = await areas.boundingBox();
    expect(box?.width, `${width}px column width`).toBeGreaterThan(Math.min(260, width * 0.6));
    expect(box?.y, `${width}px map position`).toBeLessThan(900);

    expect(
      await page.locator("html").evaluate((element) => element.scrollWidth - element.clientWidth),
      `${width}px Atlas overflow`,
    ).toBeLessThanOrEqual(1);

    // The page scrolls, never a pane inside it.
    expect(
      await map(page).evaluate((element) =>
        [element, ...element.querySelectorAll("*")].filter((node) => {
          const style = globalThis.getComputedStyle(node);
          return (
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            node.scrollHeight > node.clientHeight + 1
          );
        }).length,
      ),
      `${width}px nested vertical scroll region`,
    ).toBe(0);
  });
}

test("Atlas keeps generated identifiers out of visible and accessible copy", async ({ page }) => {
  await openAtlas(page);
  const atlas = map(page);

  await expect(atlas).not.toContainText(/atlas:LIMB-/);
  await expect(atlas).not.toContainText(/:CATALOG\b/);
  await expect(atlas).not.toContainText(/\b(?:trunks?|limbs?|twigs?|acorns?)\b/i);
  await expect(atlas).not.toContainText(/nist-zt|nist-iot-cybersecurity|microsoft-zt-maturity/);
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

    await expect(page.getByRole("region", { name: "Focused Atlas record" })).toBeVisible();
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
