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

test("Resource detail has one return action and preserves the Resources workspace", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const owner = "Cybersecurity and Infrastructure Security Agency";
  const workspacePath =
    `/#/resources?q=ScubaGear&resourceType=tool` +
    `&collection=cloud-devsecops-software-factories&owner=${encodeURIComponent(owner)}` +
    "&sort=name&showAll=true&viewMode=map";

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await gotoApp(page, workspacePath);
    await waitForAppReady(page);
    await dismissOnboarding(page);

    await page.locator('[data-map-node-id="tool-cisa-scubagear"]').click();
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "CISA ScubaGear", level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/resources\/tool-cisa-scubagear\?.*viewMode=map/);
    await page.reload();
    await waitForAppReady(page);

    const returnLink = page.getByRole("link", { name: "Back to resources", exact: true });
    await expect(returnLink).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Resource detail actions" })
        .getByRole("link", { name: /back/i }),
    ).toHaveCount(0);
    const target = await returnLink.boundingBox();
    expect(target).not.toBeNull();
    if (width <= 390) expect(target.height).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(() =>
        globalThis.document.documentElement.scrollWidth -
        globalThis.document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);

    await returnLink.click();
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Find resources" })).toHaveValue("ScubaGear");
    await expect(page.getByRole("button", { name: "Map" })).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/collection=cloud-devsecops-software-factories/);
    await expect(page).toHaveURL(/resourceType=tool/);
    await expect(page).toHaveURL(/owner=Cybersecurity(?:%20|\+)and(?:%20|\+)Infrastructure/);
    await expect(page.locator('[data-map-node-id="tool-cisa-scubagear"]')).toBeVisible();

    await page.goBack();
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "CISA ScubaGear", level: 1 })).toBeVisible();
    await page.goForward();
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Map" })).toHaveAttribute("aria-pressed", "true");
  }
});
