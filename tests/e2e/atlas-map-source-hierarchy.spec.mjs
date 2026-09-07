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
 * The landing draws the groups; a framework is one step inside one of them.
 * Every cell is a real button named for what it is and how much it holds, so
 * the same two clicks reach a publication at any width.
 */
async function enterFrameworkFromLandscape(page, group, name) {
  const map = page.getByTestId("atlas-area-map");
  const groupCell = map.getByRole("button", { name: group }).first();
  await expect(groupCell).toBeVisible();
  await groupCell.click();
  const node = map.getByRole("button", { name }).first();
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
    await expect(page.getByTestId("atlas-area-map")).toBeVisible();
    await expect(page.getByTestId("atlas-map")).toHaveCount(0);

    // Two clicks reach a publication: its group, then it. The map stays put
    // and the panel becomes what was opened.
    await enterFrameworkFromLandscape(page, /^Control catalogs/, /^800-53 /);
    await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
    await expect(page).not.toHaveURL(/atlasBaseline=/);
    await expect(
      page.getByTestId("atlas-detail").getByRole("heading", { level: 2 }),
    ).toContainText("800-53");

    // The group stays one step back, never a return to the top of the route.
    const trail = page.getByRole("navigation", { name: "Map depth" });
    await expect(trail.getByRole("button", { name: /^Control catalogs/ })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    // Wait for the shared navigation lock to settle before using the global
    // jump field.
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

  const board = page.getByTestId("atlas-area-map");
  await expect(board).toBeVisible();
  // Eight publishers, plus the three authority landmarks and the one
  // publication issued outside the federal ecosystems, named in strips.
  await expect(board.locator("button.atlas-area__cell")).toHaveCount(8);
  await expect(page.locator(".atlas-mapcol__aside em")).toHaveCount(4);
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
