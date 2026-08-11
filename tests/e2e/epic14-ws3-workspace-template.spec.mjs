import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("WS3 Library uses Template C browse, facets, and fully linked record rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/library");
  await waitForAppReady(page, { allowPartial: true });

  const workspace = page.locator('[data-page-template="workspace"]');
  await expect(workspace).toBeVisible();
  await expect(workspace.getByRole("heading", { name: "Library", level: 1 })).toBeVisible();
  await expect(workspace.locator('[data-browse-state="library"]')).toBeVisible();
  await expect(workspace.getByRole("list", { name: "Search results" })).toHaveCount(0);

  const rail = workspace.getByRole("complementary", { name: "Library filters" });
  await expect(rail).toBeVisible();
  const railStyle = await rail.evaluate((element) => ({
    position: element.ownerDocument.defaultView.getComputedStyle(element).position,
    width: Math.round(element.getBoundingClientRect().width),
  }));
  expect(railStyle).toEqual({ position: "sticky", width: 280 });
  await expect(workspace.getByRole("button", { name: "Filters" })).toBeHidden();
  await expect(workspace.locator(".workspace-area-card .bucket-tag")).toHaveCount(9);

  await page.getByRole("searchbox", { name: "Filter results by ID, title, or topic" }).fill("3.1.1");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator('[data-result-bar-order="count,sort,view,compare"]')).toBeVisible();
  const row = page.locator('[data-result-class="published-record"]').first();
  await expect(row).toBeVisible();
  await expect(row.getByRole("heading", { level: 3 })).toHaveText(/^NIST AC 3\.1\.1$/);
  const recordRows = page.locator('[data-result-class="published-record"]');
  await expect(row.locator(".bucket-tag")).toBeVisible();
  expect(await recordRows.count()).toBeGreaterThan(0);
  await expect(recordRows.locator(".bucket-tag")).toHaveCount(await recordRows.count());
  await expect(row.locator(".workspace-result-row__signals")).toBeVisible();
  await expect(row.getByRole("link")).toHaveCount(1);
  const sizes = await row.evaluate((element) => ({
    row: element.getBoundingClientRect().width,
    link: element.querySelector("a")?.getBoundingClientRect().width || 0,
  }));
  expect(sizes.link).toBeGreaterThan(sizes.row - 8);
  await expect(page.getByRole("button", { name: /Open record/i })).toHaveCount(0);
});

test("WS3 Resources shares Template C with real list, map, and comparison modes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/resources");
  await waitForAppReady(page, { allowPartial: true });

  const workspace = page.locator('[data-page-template="workspace"]');
  await expect(workspace.getByRole("heading", { name: "Resources", level: 1 })).toBeVisible();
  await expect(workspace.locator('[data-browse-state="resources"]')).toBeVisible();
  const rail = workspace.getByRole("complementary", { name: "Resource filters" });
  await expect(rail).toBeVisible();
  await expect(rail.locator('[data-facet-set="collection,type,owner"]')).toBeVisible();
  await expect(workspace.getByRole("button", { name: "Filters" })).toBeHidden();

  await workspace.getByRole("button", { name: /Browse all \d+ resources/ }).click();
  await expect(page.locator('[data-result-bar-order="count,sort,view,compare"]')).toBeVisible();
  const firstRow = page.locator('[data-result-class="resource"]').first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow.locator(".resource-type-icon")).toBeVisible();
  await expect(firstRow.locator(".workspace-kind-tag")).toBeVisible();
  await expect(firstRow.getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Open resource/i })).toHaveCount(0);

  await workspace.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("region", { name: "Map of Resource results" })).toBeVisible();
  await workspace.getByRole("button", { name: "List", exact: true }).click();
  await workspace.getByRole("button", { name: "Compare", exact: true }).click();
  const selectors = page.getByRole("checkbox", { name: /^Select .* for comparison$/ });
  await selectors.nth(0).check();
  await selectors.nth(1).check();
  await expect(page.getByRole("heading", { name: "Selected resources", level: 2 })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});

test("WS3 facets move to a modal sheet below the desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  for (const route of ["/#/library", "/#/resources"]) {
    await gotoApp(page, route);
    await waitForAppReady(page, { allowPartial: true });
    await expect(page.locator(".workspace-facet-rail")).toBeHidden();
    await page.getByRole("button", { name: "Filters" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close filters" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});

test("WS3 compact Library rows preserve a readable vertical information hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/#/library?q=AC-2");
  await waitForAppReady(page, { allowPartial: true });
  const row = page.locator(".workspace-result-row__link").first();
  await expect(row).toBeVisible();
  await expect(row.locator(".workspace-result-row__signals")).toBeVisible();
  const layout = await row.evaluate((element) => {
    const selectors = [
      ".workspace-result-row__meta",
      "h3",
      ".workspace-result-row__snippet",
      ".workspace-result-row__signals",
    ];
    const boxes = selectors.map((selector) => element.querySelector(selector)?.getBoundingClientRect());
    return {
      direction: element.ownerDocument.defaultView.getComputedStyle(element).flexDirection,
      overlaps: boxes.slice(1).some((box, index) => Boolean(
        box && boxes[index] && box.top < boxes[index].bottom - 1,
      )),
    };
  });
  expect(layout.direction).toBe("column");
  expect(layout.overlaps).toBe(false);
});
