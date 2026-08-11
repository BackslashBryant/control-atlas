import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from "./support.mjs";

async function openRecord(page, route) {
  attachPageDiagnostics(page);
  await page.goto(route);
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);
}

test("WS2 record template leads with qualified identity and one source action", async ({ page }) => {
  await openRecord(page, "/#/record/nist-800-171-rev2/3.1.1");

  const template = page.locator('[data-template="E"]');
  await expect(template).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "AC-3.1.1", level: 1 })).toBeVisible();
  await expect(page.locator("[data-canonical-breadcrumb]"))
    .toHaveAttribute("data-canonical-breadcrumb", /AC-3\.1\.1$/);
  await expect(page.locator(".record-plain-name")).toContainText(
    /Limit system access to authorized users, processes acting on behalf/,
  );
  await expect(template.locator(".bucket-tag")).toHaveCount(2);
  await expect(template.locator(".bucket-tag").first()).toContainText("Compliance");
  await expect(page.locator(".record-classification-tags").locator(":scope > *"))
    .toHaveCount(3);
  await expect(page.getByRole("link", { name: "Open official source", exact: true })).toHaveCount(1);

  const headings = await template.locator("h2").allTextContents();
  expect(headings.slice(0, 3)).toEqual([
    "What this is",
    "What you need to do",
    "How to satisfy it",
  ]);
  await expect(page.getByText("Official source text", { exact: true })).toBeVisible();
  await expect(page.getByText("Classified under", { exact: true })).toBeVisible();
  await expect(page.getByText("Comes from", { exact: true })).toBeVisible();
  await expect(page.getByText("Source & provenance", { exact: true })).toBeVisible();
});

test("WS2 connections exclude structural parents and developer fields stay collapsed", async ({ page }) => {
  await openRecord(page, "/#/record/nist-800-53/AC-2");

  const connections = page.locator('[data-record-section="connections"]');
  await expect(connections).toBeVisible();
  await expect(connections).not.toContainText("Contains");
  await expect(connections).not.toContainText("FAMILY-ACCESS-CONTROL");
  const connectionRows = connections.locator("[data-record-connection-id]");
  expect(await connectionRows.count()).toBeGreaterThan(1);
  const connectionIds = await connectionRows.evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-record-connection-id")),
  );
  expect(new Set(connectionIds).size).toBe(connectionIds.length);
  for (const row of await connectionRows.all()) {
    await expect(row.locator(".relationship-meta")).not.toBeEmpty();
    await expect(row.locator(".relationship-citation")).not.toBeEmpty();
  }

  const visibleText = await page.locator("main").innerText();
  expect(visibleText).not.toContain("nist-800-53:AC-2");
  expect(visibleText).not.toMatch(/\.json#|\/data\/|Node ID/);
  await expect(page.getByText("Developer details", { exact: true })).toBeVisible();
  await expect(page.getByText("nist-800-53:AC-2", { exact: true })).toBeHidden();
});

test("WS2 preserves source-specific implementation guidance and responsive flow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openRecord(page, "/#/record/disa-stig/V-222387");

  await expect(page.getByRole("heading", { name: "How to satisfy it", level: 2 })).toBeVisible();
  await expect(page.locator(".record-guidance")).toContainText(/Configure|configuration/i);
  const overflow = await page.evaluate(() =>
    globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator(".record-template-sidebar")).toHaveCSS("position", "static");
});

test("WS2 desktop uses the locked two-column reading layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openRecord(page, "/#/record/nist-800-53/AC-2");

  const columns = await page.locator(".record-template-grid").evaluate((element) =>
    globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean),
  );
  expect(columns).toHaveLength(2);
  await expect(page.locator(".record-template-sidebar")).toHaveCSS("position", "sticky");
});
