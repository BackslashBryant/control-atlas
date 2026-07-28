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

async function openHome(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto("/#/");
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

async function expectNoHorizontalOverflow(page) {
  const width = await page.evaluate(() => ({
    client: globalThis.document.documentElement.clientWidth,
    scroll: globalThis.document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
}

for (const viewport of VIEWPORTS) {
  test(`NIST reaches a focused control with choices separate from structure at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#/explore");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    await page.getByRole("button", { name: /A framework family tree/ }).click();
    await expect(page.getByText("SP 800-53 Rev. 5 Catalog", { exact: true })).toBeVisible();
    await expect(page.locator(".atlas-path-stage-option")).toHaveCount(4);

    await page
      .locator(".atlas-path-stage-option")
      .filter({ hasText: "SP 800-53 Rev. 5 Catalog" })
      .click();
    await expect(
      page.getByText("Which applicability scope do you want to use?"),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/atlasBaseline=/);

    await page
      .locator(".atlas-path-stage-option")
      .filter({ hasText: "LOW impact" })
      .click();
    await expect(
      page.getByText("Which part of this framework do you want to open?"),
    ).toBeVisible();
    await expect(page.locator(".atlas-choice-trail")).toContainText(
      "Low Impact Baseline",
    );

    await page.locator(".atlas-ancestry-family").first().click();
    await expect(page.getByLabel("Filter this family")).toBeVisible();
    await expect(page.locator(".atlas-choice-trail")).toContainText(
      "Access Control",
    );
    await expectNoHorizontalOverflow(page);
    await page.locator(".atlas-path-record").first().click();
    await expect(page).toHaveURL(/node=nist-800-53/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/AC-/);
    await expect(page.getByRole("heading", { name: "Where this sits" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Where this sits" })).not.toContainText(
      "Low Impact Baseline",
    );
    await expect(page.getByRole("navigation", { name: "Your choices" })).toContainText(
      "Low Impact Baseline",
    );
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: `artifacts/w2-navigation/epic1-focused-${viewport.width}.png`,
    });
  });

  test(`RMF reaches a published result in three choices at ${viewport.width}px`, async ({
    page,
  }) => {
    await openHome(page, viewport);

    await page.getByRole("button", { name: /Follow the RMF process/ }).click();
    await expect(
      page.getByText("Which Risk Management Framework step are you working in?"),
    ).toBeVisible();

    await page.locator(".atlas-rmf-step-list button").first().click();
    await expect(page.getByText("Published relationships")).toBeVisible();
    await expect(page.locator(".atlas-choice-trail")).toContainText("PREPARE");
    await expect(page.locator(".badge.tone-applicability")).toBeVisible();
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

test("Atlas root offers three plain entry axes without a canvas", async ({
  page,
}) => {
  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText("What do you want to trace?")).toBeVisible();
  await expect(page.locator(".atlas-ancestry-choice")).toHaveCount(3);
  await expect(page.locator(".react-flow")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Map", exact: true })).toHaveCount(
    0,
  );
});

test("a legacy RMF route recovers into the process branch", async ({ page }) => {
  await page.goto("/#/explore?sourceView=rmf");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByText("Which Risk Management Framework step are you working in?"),
  ).toBeVisible();
  await expect(page.locator(".atlas-choice-trail")).toContainText(
    "Risk Management Framework",
  );
});
