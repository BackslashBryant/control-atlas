import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

const NAV = [
  { label: "Start here", path: "/start" },
  { label: "Library", path: "/library" },
  { label: "Guides", path: "/guides" },
  { label: "Sources", path: "/sources" },
  { label: "About", path: "/about" },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Phase 3 header has three primary doors, two utilities, and no overflow from 1024px", async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoApp(page, "/#/library?q=access+control");
    await waitForAppReady(page, { allowPartial: true });

    const primary = page.locator('header.site-header nav[aria-label="Primary navigation"]');
    const utility = page.locator('header.site-header nav[aria-label="Utility navigation"]');
    await expect(primary.locator("a[href]")).toHaveCount(3);
    await expect(utility.locator("a[href]")).toHaveCount(2);
    await expect(primary.locator("a[href]")).toHaveText(["Start here", "Library", "Guides"]);
    await expect(utility.locator("a[href]")).toHaveText(["Sources", "About"]);
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
    const navigationName = ["Sources", "About"].includes(destination.label)
      ? "Utility navigation"
      : "Primary navigation";
    await page.locator(`header.site-header nav[aria-label="${navigationName}"]`).getByRole("link", { name: destination.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${destination.path}$`));
    await expect(page.locator("#workspace h1")).toHaveText(destination.label);
    await expect(page.locator(`header.site-header nav[aria-label="${navigationName}"]`).getByRole("link", { name: destination.label, exact: true })).toHaveAttribute("aria-current", "page");
  }
});

test("Phase 3 Library uses one field for records, resources, and sources", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/library?q=NIST");
  await waitForAppReady(page, { allowPartial: true });
  while (await page.getByRole("button", { name: "Show 25 more" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Show 25 more" }).click();
  }
  await expect(page.locator('[data-result-class="published-record"]').first()).toBeVisible();
  await expect(page.locator('[data-result-class="resource"]').first()).toBeVisible();
  await expect(page.locator('[data-result-class="source"]').first()).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Filter results by ID, title, or topic" })).toHaveValue("NIST");

  /** @type {Array<[string, RegExp]>} */
  const redirects = [
    ["/#/catalog", /#\/library$/],
    ["/#/resources", /#\/library\?kind=tools-communities$/],
    ["/#/resources/official-nist-oscal?from=commons", /#\/library\/resource\/official-nist-oscal$/],
  ];
  for (const [legacy, canonical] of redirects) {
    await gotoApp(page, legacy);
    await expect(page).toHaveURL(canonical);
  }
});

test("Phase 3 filters stay stable, bounded, and free of hierarchy node types", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const renderedSets = [];
  for (const query of ["access control", "Platform One"]) {
    await gotoApp(page, `/#/library?q=${encodeURIComponent(query)}`);
    await waitForAppReady(page, { allowPartial: true });
    const rail = page.locator(".search-filter-rail");
    await expect(rail).toBeVisible();
    renderedSets.push(await rail.locator("label > span").allTextContents());
    for (const select of await rail.locator("select").all()) {
      expect(await select.locator("option").count()).toBeLessThanOrEqual(10);
      expect(await select.locator("option:not([value=''])").count()).toBeGreaterThanOrEqual(2);
    }
    const datalistSizes = await rail.locator("datalist").evaluateAll((lists) => lists.map((list) => list.querySelectorAll("option").length));
    expect(datalistSizes.every((size) => size >= 2), datalistSizes.join(",")).toBe(true);
    await expect(rail).not.toContainText(/\b(?:Limb|Trunk|Group)\b/);
  }
  expect(renderedSets[1]).toEqual(renderedSets[0]);
  const kindLabels = await page.getByLabel("Content kind").locator("option:not([value=''])").allTextContents();
  expect(kindLabels.map((label) => label.replace(/ \(\d+\)$/, ""))).toEqual([
    "Baselines & profiles",
    "Process & methods",
    "Requirements",
    "Technical rules",
    "Threats & defenses",
    "Tools & communities",
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
  await page.locator('[data-record-id="nist-800-53:AC-2"] .search-result-primary').click();
  await waitForAppReady(page, { allowPartial: true });
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", canonicalBreadcrumb);
  await expect(page.locator('header.site-header nav a[aria-current="page"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See this in the Atlas map", exact: true })).toBeVisible();

  await gotoApp(page, "/#/atlas?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page, { allowPartial: true });
  await expect(breadcrumb).toHaveAttribute("data-canonical-breadcrumb", canonicalBreadcrumb);
  await expect(page.locator('header.site-header nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText("Library");

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
  const resultCount = Number((await page.locator(".search-result-count").textContent())?.match(/\d+/)?.[0] || 0);
  expect(resultCount).toBeGreaterThan(0);
  const mapButton = page.getByRole("button", { name: "Atlas map", exact: true });
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
  await page.getByRole("button", { name: "Atlas map", exact: true }).dispatchEvent("click");
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

test("Phase 3 task taxonomy is shared verbatim and obsolete home map copy is absent", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });
  const homeTaxonomy = await page.locator(".home-secondary-action strong").allTextContents();
  expect(homeTaxonomy).toHaveLength(7);
  await expect(page.locator(".home-work-map span")).toHaveCount(0);

  await gotoApp(page, "/#/start");
  await waitForAppReady(page, { allowPartial: true });
  await expect(page.locator(".start-here-choice-grid button").first()).toBeVisible();
  const startTaxonomy = await page.locator(".start-here-choice-grid button span").allTextContents();
  expect(startTaxonomy).toEqual(homeTaxonomy);
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
  const actions = page.locator(".page-header-actions");
  await expect(actions.getByRole("link", { name: "Open official source", exact: true })).toBeVisible();
  await expect(actions.getByRole("link", { name: "See this in the Atlas map", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back", exact: true })).toHaveCount(1);
  await actions.locator("summary", { hasText: "More actions" }).click();
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
    await expect(footer).toContainText("Free and open source, not a government system");
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
    await expect(area).toContainText(/\d[\d,]* records/);
  }
  await expect(page.locator(".atlas-tree__totals")).toContainText("23");
});
