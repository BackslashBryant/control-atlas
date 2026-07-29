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
  const scripts = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/data/generated/")) {
      requested.push(url);
    }
    if (request.resourceType() === "script") scripts.push(url);
  });

  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  expect(graphArtifactUrls(requested)).toEqual([]);
  expect(requested).toEqual([]);
  expect(scripts).toHaveLength(1);

  await page.getByRole("button", { name: /Browse Catalog/ }).click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/catalog/);
  expect(scripts.length).toBeGreaterThan(1);
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
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible();

  expect(graphArtifactUrls(requested)).toEqual([]);
  expect(
    requested.some((url) => url.includes("atlas-neighborhood/32.json")),
  ).toBeTruthy();
});

test("focused Atlas loading state avoids a content-agnostic mobile minimum height", async ({
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
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toBeVisible({
    timeout: 30000,
  });
  const loadedHeight = await page.locator("#app").evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  expect(loadingHeight).toBeLessThanOrEqual(823);
  expect(loadedHeight).toBeGreaterThan(loadingHeight);
});

test("catalog identity renders before its full record payload arrives", async ({
  page,
}) => {
  let releaseRecords = () => {};
  const recordsGate = new Promise((resolve) => {
    releaseRecords = () => resolve();
  });

  await page.route(
    "**/data/generated/catalog-records/nist-800-53.json*",
    async (route) => {
      await recordsGate;
      await route.continue();
    },
  );

  await page.goto("/#/catalog/nist-800-53");
  await expect(
    page.getByRole("heading", { level: 1, name: "SP 800-53 Rev. 5" }),
  ).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Loading this publication's records…")).toBeVisible();

  releaseRecords();
  await expect(page.getByText("Loading this publication's records…")).toBeHidden({
    timeout: 15000,
  });
  await expect(page.getByRole("heading", { level: 2 })).toContainText(
    "SP 800-53 Rev. 5",
  );
});
