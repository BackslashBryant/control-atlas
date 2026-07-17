import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

const FOCUSED_ATLAS = "/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

async function assertNoPageOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("release evidence: focused Atlas stays bounded on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(FOCUSED_ATLAS);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.locator(".atlas-bounded-map");
  const inspector = page.getByRole("complementary", { name: "Selected record" });
  await expect(map).toBeVisible();
  await expect(inspector).toBeVisible();
  await assertNoPageOverflow(page);

  const mapBox = await map.boundingBox();
  const inspectorBox = await inspector.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();
  expect(mapBox.x + mapBox.width).toBeLessThanOrEqual(inspectorBox.x - 8);
  await page.screenshot({
    fullPage: true,
    path: "artifacts/release-readiness/atlas-desktop-map.png",
  });
});

test("release evidence: focused Atlas stacks safely on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(FOCUSED_ATLAS);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.locator(".atlas-bounded-map");
  const inspector = page.getByRole("complementary", { name: "Selected record" });
  await expect(map).toBeVisible();
  await expect(inspector).toBeVisible();
  await assertNoPageOverflow(page);

  const mapBox = await map.boundingBox();
  const inspectorBox = await inspector.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();
  expect(inspectorBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height - 1);

  await page.screenshot({
    fullPage: true,
    path: "artifacts/release-readiness/atlas-mobile-map.png",
  });
});
