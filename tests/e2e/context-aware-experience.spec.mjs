import { test, expect } from "@playwright/test";

async function open(page, path) {
  await page.goto(path);
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  if (path.startsWith("/#/record/")) {
    await expect(page.locator('[data-template="E"]')).toBeVisible();
    await expect(page.locator(".route-transition")).toBeHidden();
  }
}

test("Home is a universal, work-first front door", async ({ page }) => {
  await open(page, "/#/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find the source",
  );
  await expect(page.getByRole("searchbox", { name: "Search Control Atlas" })).toBeVisible();
  for (const entrance of [
    "Understand a requirement",
    "Secure or build a system",
    "Assess or authorize",
    "Operate or defend",
    "Manage risk or supply chain",
    "Produce a document",
    "Find a tool, template, portal, training source, or community",
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(entrance) })).toBeVisible();
  }
  await expect(page.getByText("SP 800-171 · Supply Chain Risk Management · 3.17.1")).toBeVisible();
  await expect(page.getByText("ATT&CK · Initial Access · T1195.002")).toBeVisible();
});

test("record separates Control Atlas guidance from official source text", async ({
  page,
}) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await expect(page.getByText("Official source text", { exact: true })).toBeVisible();
  const editorial = page.locator('[data-editorial-boundary="explicit"]');
  await expect(editorial).toBeVisible();
  await expect(editorial.getByText("Control Atlas guidance", { exact: true })).toBeVisible();

  const order = await page.evaluate(() => {
    const official = globalThis.document.querySelector(".record-template-main .accordion-root");
    const editorial = globalThis.document.querySelector('[data-editorial-boundary="explicit"]');
    return Boolean(
      official &&
        editorial &&
        editorial.compareDocumentPosition(official) & globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  expect(order).toBe(true);
});

test("record template stays inside the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, "/#/record/nist-800-53/AC-2");

  const overflow = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth - globalThis.document.body.clientWidth,
    document:
      globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  }));
  const templateRegions = page.locator(
    ".record-template-grid, .record-guidance, .record-connections",
  );

  expect(overflow.body).toBe(0);
  expect(overflow.document).toBe(0);
  expect(await templateRegions.count()).toBeGreaterThan(0);
  expect(await templateRegions.evaluateAll((groups) =>
    groups.map((group) => group.scrollWidth - group.clientWidth),
  )).toEqual([0, 0, 0]);
});

test("record actions preserve durable context across features", async ({ page }) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await page.locator(".record-actions-menu summary").click();
  await expect(page.locator(".record-actions-menu")).toHaveAttribute("open", "");
  await page.getByRole("link", { name: "See in Atlas", exact: true }).click();
  await expect(page).toHaveURL(/#\/atlas\?.*node=nist-800-53%3AAC-2/);

  await open(page, "/#/record/nist-800-53/AC-2");
  await page.locator(".record-actions-menu summary").click();
  await expect(page.locator(".record-actions-menu")).toHaveAttribute("open", "");
  await page.locator(".record-actions-popover").getByRole("link", { name: "Compare", exact: true }).click();
  await expect(page).toHaveURL(/#\/compare\?.*(source=nist-800-53.*items=AC-2|items=AC-2.*source=nist-800-53)/);
});

test("record types show source-appropriate guidance and omit unsupported action blocks", async ({
  page,
}) => {
  const cases = [
    ["/#/record/disa-cci/CCI-000001", "What you need to do"],
    ["/#/record/disa-stig/V-222387", "How to satisfy it"],
    ["/#/record/nist-800-171/3.17.1", "What you need to do"],
  ];
  for (const [path, section] of cases) {
    await open(page, path);
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }

  await open(page, "/#/record/mitre-attack/T1195.002");
  await expect(page.getByRole("heading", { name: "What you need to do", exact: true })).toHaveCount(0);
});

test("universal search keeps result classes visibly distinct", async ({ page }) => {
  await open(page, "/#/search?q=supply%20chain");
  await expect(page.locator('[data-result-class="published-record"]').first()).toBeVisible();

  await open(page, "/#/search?q=NISTControls");
  await expect(page.locator('[data-result-class="resource"]').first()).toBeVisible();
  await expect(page.getByText(/Matched community metadata/).first()).toBeVisible();
});
