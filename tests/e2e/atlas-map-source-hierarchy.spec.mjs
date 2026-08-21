import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1440, height: 1000 },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

async function expectNoHorizontalOverflow(page) {
  const width = await page.evaluate(() => ({
    client: globalThis.document.documentElement.clientWidth,
    scroll: globalThis.document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
}

/** Every node of the decomposition map is a labelled button, at every width. */
async function clickAtlasLandmark(page, name) {
  const node = page
    .getByTestId("atlas-map")
    .locator(".atlas-decomp__column")
    .getByRole("button", { name })
    .first();
  await expect(node).toBeVisible();
  await node.click();
}

for (const viewport of VIEWPORTS) {
  test(`NIST reaches a focused control with choices separate from structure at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#/atlas");
    await waitForAppReady(page);
    await dismissOnboarding(page);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "root");

    await clickAtlasLandmark(page, /Compliance/);
    await expect(page).toHaveURL(/atlasLimb=atlas(?::|%3A)LIMB-COMPLIANCE/);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "area");
    await clickAtlasLandmark(page, /SP\s+800-53 Rev\. 5 Catalog/);
    await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
    await expect(page).not.toHaveURL(/atlasBaseline=/);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "publication");

    await expectNoHorizontalOverflow(page);
    // Wait for the drilled level to finish rendering before typing. The search
    // box is a controlled input, so a keystroke delivered inside the route
    // transition's commit window is overwritten by the in-flight render. A
    // person cannot reach the field that fast; an automated fill can.
    await expect(
      page.locator('.atlas-decomp__column[data-column="detail"] .atlas-decomp__node').first(),
    ).toBeVisible();
    const jumpToRecord = page.getByRole("searchbox", { name: "Jump to a record" });
    await jumpToRecord.fill("nist-800-53:AC-1");
    await jumpToRecord.press("Enter");
    await waitForAppReady(page);
    await expect(page).toHaveURL(/\/#\/atlas\/nist-800-53:AC-1\?/);
    await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Focused Atlas record" })).toBeVisible();
    await page.getByRole("button", { name: "Hierarchy" }).click();
    await expect(page.getByRole("heading", { name: "Where this sits" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Where this sits" }).first(),
    ).toContainText("Access Control");
    await expect(
      page.getByRole("navigation", { name: "Where this sits" }).first(),
    ).not.toContainText("Low Impact Baseline");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: `artifacts/w2-navigation/epic1-focused-${viewport.width}.png`,
    });
  });

  test(`RMF reaches a published result in three choices at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#/atlas?sourceView=rmf");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    await expect(
      page.getByText("Which Risk Management Framework step are you working in?"),
    ).toBeVisible();

    await page.locator(".atlas-rmf-step-list button").first().click();
    await expect(page.getByText("Related records", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prepare", exact: true })).toBeVisible();
    await expect(page.locator(".atlas-choice-trail")).toContainText("PREPARE");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: `artifacts/w2-navigation/rmf-${viewport.width}.png`,
    });

    await page.locator(".atlas-path-record").first().click();
    await expect(page).toHaveURL(/\/record\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("Atlas root presents an authority-rooted interactive hierarchy", async ({
  page,
}) => {
  await page.goto("/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByTestId("atlas-map");
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("data-scope-level", "root");
  await expect(
    map.locator('.atlas-decomp__column[data-column="area"]'),
  ).toHaveAttribute("data-row-count", "12");
  // The map is DOM, not a canvas, so every node keeps a readable label.
  await expect(map.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByText("Open any part of the landscape to see what is published inside it, and how much.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Map", exact: true })).toHaveCount(
    0,
  );
});

test("a legacy RMF route recovers into the process branch", async ({ page }) => {
  await page.goto("/#/atlas?sourceView=rmf");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByText("Which Risk Management Framework step are you working in?"),
  ).toBeVisible();
  await expect(page.locator(".atlas-choice-trail")).toContainText(
    "Risk Management Framework",
  );
});
