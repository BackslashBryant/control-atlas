import { expect, test } from "@playwright/test";

import { dismissOnboarding, waitForAppReady } from "./support.mjs";

async function open(page, route) {
  await page.goto(route);
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

async function resultTotal(page) {
  const label = await page.locator(".workspace-result-count").innerText();
  const showing = label.match(/of ([\d,]+) results?/i);
  const exact = label.match(/([\d,]+) results?/i);
  return Number((showing?.[1] || exact?.[1] || "0").replaceAll(",", ""));
}

test("governed tags keep stable URL, OR/AND, alias, count, and unavailable-value behavior", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/#/library");

  const facets = page.locator(".workspace-facet-rail");
  await facets.locator("details.workspace-advanced-facets > summary").click();
  const assetFacet = facets.getByRole("group", { name: "Asset and system" });
  await assetFacet.getByPlaceholder("Find asset and system").fill("dbms");
  await expect(assetFacet.getByRole("checkbox", { name: /Database/ })).toBeVisible();
  await assetFacet.getByPlaceholder("Find asset and system").fill("");

  await assetFacet.getByRole("checkbox", { name: /Server/ }).click();
  await expect(page).toHaveURL(/tag=asset\.server/);
  const serverCount = await resultTotal(page);

  await assetFacet.getByRole("checkbox", { name: /Workstation/ }).click();
  await expect(page).toHaveURL(/tag=asset\.server.*tag=asset\.workstation/);
  const withinDimensionCount = await resultTotal(page);
  expect(withinDimensionCount).toBeGreaterThanOrEqual(serverCount);

  const vendorFacet = facets.getByRole("group", { name: "Vendor" });
  await vendorFacet.getByRole("checkbox", { name: /Microsoft/ }).click();
  await expect(page).toHaveURL(/tag=asset\.server.*tag=asset\.workstation.*tag=vendor\.microsoft/);
  await expect.poll(() => resultTotal(page)).toBeLessThanOrEqual(withinDimensionCount);

  await open(page, "/#/library?tag=asset.iot");
  const contextualVendorFacet = page.locator(".workspace-facet-rail").getByRole("group", { name: "Vendor" });
  await expect(contextualVendorFacet).toHaveCount(0);
});

test("record and Resource governed tags hand off to the filtered Library", async ({ page }) => {
  await open(page, "/#/record/nist-mobile-threats/CEL-1");
  await page.getByRole("link", { name: "Filter the Library by Mobile", exact: true }).click();
  await expect(page).toHaveURL(/#\/library\?tag=asset\.mobile/);
  await expect(page.getByRole("button", { name: /Mobile/ })).toBeVisible();

  await open(page, "/#/record/disa-cci/CCI-000366");
  await page.getByRole("link", { name: "Filter the Library by Configuration Management" }).click();
  await expect(page).toHaveURL(/#\/library\?tag=domain\.configuration-management/);
  await expect(page.getByRole("button", { name: /Configuration Management/ })).toBeVisible();

  await open(page, "/#/resources/tool-cisa-cset");
  const relatedTopics = page.getByRole("heading", { name: "Related topics" }).locator("..");
  await relatedTopics.getByRole("link", { name: "Microsoft Windows" }).click();
  await expect(page).toHaveURL(/#\/library\?tag=product\.microsoft-windows/);
  await expect(page.getByRole("button", { name: /Microsoft Windows/ })).toBeVisible();
});

test("global navigation has no breakpoint dead zone", async ({ page }) => {
  for (const width of [1023, 1024, 1119, 1199]) {
    await page.setViewportSize({ width, height: 800 });
    await open(page, "/#/about");
    const toggle = page.getByRole("button", { name: "Open navigation menu" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveCSS("min-height", "44px");
  }

  await page.setViewportSize({ width: 1024, height: 800 });
  await open(page, "/#/about");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("navigation", { name: "Primary navigation (mobile)" }).getByRole("link", { name: "Guides" }).click();
  await expect(page).toHaveURL(/#\/guides$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/guides$/);

  await page.setViewportSize({ width: 1200, height: 800 });
  await open(page, "/#/about");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open more pages" })).toBeVisible();
});

test("record actions stay in the viewport and Escape restores focus", async ({ page }) => {
  for (const width of [320, 375, 390, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await open(page, "/#/record/nist-800-53/AC-2");
    const summary = page.locator(".record-actions-menu summary");
    await summary.click();
    const metrics = await page.locator(".record-actions-popover").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        documentWidth: globalThis.document.documentElement.scrollWidth,
        left: rect.left,
        right: rect.right,
        viewportWidth: globalThis.innerWidth,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    await page.keyboard.press("Escape");
    await expect(page.locator(".record-actions-menu")).not.toHaveAttribute("open", "");
    await expect(summary).toBeFocused();
  }
});

test("Home exposes compact release, source, and contribution trust links", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/");
    const home = page.locator("[data-static-home]:not([hidden])");
    await expect(home.locator('[data-app-ready="true"]')).toBeVisible();
    const footer = home.locator(".home-footer");
    await expect(footer).toContainText("Free and open source. Not a government system.");
    await expect(footer).toContainText("Product release");
    await expect(footer).toContainText("Source data built");
    await expect(footer.getByRole("link", { name: "Source attribution" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Submit resource" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Report a problem" })).toBeVisible();
  }
});

test("Resources presents governed labels instead of raw enums", async ({ page }) => {
  await open(page, "/#/resources/official-cisa-kev-catalog");
  // The dataset profile publishes resource type, access status, and
  // verification method. Each must reach the page as a governed label; the
  // stored enum value must never surface.
  await expect(page.locator(".resource-detail-brief").getByText("Dataset", { exact: true })).toBeVisible();
  const access = page.getByRole("heading", { name: "How to use or access", exact: true }).locator("..");
  await expect(access.getByText("Current", { exact: true })).toBeVisible();
  const maintenance = page.locator("details.resource-detail-maintenance");
  await maintenance.locator("summary").click();
  await expect(maintenance.getByText("Public URL", { exact: true })).toBeVisible();
  for (const rawEnum of ["dataset", "current", "public_url"]) {
    await expect(page.getByText(rawEnum, { exact: true })).toHaveCount(0);
  }
});

test("Guide context hands governed tags to the Library", async ({ page }) => {
  await open(page, "/#/guides?pattern=cloud-and-shared-responsibility");
  const guideTags = page.getByRole("region", { name: /Related Library tags for Cloud and shared responsibility/i });
  const guideTag = guideTags.getByRole("link").first();
  await expect(guideTag).toBeVisible();
  await guideTag.click();
  await expect(page).toHaveURL(/#\/library\?tag=/);
});

test("starter-document context preserves the selected document and preview", async ({ page }) => {
  await open(page, "/#/build/documents/security_plan_starter?framework=nist-800-53&baseline=LOW");
  expect(await page.evaluate(() => globalThis.scrollY)).toBeLessThanOrEqual(1);
  await expect(page.getByRole("heading", { name: "Templates", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Configure inputs" })).toBeVisible();
  const context = page.getByRole("complementary", { name: "Current document" });
  await expect(context).toContainText("Security Plan Starter");
  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
});

test("retired STIG Compare links recover to the published crosswalk", async ({ page }) => {
  await open(page, "/#/compare/stig-chain?chainCatalog=disa-stig");
  await expect(page).toHaveURL(/#\/compare$/);
  await expect(page.getByText(
    "This Compare link used a retired workflow. Start a published crosswalk here.",
    { exact: true },
  )).toBeVisible();
});
