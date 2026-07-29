import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("a cold deep link resolves from one complete search artifact", async ({
  page,
}) => {
  let searchArtifactRequests = 0;
  let retiredShardRequests = 0;
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("library-search.json")) {
      searchArtifactRequests += 1;
    }
    if (url.includes("/library-search/")) {
      retiredShardRequests += 1;
    }
  });

  await gotoApp(page, "/#/record/cmmc-2/LEVEL-2");
  await waitForAppReady(page);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /LEVEL-2|Level 2/i,
  );
  expect(searchArtifactRequests).toBe(1);
  expect(retiredShardRequests).toBe(0);
});

test("a failed complete search artifact uses the app retry path", async ({
  page,
}) => {
  let shouldFail = true;
  await page.route("**/library-search.json*", async (route) => {
    if (shouldFail) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/#/record/cmmc-2/LEVEL-2");
  await expect(page.getByRole("button", { name: "Retry loading" })).toBeVisible({
    timeout: 15000,
  });

  shouldFail = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /LEVEL-2|Level 2/i,
    { timeout: 15000 },
  );
});

test("shared search URLs keep position; submitted searches move focus to results", async ({
  page,
}) => {
  await page.goto("/#/search?q=AC-2");
  await expect(page.locator("#library-results")).toBeVisible({
    timeout: 15000,
  });
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(10);
  await expect(page.locator("#library-results")).not.toBeFocused();

  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("#library-results")).toBeFocused();
});
