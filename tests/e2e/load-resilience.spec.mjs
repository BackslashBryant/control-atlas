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
  // Keep the desktop header active so this test can exercise its overflow.
  await page.setViewportSize({ width: 1600, height: 900 });
  await expect.poll(() => page.evaluate(() => globalThis.window.innerWidth)).toBe(1600);
  await page.route("**/library-search.json**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await route.continue();
  });

  await gotoApp(page, "/#/search");
  await expect(page.locator("#root")).toHaveAttribute("data-react-active", "true", { timeout: 15000 });
  await expect(page.locator(".skeleton-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Open more pages" }).click();
  await page.getByRole("navigation", { name: "More pages" })
    .getByRole("link", { name: "Guides", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/guides/);
  await expect(
    page.getByRole("heading", { name: "Guides", exact: true }),
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

test("Atlas data failure replaces loading with a retry path", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.route("**/data/generated/atlas-spine.json*", async (route) => {
    await route.fulfill({ status: 503, body: "atlas unavailable" });
  });

  await gotoApp(page, "/#/atlas");
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Record data unavailable")).toBeVisible();
});

test("Resources dataset failure is isolated from the rest of the product", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route("**/data/commons-resource-dataset.json*", async (route) => {
    await route.fulfill({ status: 503, body: "resources unavailable" });
  });
  await page.route("**/data/generated/commons-search-index.json*", async (route) => {
    await route.fulfill({ status: 503, body: "resource search unavailable" });
  });

  await gotoApp(page, "/#/resources");
  await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "The resource directory did not load." })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Library", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/library/);
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();
});

test("retry clears a rejected artifact and succeeds on a fresh request", async ({ page }) => {
  let failing = true;
  let requests = 0;
  await page.route("**/data/generated/atlas-spine.json*", async (route) => {
    requests += 1;
    if (failing) {
      await route.fulfill({ status: 503, body: "temporary atlas failure" });
      return;
    }
    await route.continue();
  });

  await gotoApp(page, "/#/atlas");
  await expect(page.getByRole("button", { name: "Retry loading" })).toBeVisible({ timeout: 15000 });
  failing = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible({ timeout: 15000 });
  expect(requests).toBeGreaterThanOrEqual(3);
});

test("a lazy route crash preserves navigation and isolates the failed workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route("**/assets/AtlasMapPage-*.js", async (route) => {
    await route.fulfill({ status: 503, body: "route chunk unavailable" });
  });

  await gotoApp(page, "/#/atlas");
  await expect(page.getByText("This workspace stopped unexpectedly.", { exact: false })).toBeVisible({ timeout: 15000 });
  const primaryNav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(primaryNav.getByRole("link", { name: "Resources", exact: true })).toBeVisible();
  await primaryNav.getByRole("link", { name: "Resources", exact: true }).click();
  await expect(page).toHaveURL(/#\/resources/);
  await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible({ timeout: 15000 });
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
    page.locator("#library-results .workspace-result-row").first(),
  ).toBeVisible({
    timeout: 15000,
  });
  expect(detailRequests).toBe(0);
  const openDetail = page
    .locator("#library-results .workspace-result-row__link")
    .first();
  await expect(openDetail).toBeEnabled();
  await openDetail.click();
  await expect(page).toHaveURL(/library-detail|record\//);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect.poll(() => detailRequests, { timeout: 15000 }).toBeGreaterThan(0);
});

test("heavy routes retain destination identity after scoped loading", async ({ page }) => {
  await gotoApp(page, "/#/build/tasks");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(
      "Pick a task to see its public references and starter documents.",
      { exact: false },
    ),
  ).toBeVisible();
});
