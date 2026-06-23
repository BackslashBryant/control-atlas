import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("atlas map: standalone route with list fallback", async ({ page }) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas Map", level: 1 })).toBeVisible();
  await expect(
    page.getByText(/See the control in context/i),
  ).toBeVisible();

  await page.getByRole("tab", { name: "List" }).click();
  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  await expect(table).toContainText("Plain-language rationale");
});

test("atlas map: default starter state without selected node", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas Map", level: 1 })).toBeVisible();
  await expect(
    page.getByText(/Explore the compliance ecosystem/i),
  ).toBeVisible();
});

test("relationship graph: detail page opens list view", async ({ page }) => {
  await page.goto(
    "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Atlas Map" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Use the list view for full screen-reader access/i),
  ).toBeVisible();
});

test("atlas map: AC-2 clusters DISA CCIs and selection does not relayout", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-is-cluster="true"]').first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator(".relationship-map-layout-overlay")).toHaveCount(0, {
    timeout: 15000,
  });

  const shortcuts = page
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button");
  await expect(shortcuts.first()).toBeVisible();
  const shortcutCount = await shortcuts.count();
  const targetIndex = shortcutCount > 1 ? 1 : 0;
  await shortcuts.nth(targetIndex).click();

  await expect(page.locator(".relationship-map-layout-overlay")).toHaveCount(0);
});

test("atlas map: expanding a cluster preserves the view without forced refit", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const clusterButton = page.locator('[data-is-cluster="true"]').first();
  await expect(clusterButton).toBeVisible({ timeout: 15000 });
  await clusterButton.click();

  await expect(
    page.getByRole("button", { name: /Collapse/i }),
  ).toBeVisible({ timeout: 15000 });
});

test("atlas map: library detail map clusters large groups", async ({ page }) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-is-cluster="true"]').first()).toBeVisible({
    timeout: 15000,
  });
});

test("atlas map: does not re-layout while idle on unrelated app updates", async ({
  page,
}) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText(/Map ready:|Map loaded:/i)).toBeAttached({
    timeout: 15000,
  });
  await expect(page.locator(".relationship-map-layout-overlay")).toHaveCount(0, {
    timeout: 15000,
  });

  await page.waitForTimeout(5500);

  await expect(page.locator(".relationship-map-layout-overlay")).toHaveCount(0);
  await expect(page.getByText(/Map ready:|Map loaded:/i)).toBeAttached();
});

test("atlas map: shows arranging status while layout runs", async ({ page }) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText(/Map ready:|Map loaded:/i)).toBeAttached({
    timeout: 15000,
  });
});

test("relationship graph: open in atlas map from detail header", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open in Atlas Map" }).first().click();
  await expect(page).toHaveURL(/atlas-map/);
  await expect(page.getByRole("heading", { name: "Atlas Map", level: 1 })).toBeVisible();
});
