import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("focused Atlas opens structural position before explicit relationship lenses", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2 — Account Management", level: 1 })).toBeVisible();
  // Three views of ONE record. Purpose/RMF are no longer peer tabs: the lens
  // is an entry choice shown as a breadcrumb inside Path.
  await expect(page.getByRole("tab", { name: "Path" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "List" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Purpose" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "RMF" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Where this sits" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Where this sits" })).toContainText(
    "SP 800-53 Rev. 5",
  );
  // The Path asks which lens first; it does not render every lens's records.
  await expect(page.getByText("Where do you want to go from")).toBeVisible();
  await expect(page.locator(".atlas-path-stage-option")).toHaveCount(7);
  await expect(page.locator(".atlas-path-record")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Selected path" })).toBeVisible();
});

test("choosing a relationship lens shows only that lens and can continue from a record", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator(".atlas-path-stage-option").filter({ hasText: "Structure" }).first().click();
  await expect(page.locator(".atlas-path-record").first()).toBeVisible();
  await expect(page.locator(".atlas-path-stage-option")).toHaveCount(0);
  // Breadcrumb records where the walk is: subject > relationship lens.
  await expect(page.getByRole("navigation", { name: "Path position" })).toContainText("AC-2");
  await expect(page.getByRole("navigation", { name: "Path position" })).toContainText("Structure");
});

test("Atlas view tabs support keyboard arrow navigation", async ({ page }) => {
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

test("selecting a Map item reveals its real record brief without leaving Atlas", async ({ page }) => {
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-1&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("group", { name: /connection groups around AC-1/i });
  await map.getByRole("button", { name: /DISA CCIs/i }).click();
  const item = page.getByRole("button", { name: /CCI-000001/i });
  await item.click();
  await expect(item).toHaveAttribute("aria-pressed", "true");

  const brief = page.getByRole("complementary", { name: /CCI-000001 record brief/i });
  await expect(brief).toBeVisible();
  const headerBox = await page.locator(".site-header").boundingBox();
  expect(headerBox).not.toBeNull();
  await expect
    .poll(async () => (await brief.boundingBox())?.y || 0)
    .toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
  await expect(brief.getByRole("heading", { name: "CCI-000001" })).toBeVisible();
  await expect(brief.getByRole("heading", { name: "What this record says" })).toBeVisible();
  await expect(brief.getByRole("heading", { name: "Why it appears here" })).toBeVisible();
  await expect(brief.getByRole("heading", { name: "Source basis" })).toBeVisible();
  await expect(brief).not.toContainText("Open the related record to review its source support");
  await expect(brief).toContainText(
    "The organization develops an access control policy",
  );
  const synopsis = (await brief.locator(".atlas-inspector-synopsis p").first().textContent()) || "";
  expect(synopsis.trim().length).toBeGreaterThan(40);

  await brief.getByRole("button", { name: "Explore from this record" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("CCI-000001");
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
  await page.goto("/#/atlas-map?node=disa-cci%3ACCI-000220&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "No published connections to show." })).toBeVisible();
  await expect(page.locator(".atlas-spatial-map")).toHaveCount(0);
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("a sparse STIG still offers all seven lenses and its real implementation connection", async ({ page }) => {
  await page.goto("/#/atlas-map?node=disa-stig%3AV-222387");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: /V-222387/, level: 1 })).toBeVisible();
  // Every lens is still offered; empty ones say so honestly and are disabled
  // rather than hidden, so the gap stays visible.
  const lenses = page.locator(".atlas-path-stage-option");
  await expect(lenses).toHaveCount(7);
  const implementation = lenses.filter({ hasText: "Implementation" }).first();
  await expect(implementation).toBeEnabled();
  await expect(implementation).not.toContainText("No published connection yet");
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

test("compact Path stacks its stage choices and keeps the selected path below them", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/atlas-map?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const stageColumns = await page.locator(".atlas-path-stage-list").evaluate(
    (element) =>
      globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  expect(stageColumns).toBe(1);
  const stages = await page.locator(".atlas-path-stage-list").boundingBox();
  const selectedPath = await page.getByRole("complementary", { name: "Selected path" }).boundingBox();
  expect(stages).not.toBeNull();
  expect(selectedPath).not.toBeNull();
  expect(selectedPath.y).toBeGreaterThanOrEqual(stages.y + stages.height - 1);
});
