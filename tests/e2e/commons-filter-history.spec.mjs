import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

test("Commons filters resync after browser Back", async ({ page }) => {
  await page.goto("/#/commons?lane=official");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const official = page.getByRole("button", { name: /Official/ }).first();
  const allLanes = page.getByRole("button", { name: /All Lanes/ }).first();
  await expect(official).toHaveAttribute("aria-pressed", "true");

  await allLanes.click();
  await expect(allLanes).toHaveAttribute("aria-pressed", "true");
  await page.goBack();

  await expect(page).toHaveURL(/lane=official/);
  await expect(official).toHaveAttribute("aria-pressed", "true");
});
