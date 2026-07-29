import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("focused Atlas opens publisher-declared structure before relationship views", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2 — Account Management", level: 1 })).toBeVisible();
  // Three views of one record. Path owns structural position; relationship
  // classes stay in Map and List instead of becoming structural parents.
  await expect(page.getByRole("tab", { name: "Path" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "List" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Purpose" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "RMF" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Where this sits" })).toBeVisible();
  await expect(
    page
      .getByRole("tabpanel", { name: "Path" })
      .getByRole("navigation", { name: "Where this sits" }),
  ).toContainText("SP 800-53 Rev. 5");
  await expect(
    page.getByText(/Publisher-declared structural path/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Baselines and process lenses remain separate choices/i),
  ).toBeVisible();
  await expect(page.locator(".atlas-path-stage-option")).toHaveCount(0);
  await expect(page.locator(".atlas-path-record")).toHaveCount(0);
});

test("focused Path opens its publisher-declared parent without inventing another parent", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("tabpanel", { name: "Path" })
    .getByRole("button", { name: "Access Control" })
    .click();
  await expect(
    page.getByRole("heading", { name: "FAMILY-AC â€” Access Control", level: 1 }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("tabpanel", { name: "Path" })
      .getByRole("navigation", { name: "Where this sits" }),
  ).toContainText("SP 800-53 Rev. 5");
  await expect(page).toHaveURL(/node=nist-800-53%3AFAMILY-AC/);
  await expect(page).not.toHaveURL(/atlasBaseline=/);
});

test("Atlas view tabs support keyboard arrow navigation", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const pathTab = page.getByRole("tab", { name: "Path", exact: true });
  await pathTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Map", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(pathTab).toHaveAttribute("aria-selected", "true");
});

test("focused Map uses the shared bounded graph and exposes the complete List", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("region", { name: "Relationship map" });
  await expect(map).toBeVisible();
  await expect(map.locator(".atlas-scope-count")).toContainText(
    "List contains the complete same scope",
  );
  const visibleNodes = map
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button");
  expect(await visibleNodes.count()).toBeLessThanOrEqual(7);

  await page.getByRole("tab", { name: "List", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Relationship table" }),
  ).toBeVisible();
});

test("List uses the same published set and exposes traceable source references", async ({ page }) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2&relationshipView=list");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr").first()).toBeVisible();
  await expect(table.getByText(/source reference/i).first()).toBeVisible();
  await expect(table).not.toContainText("Expanded item");
  await expect(table).not.toContainText("nist-olir-");
});

test("zero-published-edge records render an honest empty state instead of Map", async ({ page }) => {
  await page.goto("/#/explore?node=disa-cci%3ACCI-000220&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "No published connections to show." })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Relationship map" }),
  ).toHaveCount(0);
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("a sparse STIG keeps structural position separate from its published connections", async ({ page }) => {
  await page.goto("/#/explore?node=disa-stig%3AV-222387");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: /V-222387/, level: 1 })).toBeVisible();
  await expect(
    page.getByRole("tabpanel", { name: "Path" }),
  ).toContainText("Publisher-declared structural path");
  await page.getByRole("tab", { name: "List", exact: true }).click();
  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  await expect(table).toContainText(/implementation/i);
});

test("compact Map keeps the shared graph bounded without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/explore?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("region", { name: "Relationship map" });
  const visibleNodes = map
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button");
  expect(await visibleNodes.count()).toBeLessThanOrEqual(5);
  const overflow = await page.evaluate(() => ({
    body:
      globalThis.document.body.scrollWidth -
      globalThis.document.body.clientWidth,
    document:
      globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  }));
  expect(overflow).toEqual({ body: 0, document: 0 });
});

test("compact Path preserves structural position without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("tabpanel", { name: "Path" }),
  ).toContainText("Publisher-declared structural path");
  const overflow = await page.evaluate(() => ({
    body:
      globalThis.document.body.scrollWidth -
      globalThis.document.body.clientWidth,
    document:
      globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  }));
  expect(overflow).toEqual({ body: 0, document: 0 });
});
