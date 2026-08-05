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
  // 2026-08-03: utility navigation grew to 5 items — see the compactNavigation
  // breakpoint comment in styles/orbital.css. The bare Playwright default
  // (1280x720) now renders the (correctly) collapsed mobile-sheet header
  // instead of the primary nav this test exercises directly.
  await page.setViewportSize({ width: 1600, height: 900 });
  await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(1600);
  await page.route("**/library-search.json**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await route.continue();
  });

  await gotoApp(page, "/#/search");
  await expect(page.locator("#root")).toHaveAttribute("data-react-active", "true", { timeout: 15000 });
  await expect(page.locator(".skeleton-card").first()).toBeVisible();
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await primaryNav
    .getByRole("button", { name: "Guides", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn/);
  await expect(
    page.getByRole("heading", { name: "Practitioner guides", exact: true }),
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
    page.getByRole("heading", { name: "Library", exact: true }),
  ).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.locator("#library-results .search-result-row").first(),
  ).toBeVisible({
    timeout: 15000,
  });
  expect(detailRequests).toBe(0);
  const openDetail = page
    .locator("#library-results .search-result-primary")
    .first();
  await expect(openDetail).toBeEnabled();
  await openDetail.click();
  await expect(page).toHaveURL(/library-detail|record\//);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect.poll(() => detailRequests, { timeout: 15000 }).toBeGreaterThan(0);
});

test("heavy routes identify the destination while scoped data loads", async ({ page }) => {
  await page.route("**/data/**", async (route) => {
    const url = route.request().url();
    if (url.includes("compliance-workflows.json")) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    await route.continue();
  });

  await gotoApp(page, "/#/build/tasks");
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(
      "Choose a task or starter document, then keep its public references attached.",
      { exact: false },
    ),
  ).toBeVisible();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
});
