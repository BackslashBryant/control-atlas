import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

const NAV = [
  { label: "Atlas", path: "/atlas", placement: "primary" },
  { label: "Library", path: "/library", placement: "primary" },
  { label: "Compare", path: "/compare", placement: "primary" },
  { label: "Resources", path: "/resources", placement: "primary" },
  { label: "Guides", path: "/guides", placement: "overflow" },
  { label: "Sources", path: "/sources", placement: "primary" },
  { label: "About", path: "/about", placement: "primary" },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("header exposes task destinations directly from 1200px", async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [1200, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoApp(page, "/#/library?q=access+control");
    await waitForAppReady(page, { allowPartial: true });

    const primary = page.locator('header.site-header nav[aria-label="Primary navigation"]');
    await expect(primary.locator("a[href]")).toHaveCount(6);
    await expect(primary.locator("a[href]")).toHaveText(["Atlas", "Library", "Compare", "Resources", "Sources", "About"]);
    await expect(page.locator('header.site-header nav[aria-label="Utility navigation"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Open more pages" }).click();
    await expect(page.getByRole("navigation", { name: "More pages" }).getByRole("link")).toHaveText([
      "Guides",
    ]);
    await page.keyboard.press("Escape");
    const geometry = await page.locator("header.site-header").evaluate((header) => ({
      clientWidth: header.clientWidth,
      fontSizes: [...header.querySelectorAll('nav[aria-label="Primary navigation"] a[href]')].map((link) => globalThis.getComputedStyle(link).fontSize),
      scrollWidth: header.scrollWidth,
    }));
    expect(new Set(geometry.fontSizes).size).toBe(1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/about");
  await waitForAppReady(page, { allowPartial: true });
  await expect(page.locator(".route-transition")).toBeHidden();
  for (const destination of NAV) {
    if (destination.placement === "overflow") {
      await page.getByRole("button", { name: "Open more pages" }).click();
      await page.getByRole("navigation", { name: "More pages" })
        .getByRole("link", { name: destination.label, exact: true })
        .click();
    } else {
      await page.getByRole("navigation", { name: "Primary navigation" })
        .getByRole("link", { name: destination.label, exact: true })
        .click();
    }
    await expect(page).toHaveURL(new RegExp(`#${destination.path}$`));
    if (destination.placement === "overflow") {
      await page.getByRole("button", { name: "Open more pages" }).click();
      await expect(page.getByRole("navigation", { name: "More pages" })
        .getByRole("link", { name: destination.label, exact: true }))
        .toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Escape");
    } else {
      await expect(page.getByRole("navigation", { name: "Primary navigation" })
        .getByRole("link", { name: destination.label, exact: true }))
        .toHaveAttribute("aria-current", "page");
    }
  }
});

test("Phase 3 Library searches published records while Resources stays first-class", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/library?q=NIST");
  await waitForAppReady(page, { allowPartial: true });
  while (await page.getByRole("button", { name: "Show 25 more" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Show 25 more" }).click();
  }
  await expect(page.locator('[data-result-class="published-record"]').first()).toBeVisible();
  await expect(page.locator('[data-result-class="resource"]')).toHaveCount(0);
  await expect(page.locator('[data-result-class="source"]')).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Filter results by ID, title, or topic" })).toHaveValue("NIST");

  await gotoApp(page, "/#/catalog");
  await expect(page).toHaveURL(/#\/library$/);
  await gotoApp(page, "/#/resources");
  await expect(page).toHaveURL(/#\/resources$/);
  await expect(page.locator('[data-browse-state="resources"]')).toBeVisible();
  await gotoApp(page, "/#/resources/official-nist-oscal");
  await expect(page).toHaveURL(/#\/resources\/official-nist-oscal$/);
});

test("Phase 3 filters stay stable, bounded, and free of hierarchy node types", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const renderedSets = [];
  for (const query of ["access control", "Platform One"]) {
    await gotoApp(page, `/#/library?q=${encodeURIComponent(query)}`);
    await waitForAppReady(page, { allowPartial: true });
    const rail = page.locator(".workspace-facet-rail");
    await expect(rail).toBeVisible();
    renderedSets.push(await rail.locator("fieldset legend, .workspace-typeahead > span").allTextContents());
    const datalistSizes = await rail.locator("datalist").evaluateAll((lists) => lists.map((list) => list.querySelectorAll("option").length));
    expect(datalistSizes.every((size) => size >= 2), datalistSizes.join(",")).toBe(true);
    await expect(rail).not.toContainText(/\b(?:Limb|Trunk|Group)\b/);
  }
  expect(renderedSets[1]).toEqual(renderedSets[0]);
  const kindLabels = await page.getByRole("group", { name: "Content kind" }).locator("label > span").allTextContents();
  expect(kindLabels.sort()).toEqual([
    "Baselines & profiles",
    "Process & methods",
    "Requirements",
    "Technical rules",
    "Threats & defenses",
  ]);
});

test("Phase 3 record identity is canonical across Library, Atlas, and direct paths", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const breadcrumb = page.locator("[data-canonical-breadcrumb]");

  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page, { allowPartial: true });
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", /\S/);
  const canonicalBreadcrumb = await breadcrumb.getAttribute("data-canonical-breadcrumb");
  expect(canonicalBreadcrumb).toBeTruthy();

  await gotoApp(page, "/#/library?q=AC-2");
  await waitForAppReady(page, { allowPartial: true });
  await page.locator('[data-record-id="nist-800-53:AC-2"] .workspace-result-row__link').click();
  await waitForAppReady(page, { allowPartial: true });
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", canonicalBreadcrumb);
  await expect(page.locator('header.site-header nav a[aria-current="page"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See connections", exact: true })).toBeVisible();

  await gotoApp(page, "/#/atlas?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page, { allowPartial: true });
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", canonicalBreadcrumb);
  await expect(page.locator('header.site-header nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText("Atlas");

  await gotoApp(page, "/#/record/nist-800-53/AC-2?from=search&returnTo=%2Flibrary");
  await waitForAppReady(page, { allowPartial: true });
  await expect(page).toHaveURL(/#\/record\/nist-800-53\/AC-2$/);
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", canonicalBreadcrumb);
});

test("Phase 3 List and Map preserve Library state and never drop non-empty results", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/library?q=access+control&kind=requirements&sort=identifier");
  await waitForAppReady(page);
  await expect(page.locator(".route-transition")).toBeHidden();
  await expect(page.getByRole("group", { name: "Library view" })).toBeVisible();
  const resultCount = Number((await page.locator(".workspace-result-count").textContent())?.match(/\d+/)?.[0] || 0);
  expect(resultCount).toBeGreaterThan(0);
  const mapButton = page.getByRole("button", { name: "Map", exact: true });
  await page.evaluate(() => globalThis.scrollTo(0, 320));
  const before = await page.evaluate(() => globalThis.scrollY);
  await mapButton.dispatchEvent("click");
  await expect(page).toHaveURL(/#\/library\?q=access%20control&kind=requirements&sort=identifier&view=map|#\/library\?q=access\+control&kind=requirements&sort=identifier&view=map/);
  await expect(page.locator(".library-atlas-map")).toHaveAttribute("data-map-node-count", String(resultCount));
  expect(await page.locator(".library-map-node").count()).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => globalThis.scrollY)).toBeGreaterThanOrEqual(Math.max(0, before - 2));
  await page.getByRole("button", { name: "List", exact: true }).dispatchEvent("click");
  await expect(page).toHaveURL(/#\/library\?q=access%20control&kind=requirements&sort=identifier$|#\/library\?q=access\+control&kind=requirements&sort=identifier$/);
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => globalThis.scrollY)).toBeGreaterThanOrEqual(Math.max(0, before - 2));
  await page.getByRole("button", { name: "Map", exact: true }).dispatchEvent("click");
  await expect(page.locator(".library-atlas-map")).toHaveAttribute("data-map-node-count", String(resultCount));
  await page.getByRole("link", { name: /Open Atlas map overview/ }).click();
  await expect(page).toHaveURL(/#\/atlas$/);
  await waitForAppReady(page);
  await expect(page.locator(".route-transition")).toBeHidden();

  await gotoApp(page, "/#/library?q=zzzzqqqq-no-results");
  await waitForAppReady(page);
  await expect(page.locator(".route-transition")).toBeHidden();
  await expect(page.getByRole("group", { name: "Library view" })).toBeVisible();
});

test("Template B keeps three destination cards and retires the Start card", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });
  const homeTaxonomy = await page.locator(".home-secondary-action strong").allTextContents();
  expect(homeTaxonomy).toEqual(["Browse the Atlas", "Search the Library", "Browse Resources"]);
  await expect(page.locator(".home-work-map span")).toHaveCount(0);
  await expect(page.getByText("Start with your work", { exact: true })).toHaveCount(0);
});

test("DISA STIG publication entry points preserve the benchmark layer above V-IDs", async ({ page }) => {
  await gotoApp(page, "/#/library");
  await waitForAppReady(page, { allowPartial: true });
  await page.getByRole("button", { name: /DISA STIG/ }).click();
  await expect(page).toHaveURL(/#\/library\/publication\/disa-stig$/);
  await expect(page.getByRole("heading", { name: "DISA STIG", level: 1 })).toBeVisible();
  const benchmarks = page.locator('[data-published-tier="benchmark"]');
  const benchmarkCount = await benchmarks.count();
  expect(benchmarkCount).toBeGreaterThan(0);
  await expect(page.getByText(`${benchmarkCount} benchmarks`, { exact: true })).toBeVisible();
  await expect(page.locator(".catalog-record-title")).toHaveCount(0);

  await gotoApp(page, "/#/library/publication/disa-stig?browseAll=true");
  await waitForAppReady(page, { allowPartial: true });
  await expect(benchmarks).toHaveCount(benchmarkCount);
  await expect(page.locator(".catalog-record-title")).toHaveCount(0);

  const benchmark = page.locator('[data-published-tier="benchmark"]', {
    hasText: "VMware vSphere 7.0 vCenter Appliance PostgreSQL",
  });
  await benchmark.click();
  await expect(page).toHaveURL(/family=VMware(?:%20|\+)vSphere(?:%20|\+)7\.0/);
  await expect(page.getByText("Published group", { exact: true })).toBeVisible();
  const rules = page.locator(".catalog-record-title");
  await expect(rules.first()).toBeVisible({ timeout: 60_000 });
  expect(await rules.count()).toBeGreaterThan(0);
  await expect(rules.first()).toContainText(/^V-\d+/);
});

test("Phase 3 record actions and global footer expose the required hierarchy", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => { globalThis.__copiedRecordUrl = value; } },
    });
  });
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page, { allowPartial: true });
  const actions = page.locator(".record-title-actions");
  await expect(actions.getByRole("link", { name: "View official source", exact: true })).toBeVisible();
  await actions.locator("summary", { hasText: "More actions" }).click();
  await expect(actions.getByRole("link", { name: "See connections", exact: true })).toBeVisible();
  await actions.getByRole("button", { name: "Copy link", exact: true }).click();
  const copied = await page.evaluate(() => globalThis.__copiedRecordUrl);
  expect(copied.replace(/^http:/, "https:")).toMatch(/^https:\/\/[^?]+#\/record\/[^?]+$/);

  for (const route of [
    "/#/",
    "/#/start",
    "/#/library",
    "/#/guides",
    "/#/atlas",
    "/#/sources",
    "/#/about",
    "/#/record/nist-800-53/AC-2",
    "/#/compare",
    "/#/build",
    "/#/library/publication/nist-800-53",
    "/#/library/resource/official-nist-oscal",
    "/#/retired?q=800-53",
    "/#/not-found",
  ]) {
    await gotoApp(page, route);
    await waitForAppReady(page, { allowPartial: true });
    const footer = page.locator("footer.site-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Free and open source. Not a government system.");
    await expect(footer).toContainText("Last updated");
    await expect(footer.getByRole("link", { name: "Submit resource" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Report a problem" })).toBeVisible();
  }
});

test("Phase 3 Atlas shows honest integer counts and no obsolete work-surface label", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await expect(page.locator(".atlas-tree")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Connected work surface");
  const areas = page.locator('[data-atlas-node-id^="atlas:LIMB-"]');
  await expect(areas).toHaveCount(9);
  for (const area of await areas.all()) {
    await expect(area).toContainText(/(?:\d[\d,]* records|No records yet\.)/);
  }
  await expect(page.locator(".atlas-tree__totals").getByRole("definition").nth(1)).toHaveText(/\d+/);
});
