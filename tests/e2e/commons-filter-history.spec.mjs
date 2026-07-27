import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

test("Commons filters resync after browser Back", async ({ page }) => {
  await page.goto("/#/commons?lane=official");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Lane tabs reuse the shared underline Tabs idiom
  // (src/ui/components/lsm/Tabs.tsx), which marks the active tab with
  // aria-current="page" rather than aria-pressed.
  const official = page.getByRole("button", { name: /Official/ }).first();
  const allLanes = page.getByRole("button", { name: /All Lanes/ }).first();
  await expect(official).toHaveAttribute("aria-current", "page");

  await allLanes.click();
  await expect(allLanes).toHaveAttribute("aria-current", "page");
  await page.goBack();

  await expect(page).toHaveURL(/lane=official/);
  await expect(official).toHaveAttribute("aria-current", "page");
});
