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

async function clickAtlasLandmark(page, name) {
  await page.evaluate(() => new Promise((resolve) => {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve));
  }));
  const network = page.getByTestId("atlas-network");
  const list = network.locator(".atlas-network-list");
  const node = network.getByRole("button", { name });
  if (!(await node.isVisible())) {
    const summary = list.getByText("Browse landmarks", { exact: true });
    await expect(summary).toBeVisible();
    await summary.click();
  }
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
    await expect(page.getByTestId("atlas-network")).toHaveAttribute("data-projection-level", "landscape");

    await clickAtlasLandmark(page, /Compliance/);
    await expect(page).toHaveURL(/atlasLimb=atlas(?::|%3A)LIMB-COMPLIANCE/);
    await expect(page.getByTestId("atlas-network")).toHaveAttribute("data-projection-level", "area");
    await clickAtlasLandmark(page, /SP\s+800-53 Rev\. 5 Catalog/);
    await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
    await expect(page).not.toHaveURL(/atlasBaseline=/);
    await expect(page.getByTestId("atlas-network")).toHaveAttribute("data-projection-level", "publication");

    await expectNoHorizontalOverflow(page);
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

  const network = page.getByTestId("atlas-network");
  await expect(network).toBeVisible();
  await expect(network).toHaveAttribute("data-projection-level", "landscape");
  await expect(network.getByRole("button", { name: /Area ·/ })).toHaveCount(9);
  await expect(network.locator("canvas").first()).toBeVisible();
  await expect(
    page.getByText("Explore areas, publications, and the published connections between them.", { exact: true }),
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
