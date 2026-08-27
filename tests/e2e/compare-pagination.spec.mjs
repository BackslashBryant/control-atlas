import { expect, test } from "@playwright/test";

import { dismissOnboarding, gotoApp, waitForAppReady } from "./support.mjs";

const LARGE_COMPARE =
  "/#/compare/relationships?intent=frameworks&source=nist-800-53&target=disa-cci&compareRun=true";

test("large Compare results use restorable 100-row pages while totals and exports remain complete", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, `${LARGE_COMPARE}&page=2`);
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator(".compare-mapping-total")).toHaveText(
    "5,344 published mappings across 1,164 source records",
  );
  const tableRows = page.locator(".compare-results-table tbody tr");
  await expect(tableRows).toHaveCount(100);
  const pagination = page.getByRole("navigation", { name: "Mapping result pages" });
  await expect(pagination).toContainText("Showing source records 101–200 of 1,164");
  await expect(pagination).toContainText("Page 2 of 12");
  await expect(pagination).toContainText(
    "Counts and exports cover all 5,344 published mappings matching the current filters and search.",
  );

  const pageTwoFirstId = await tableRows.first().locator("td").first().locator("strong").innerText();
  await pagination.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=3/);
  await expect(tableRows).toHaveCount(100);
  expect(
    await tableRows.first().locator("td").first().locator("strong").innerText(),
  ).not.toBe(pageTwoFirstId);

  await gotoApp(page, `${LARGE_COMPARE}&page=999`);
  await waitForAppReady(page);
  await expect(page.getByRole("alert")).toContainText(
    "That result page is not available. Showing page 12 of 12.",
  );
  await expect(tableRows).toHaveCount(64);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
