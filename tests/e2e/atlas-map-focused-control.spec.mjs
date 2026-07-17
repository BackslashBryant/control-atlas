import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("focused Atlas defaults to the six-stage published connection Path", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2", level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Path" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "List" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Compliance path" }).getByRole("tab")).toHaveCount(6);
  await expect(page.getByText("Expanded item", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Templates / Playbooks / Sources cluster", { exact: false })).toHaveCount(0);
});

test("Atlas view and Path tabs support keyboard arrow navigation", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
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

  const stageTabs = page.getByRole("tablist", { name: "Compliance path" });
  const understand = stageTabs.getByRole("tab", { name: /Understand/ });
  await understand.focus();
  await page.keyboard.press("ArrowRight");
  await expect(stageTabs.getByRole("tab", { name: /Decide/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("focused Map is absolutely bounded and restores focus after collapse", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("group", { name: /connection groups around AC-2/i });
  await expect(map).toBeVisible();
  expect(await map.locator('[data-map-node="true"]').count()).toBeLessThanOrEqual(7);

  const group = map.getByRole("button", { name: /NIST baselines/i }).first();
  await group.click();
  const expanded = page.getByRole("group", { name: /Expanded NIST baselines connections/i });
  await expect(expanded).toBeVisible();
  expect(await expanded.locator('[data-map-node="true"]').count()).toBeLessThanOrEqual(11);
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
  await expect(page.locator(".atlas-bounded-map")).toHaveCount(0);
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("a sparse STIG opens the first stage that contains its real connection", async ({ page }) => {
  await page.goto("/#/atlas-map?node=disa-stig%3AV-222387");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "V-222387", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Compliance path" }).getByRole("tab", {
      name: /Implement/,
    }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("No published connections to show.")).toHaveCount(0);
});

test("compact Map expands to no more than seven visible nodes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("group", { name: /connection groups around AC-2/i });
  const group = map.getByRole("button", { name: /NIST baselines/i }).first();
  await group.click();
  const expanded = page.getByRole("group", { name: /Expanded NIST baselines connections/i });
  expect(await expanded.locator('[data-map-node="true"]').count()).toBeLessThanOrEqual(7);
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

test("compact Path is vertical and places the inspector below the active view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const stageColumns = await page.locator(".atlas-path-stage-nav").evaluate(
    (element) =>
      globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  expect(stageColumns).toBe(1);
  const main = await page.locator(".atlas-focused-main").boundingBox();
  const inspector = await page.locator(".atlas-record-inspector").boundingBox();
  expect(main).not.toBeNull();
  expect(inspector).not.toBeNull();
  expect(inspector.y).toBeGreaterThanOrEqual(main.y + main.height - 1);
});
