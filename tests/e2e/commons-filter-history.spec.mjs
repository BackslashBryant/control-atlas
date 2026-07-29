import { expect, test } from "@playwright/test";

import {
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test("Resources filters resync after browser Back", async ({ page }) => {
  await gotoApp(page, "/#/resources?lane=official");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: /Filters/ }).click();
  const ownerType = page.getByRole("combobox", { name: "Owner type" });
  await expect(ownerType).toHaveValue("official");
  await ownerType.selectOption("all");
  await expect(page).not.toHaveURL(/lane=official/);
  await page.goBack();

  await expect(page).toHaveURL(/lane=official/);
  await expect(ownerType).toHaveValue("official");
});
