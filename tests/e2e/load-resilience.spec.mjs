import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("load resilience shows library skeleton and allows offline navigation", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.route("**/library-search-manifest.json**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await route.continue();
  });

  await page.goto("/?view=explore");
  await expect(page.locator(".skeleton-card").first()).toBeVisible();
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await primaryNav
    .getByRole("button", { name: "Learn", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn|view=playbooks/);
  await expect(
    page.getByRole("heading", { name: "Guides for common compliance jobs" }),
  ).toBeVisible();
});

test("load resilience surfaces retry after timeout", async ({ page }) => {
  await page.route("**/data/generated/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    await route.continue();
  });

  await page.goto("/?view=explore");
  await expect(page.getByRole("button", { name: "Retry loading" })).toBeVisible(
    {
      timeout: 15000,
    },
  );
  await expect(page.getByText("Record data unavailable")).toBeVisible();
});

test("staged library search enables results before detail pages", async ({
  page,
}) => {
  let graphRequests = 0;
  await page.route("**/data/generated/**", async (route) => {
    const url = route.request().url();
    if (url.includes("nodes.json") || url.includes("edges.json")) {
      graphRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    await route.continue();
  });

  await page.goto("/?view=explore&q=AC-2");
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
  expect(graphRequests).toBe(0);
  const openDetail = page
    .locator("#library-results .result-card .card-title-action")
    .first();
  await expect(openDetail).toBeEnabled();
  await openDetail.click();
  await expect(page).toHaveURL(/library-detail|record\//);
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect.poll(() => graphRequests, { timeout: 15000 }).toBeGreaterThan(0);
});

test("heavy routes explain what they are loading", async ({ page }) => {
  await page.route("**/data/generated/**", async (route) => {
    const url = route.request().url();
    if (url.includes("nodes.json") || url.includes("edges.json")) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    await route.continue();
  });

  await page.goto("/#/templates");
  // DataPendingNotice's title renders through Panel as a bold <b>, not a
  // heading element (src/ui/components/lsm/Panel.tsx:20) — pre-existing,
  // unrelated to this route.
  await expect(
    page.getByText("Loading document tasks", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(
      "We are preparing starter documents and the official sources that support them.",
    ),
  ).toBeVisible();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "What are you working on?" }),
  ).toBeVisible();
});
