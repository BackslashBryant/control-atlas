import { expect, test } from "@playwright/test";

test("the hand-typed start-here route opens Start here", async ({ page }) => {
  await page.goto("/#/start-here");

  await expect(page.locator("#app")).toHaveAttribute(
    "data-view",
    "start-here",
  );
});
