import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("load resilience shows Search skeleton and allows offline navigation", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.route("**/library-search.json**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await route.continue();
  });

  await gotoApp(page, "/#/search");
  await expect(page.locator(".skeleton-card").first()).toBeVisible();
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await primaryNav
    .getByRole("button", { name: "Learn", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn/);
  await expect(
    page.getByRole("heading", { name: "Learn" }),
  ).toBeVisible();
});

test("load resilience surfaces retry after timeout", async ({ page }) => {
  await page.route("**/data/generated/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    await route.continue();
  });

  await gotoApp(page, "/#/search");
  await expect(page.getByRole("button", { name: "Retry loading" })).toBeVisible(
    {
      timeout: 15000,
    },
  );
  await expect(page.getByText("Record data unavailable")).toBeVisible();
});

test("Explore graph failure replaces loading with a retry path", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.route("**/data/generated/{nodes,edges}.json*", async (route) => {
    await route.fulfill({ status: 503, body: "graph unavailable" });
  });

  await gotoApp(page, "/#/explore?atlasAxis=framework");
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Record data unavailable")).toBeVisible();
});

test("staged library search enables results before detail pages", async ({
  page,
}) => {
  let detailRequests = 0;
  await page.route("**/data/generated/**", async (route) => {
    const url = route.request().url();
    if (url.includes("atlas-neighborhood/")) {
      detailRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    await route.continue();
  });

  await gotoApp(page, "/#/search?q=AC-2");
  await expect(
    page.getByRole("heading", { name: "Search everything in one place" }),
  ).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.locator("#library-results .result-card").first(),
  ).toBeVisible({
    timeout: 15000,
  });
  expect(detailRequests).toBe(0);
  const openDetail = page
    .locator("#library-results .result-card .card-title-action")
    .first();
  await expect(openDetail).toBeEnabled();
  await openDetail.click();
  await expect(page).toHaveURL(/library-detail|record\//);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect.poll(() => detailRequests, { timeout: 15000 }).toBeGreaterThan(0);
});

test("heavy routes explain what they are loading", async ({ page }) => {
  await page.route("**/data/**", async (route) => {
    const url = route.request().url();
    if (url.includes("compliance-workflows.json")) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    await route.continue();
  });

  await gotoApp(page, "/#/build/tasks");
  await expect(
    page.getByRole("heading", { name: "Opening workspace", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(
      "Control Atlas is opening this public workspace with publisher and source identity attached.",
      { exact: false },
    ),
  ).toBeVisible();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
});
