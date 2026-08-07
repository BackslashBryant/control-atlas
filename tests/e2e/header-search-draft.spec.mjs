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

test("search overlay starts clean after closing an unfinished search", async ({
  page,
}) => {
  await gotoApp(page, "/?view=explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "Open search" }).click();
  const input = page.getByRole("searchbox", { name: "Search Control Atlas" });
  await input.fill("zzzznotfound");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open search" }).click();
  await expect(input).toHaveValue("");
});

test("labels compact records with available official descriptions accurately", async ({
  page,
}) => {
  await gotoApp(page, "/?view=explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("searchbox", { name: "Search Control Atlas" });
  // DE.AE-02 is a real CSF 2.0 subcategory with an official description.
  // (DE.AE-01 is a CSF 1.1-only identifier correctly excluded from the CSF
  // 2.0 catalog per spec §4, so it no longer resolves to a record.)
  await search.fill("DE.AE-02");

  const result = page
    .locator(".search-overlay-result")
    .filter({ hasText: "DE.AE-02" })
    .first();
  await expect(result).toContainText(
    "Official description available — open this record to read it.",
  );
  await expect(result).not.toContainText(
    "No narrative description was published for this record.",
  );
});
