import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

const FOCUSED_ATLAS = "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

async function assertNoPageOverflow(page) {
  const dimensions = await page.evaluate(() => {
    const clientWidth = globalThis.document.documentElement.clientWidth;
    const offenders = Array.from(globalThis.document.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: `${element.tagName.toLowerCase()}.${Array.from(element.classList).join(".")}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(({ left, right }) => left < -1 || right > clientWidth + 1)
      .slice(0, 12);
    return {
      clientWidth,
      scrollWidth: globalThis.document.documentElement.scrollWidth,
      offenders,
    };
  });
  expect(
    dimensions.scrollWidth,
    `Overflowing elements: ${JSON.stringify(dimensions.offenders)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("release evidence: focused Atlas stays bounded on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(FOCUSED_ATLAS);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("region", { name: "Relationship map" });
  const inspector = page.getByRole("complementary", { name: "Current record overview" });
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

  const map = page.getByRole("region", { name: "Relationship map" });
  const inspector = page.getByRole("complementary", { name: "Current record overview" });
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

test("release evidence: the Path offers every stage as one choice on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=path",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Re-baselined 2026-08-01 for the Cybersecurity trunk spine. A focused
  // record's Path is now its structural position — the chain from the trunk
  // down to this record — plus the lens tabs. The guarantee is unchanged: the
  // Path offers a route to take, it never dumps a grid of records on screen.
  await expect(
    page.getByRole("navigation", { name: "Where this sits" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cybersecurity" })).toBeVisible();
  await expect(page.locator(".atlas-path-record")).toHaveCount(0);
  await assertNoPageOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: "artifacts/release-readiness/atlas-desktop-purpose.png",
  });
});

test("release evidence: Atlas reflows at the 200 percent zoom equivalent", async ({
  page,
}) => {
  // A 1440px desktop viewport at 200% browser zoom exposes 720 CSS pixels.
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto(
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=path",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Re-baselined 2026-08-01: a focused record's Path is the structural chain,
  // not the retired stage board. The guarantee under test is the same one —
  // at the 200% zoom equivalent it reflows to a single column and the page
  // never scrolls sideways.
  await expect(
    page.getByRole("navigation", { name: "Where this sits" }),
  ).toBeVisible();
  await assertNoPageOverflow(page);
});

test("release evidence: Atlas fits a 375 by 667 compact viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(FOCUSED_ATLAS);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("region", { name: "Relationship map" });
  const inspector = page.getByRole("complementary", {
    name: "Current record overview",
  });
  const mapBox = await map.boundingBox();
  const inspectorBox = await inspector.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();
  expect(inspectorBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height - 1);
  await assertNoPageOverflow(page);
});

test("release evidence: reduced motion keeps every Atlas control available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(FOCUSED_ATLAS);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible();
  const duration = await page.getByRole("tab", { name: "Map" }).evaluate(
    (element) => globalThis.getComputedStyle(element).transitionDuration,
  );
  expect(["0s", "0.00001s"]).toContain(duration);
});
