import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("search overlay starts clean after closing an unfinished search", async ({
  page,
}) => {
  await page.goto("/?view=explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "Open search" }).click();
  const input = page.getByRole("searchbox", { name: "Search records" });
  await input.fill("zzzznotfound");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open search" }).click();
  await expect(input).toHaveValue("");
});
