import { expect, test } from "@playwright/test";

import {
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test("Resources filters resync after browser Back", async ({ page }) => {
  const owner = "National Institute of Standards and Technology";
  await gotoApp(page, `/#/resources?owner=${encodeURIComponent(owner)}`);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const ownerFilter = page.getByRole("combobox", { name: "Owner" });
  await expect(ownerFilter).toHaveValue(owner);
  await ownerFilter.fill("");
  await ownerFilter.press("Tab");
  await expect(page).not.toHaveURL(/owner=/);
  await page.goBack();

  await expect(page).toHaveURL(/owner=National(?:%20|\+)Institute/);
  await expect(ownerFilter).toHaveValue(owner);
});
