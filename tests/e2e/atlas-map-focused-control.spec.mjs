import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("focused Atlas defaults to the approved six-stage Purpose board", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2 — Account Management", level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Purpose" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "List" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "RMF" })).toBeVisible();
  await expect(page.locator(".atlas-decomposition-stage")).toHaveCount(6);
  await expect(page.getByRole("complementary", { name: "Selected path" })).toBeVisible();
  await expect(page.getByText("Expanded item", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Templates / Playbooks / Sources cluster", { exact: false })).toHaveCount(0);
});

test("Atlas view tabs support keyboard arrow navigation", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const purposeTab = page.getByRole("tab", { name: "Purpose", exact: true });
  await purposeTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "RMF", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(purposeTab).toHaveAttribute("aria-selected", "true");
});

test("focused Map is absolutely bounded and restores focus after collapse", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("group", { name: /connection groups around AC-2/i });
  await expect(map).toBeVisible();
  expect(await map.locator('[data-map-node="true"]').count()).toBeLessThanOrEqual(7);

  const group = map.getByRole("button", { name: /NIST baselines/i });
  await group.click();
  const expanded = page.getByRole("region", { name: "NIST baselines records" });
  await expect(expanded).toBeVisible();
  expect(await expanded.getByRole("button").count()).toBeLessThanOrEqual(5);
  await page.keyboard.press("Escape");
  await expect(group).toBeFocused();
});

test("List uses the same published set and exposes traceable source references", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=list");
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
  await page.goto("/#/atlas-map?node=csf-2%3ADE.AE-01&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "No published connections to show." })).toBeVisible();
  await expect(page.locator(".atlas-spatial-map")).toHaveCount(0);
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("a sparse STIG keeps all six stages and shows its real implementation connection", async ({ page }) => {
  await page.goto("/#/atlas-map?node=disa-stig%3AV-222387");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: /V-222387/, level: 1 })).toBeVisible();
  await expect(page.locator(".atlas-decomposition-stage")).toHaveCount(6);
  await expect(page.locator('[data-stage="implementation"]')).not.toContainText(
    "No published connection in this stage.",
  );
  await expect(page.getByText("No published connections to show.")).toHaveCount(0);
});

test("compact Map expands to no more than seven visible nodes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("group", { name: /connection groups around AC-2/i });
  const group = map.getByRole("button", { name: /NIST baselines/i });
  await group.click();
  const expanded = page.getByRole("region", { name: "NIST baselines records" });
  expect(await expanded.getByRole("button").count()).toBeLessThanOrEqual(4);
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

test("compact Purpose board stacks vertically and keeps the selected path below it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const stageColumns = await page.locator(".atlas-decomposition-board").evaluate(
    (element) =>
      globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  expect(stageColumns).toBe(1);
  const board = await page.locator(".atlas-decomposition-board").boundingBox();
  const selectedPath = await page.getByRole("complementary", { name: "Selected path" }).boundingBox();
  expect(board).not.toBeNull();
  expect(selectedPath).not.toBeNull();
  expect(selectedPath.y).toBeGreaterThanOrEqual(board.y + board.height - 1);
});
