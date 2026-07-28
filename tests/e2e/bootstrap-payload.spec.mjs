import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

function graphArtifactUrls(urls) {
  return urls.filter(
    (url) => url.includes("nodes.json") || url.includes("edges.json"),
  );
}

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("home bootstrap avoids graph JSON artifacts", async ({ page }) => {
  const requested = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/data/generated/")) {
      requested.push(url);
    }
  });

  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  expect(graphArtifactUrls(requested)).toEqual([]);
  expect(requested.some((url) => url.includes("library-search"))).toBeTruthy();
});

test("explore bootstrap avoids graph JSON until record open", async ({
  page,
}) => {
  const requested = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/data/generated/")) {
      requested.push(url);
    }
  });

  await page.goto("/?view=explore&q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.locator("#library-results .result-card").first(),
  ).toBeVisible({
    timeout: 15000,
  });

  expect(graphArtifactUrls(requested)).toEqual([]);

  const openDetail = page
    .locator("#library-results .result-card .card-title-action")
    .first();
  await expect(openDetail).toBeEnabled({ timeout: 15000 });
  await openDetail.click();
  await expect(page).toHaveURL(/library-detail|record\//);
  await waitForAppReady(page);
  await expect
    .poll(() => graphArtifactUrls(requested).length, { timeout: 15000 })
    .toBeGreaterThan(0);
});

test("focused Atlas loads one neighborhood without monolithic graph JSON", async ({
  page,
}) => {
  const requested = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/data/generated/")) requested.push(url);
  });

  await page.goto(
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator(".atlas-spatial-map")).toBeVisible();

  expect(graphArtifactUrls(requested)).toEqual([]);
  expect(
    requested.some((url) => url.includes("atlas-neighborhood/32.json")),
  ).toBeTruthy();
  expect(
    requested.some((url) => url.includes("RelationshipGraph-")),
  ).toBeFalsy();
});

test("focused Atlas reserves its mobile workspace while the neighborhood loads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 823 });
  let releaseNeighborhood = () => {};
  const neighborhoodGate = new Promise((resolve) => {
    releaseNeighborhood = () => resolve();
  });

  await page.route("**/data/generated/atlas-neighborhood/32.json*", async (route) => {
    await neighborhoodGate;
    await route.continue();
  });

  await page.goto(
    "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-has-subject", "true");
  await expect(page.locator(".atlas-loading")).toBeVisible();
  const loadingHeight = await page.locator("#app").evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  releaseNeighborhood();
  await expect(page.locator(".atlas-spatial-map")).toBeVisible({
    timeout: 30000,
  });
  const loadedHeight = await page.locator("#app").evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  expect(loadingHeight).toBeGreaterThanOrEqual(loadedHeight - 48);
});
