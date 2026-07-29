import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const compareRoute =
  "/#/compare?intent=frameworks&workbench=relationships&source=nist-800-53&target=csf-2&mappingSource=nist-olir-csf2-to-sp800-53";

async function expectNoPageOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth - globalThis.document.body.clientWidth,
    document: globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth,
  }));
  expect(overflow, `${label} must not create document-level horizontal overflow`).toEqual({ body: 0, document: 0 });
}

for (const viewport of [
  { label: "375px", width: 375, height: 812 },
  // A 1440px desktop at 200% browser zoom exposes roughly 720 CSS pixels.
  { label: "200% zoom equivalent", width: 720, height: 900 },
]) {
  test(`Compare mapping cards retain all meaning at ${viewport.label}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    attachPageDiagnostics(page);
    await gotoApp(page, compareRoute);
    await waitForAppReady(page);
    await dismissOnboarding(page);
    await page.getByRole("button", { name: "Show mappings" }).click();

    const table = page.getByRole("table", { name: "Relationship mappings" });
    await expect(table).toBeVisible({ timeout: 60000 });
    await expectNoPageOverflow(page, `Compare at ${viewport.label}`);
    await expect(table.locator("tbody tr").first().locator("td")).toHaveCount(5);
    await expect(table.locator("tbody tr").first().locator("td[data-label]")).toHaveCount(5);
    expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBeTruthy();
  });
}

for (const viewport of [
  { label: "375px", width: 375, height: 812, columns: 1 },
  { label: "768px", width: 768, height: 1024, columns: 2 },
]) {
  test(`Resources categories and filters remain discoverable at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    attachPageDiagnostics(page);
    await gotoApp(page, "/#/resources");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const categories = page.locator("[aria-labelledby='resource-categories'] button");
    await expect(categories).toHaveCount(6);
    await expectNoPageOverflow(page, `Resources at ${viewport.label}`);

    const filters = page.getByRole("button", { name: /^Filters/ });
    await expect(filters).toHaveAttribute("aria-expanded", "false");
    await filters.press("Enter");
    await expect(filters).toHaveAttribute("aria-expanded", "true");
    const panel = page.getByRole("region", { name: "Resource filters" });
    await expect(panel).toBeVisible();
    await expect(panel.locator("select").first()).toBeVisible();

    const columns = await panel.evaluate((element) =>
      globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(viewport.columns);

    await page.locator("#commons-lane-filter").selectOption("official");
    await expect(page).toHaveURL(/lane=official/);
    await expect(page.getByRole("status")).toContainText(/Showing \d+ of \d+ resources/);

    const results = await new AxeBuilder({ page })
      .include("#resources-filter-panel")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || "")),
    ).toEqual([]);
  });
}
