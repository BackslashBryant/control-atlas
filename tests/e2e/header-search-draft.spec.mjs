import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("header search clears when leaving Explore after an empty result", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=zzzznotfound");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "No matching records found." }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: "Navigate", exact: true })
    .click();
  await page
    .locator(".nav-more-menu")
    .getByRole("button", { name: "Compare", exact: true })
    .click();
  await expect(page).toHaveURL(/view=matrix|#\/compare/);
  await expect(page.locator("#header-search")).toHaveValue("");
});

test("header search clears when Explore empty state uses Clear search", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=zzzznotfound");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("#header-search")).toHaveValue("");
});
