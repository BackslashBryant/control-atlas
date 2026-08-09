import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const QUERY_ROUTE = "/#/library?q=access+control";
const GLOBAL_PLACEHOLDER =
  "Search controls, clauses, STIGs, ATT&CK, guides, tools, or communities…";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Phase 2 search results answer access-control questions before the click", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, QUERY_ROUTE);
  await waitForAppReady(page, { allowPartial: true });

  const rows = page.locator(".search-result-row");
  await expect(rows).toHaveCount(25, { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Show 25 more" })).toBeVisible();

  const rendered = await rows.evaluateAll((elements) =>
    elements.map((element) => ({
      excerpt: element.querySelector(".search-result-row__excerpt")?.textContent?.trim() || "",
      publisher: element.getAttribute("data-publisher") || "",
      subtitle: element.querySelector(".search-result-row__source")?.textContent?.trim() || "",
      title: element.querySelector("h2")?.textContent?.trim() || "",
    })),
  );
  expect(new Set(rendered.map(({ title, subtitle }) => `${title}\n${subtitle}`)).size)
    .toBe(rendered.length);
  for (const result of rendered) {
    expect(result.publisher, JSON.stringify(result)).not.toBe("");
    expect(result.publisher, JSON.stringify(result)).not.toMatch(/unavailable/i);
    expect(result.excerpt, JSON.stringify(result)).not.toBe("");
    expect(result.excerpt, JSON.stringify(result)).not.toMatch(
      /open this record to read it|official description available/i,
    );
  }
  await expect(page.getByText("open this record to read it", { exact: false })).toHaveCount(0);
  expect(await rows.locator("mark").count()).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /open (record|in atlas)/i })).toHaveCount(0);

  const rail = page.locator(".search-filter-rail");
  await expect(rail).toBeVisible();
  const railBox = await rail.boundingBox();
  expect(railBox).not.toBeNull();
  expect(railBox.y).toBeGreaterThanOrEqual(0);
  expect(railBox.y).toBeLessThan(900);
  await expect(rail.getByText("Publisher", { exact: true })).toBeVisible();
  await expect(rail.getByText("Content kind", { exact: true })).toBeVisible();
  await expect(rail.getByText("Publication", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Show 25 more" }).click();
  await expect(rows).toHaveCount(50);
});

test("Phase 2 search connection totals agree with the first ten record pages", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, QUERY_ROUTE);
  await waitForAppReady(page, { allowPartial: true });

  const recordRows = page.locator('.search-result-row[data-result-class="published-record"]');
  await expect(recordRows).toHaveCount(25, { timeout: 60_000 });
  const expected = await recordRows.evaluateAll((elements) =>
    elements.slice(0, 10).map((element) => ({
      count: Number(element.getAttribute("data-published-connection-count")),
      id: element.getAttribute("data-record-id") || "",
    })),
  );
  expect(expected).toHaveLength(10);
  expect(expected.every(({ count, id }) => Number.isFinite(count) && id.includes(":"))).toBe(true);

  await waitForAppReady(page);
  for (const result of expected) {
    const separator = result.id.indexOf(":");
    const catalog = result.id.slice(0, separator);
    const item = result.id.slice(separator + 1);
    await page.evaluate(
      ({ nextCatalog, nextItem }) => {
        globalThis.location.hash = `#/record/${encodeURIComponent(nextCatalog)}/${encodeURIComponent(nextItem)}`;
      },
      { nextCatalog: catalog, nextItem: item },
    );
    const count = page.locator(
      '[data-record-section="connections"] [data-published-connection-count]',
    );
    await expect(count).toHaveAttribute(
      "data-published-connection-count",
      String(result.count),
      { timeout: 30_000 },
    );
  }
});

test("Phase 2 overlay keeps symmetric input geometry and preserves both Enter paths", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/about");
  await waitForAppReady(page, { allowPartial: true });

  await page.getByRole("button", { name: "Open search" }).click();
  const dialog = page.getByRole("dialog", { name: "Search Control Atlas" });
  const input = dialog.getByRole("searchbox", { name: "Search Control Atlas" });
  await expect(input).toHaveAttribute("placeholder", GLOBAL_PLACEHOLDER);
  await input.fill("access control");

  const geometry = await dialog.locator(".search-overlay-input").evaluate((wrapper) => {
    const inputElement = wrapper.querySelector("input");
    const wrapperBox = wrapper.getBoundingClientRect();
    const inputBox = inputElement.getBoundingClientRect();
    return {
      background: globalThis.getComputedStyle(wrapper).backgroundColor,
      inputBackground: globalThis.getComputedStyle(inputElement).backgroundColor,
      leftInset: inputBox.left - wrapperBox.left,
      rightInset: wrapperBox.right - inputBox.right,
    };
  });
  expect(Math.abs(geometry.leftInset - geometry.rightInset)).toBeLessThanOrEqual(2);
  expect(geometry.inputBackground).toBe(geometry.background);

  await input.press("Enter");
  await expect(page).toHaveURL(/#\/library\?q=access(?:\+|%20)control/);

  await page.getByRole("button", { name: "Open search" }).click();
  const nextInput = page.getByRole("dialog", { name: "Search Control Atlas" })
    .getByRole("searchbox", { name: "Search Control Atlas" });
  await nextInput.fill("AC-2");
  await expect(page.locator(".search-overlay-result").first()).toBeVisible({ timeout: 60_000 });
  await nextInput.press("ArrowDown");
  await expect(nextInput).toHaveAttribute("aria-activedescendant", /search-suggestion-\d+/);
  await nextInput.press("Enter");
  await expect(page).not.toHaveURL(/#\/library(?:\?|$)/);
  await expect(page).toHaveURL(/#\/(record|guides|sources|library\/resource)/);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
]) {
  test(`Phase 2 keeps every catalog search on one 44px line at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);

    for (const route of [QUERY_ROUTE, "/#/library", "/#/library/publication/nist-800-53"]) {
      await gotoApp(page, route);
      await waitForAppReady(page, { allowPartial: true });
      const searches = page.locator(".catalog-search:visible");
      await expect(searches.first()).toBeVisible({ timeout: 60_000 });
      const measurements = await searches.evaluateAll((elements) =>
        elements.map((element) => {
          const wrapper = element.getBoundingClientRect();
          const icon = element.querySelector("svg").getBoundingClientRect();
          const input = element.querySelector("input").getBoundingClientRect();
          return {
            height: wrapper.height,
            yDifference: Math.abs(icon.y - input.y),
          };
        }),
      );
      expect(measurements.length, `${route} at ${viewport.width}px`).toBeGreaterThan(0);
      for (const measurement of measurements) {
        expect(measurement.height, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(46);
        expect(measurement.yDifference, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(6);
      }
    }
  });
}
