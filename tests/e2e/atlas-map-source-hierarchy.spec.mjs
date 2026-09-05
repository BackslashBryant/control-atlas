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

/**
 * The landing is the board of groups, and every group names its members at
 * rest as labelled buttons carrying the framework's spoken name. The board is
 * one column on a phone and three on a desktop, so one selector reaches a
 * framework at every width without opening anything first.
 */
async function enterFrameworkFromLandscape(page, name) {
  const node = page
    .getByTestId("atlas-family-board")
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
    // Nothing is scoped yet, so the landing is the board of groups rather than
    // the columns: the question at this point is which framework, not where
    // inside one.
    await expect(page.getByTestId("atlas-family-board")).toBeVisible();
    await expect(page.getByTestId("atlas-map")).toHaveCount(0);

    // Entering a framework carries its publisher with it, so the columns open
    // already placed in the publisher hierarchy rather than orphaned.
    await enterFrameworkFromLandscape(page, /^800-53$/);
    await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
    await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
    await expect(page).not.toHaveURL(/atlasBaseline=/);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "publication");

    // The publisher level stays reachable from inside a framework: stepping up
    // to NIST lists everything NIST publishes.
    await clickAtlasLandmark(page, /^NIST/);
    await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "ecosystem");
    await clickAtlasLandmark(page, /SP\s+800-53 Rev\. 5 Catalog/);
    await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
    await expect(page.getByTestId("atlas-map")).toHaveAttribute("data-scope-level", "publication");

    await expectNoHorizontalOverflow(page);
    // Wait for both the drilled level and the shared navigation lock to settle
    // before using the global jump field.
    await expect(
      page.locator('.atlas-decomp__column[data-column="detail"] .atlas-decomp__node').first(),
    ).toBeVisible();
    await expect(page.locator("main#workspace")).not.toHaveAttribute("inert", "");
    const jumpToRecord = page.getByRole("searchbox", { name: "Jump to a record" });
    await expect(jumpToRecord).toBeEnabled();
    await jumpToRecord.pressSequentially("nist-800-53:AC-1");
    await expect(jumpToRecord).toHaveValue("nist-800-53:AC-1");
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

test("Atlas root presents a source-ecosystem interactive hierarchy", async ({
  page,
}) => {
  await page.goto("/#/atlas?atlasLanding=publishers");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const board = page.getByTestId("atlas-family-board");
  await expect(board).toBeVisible();
  // Eight publishers, plus the three authority landmarks and the one
  // publication issued outside the federal ecosystems, named in strips.
  await expect(board.locator(".atlas-family-board__card")).toHaveCount(8);
  await expect(board.locator(".atlas-family-board__strip li")).toHaveCount(4);
  // The board is DOM, not a canvas, so every landmark keeps a readable label.
  await expect(board.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByText("Grouped by what each document is, who issues it, or what you're trying to get done.", { exact: true }),
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
