import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas standalone route exposes Path, bounded Map, and List", async ({ page }) => {
  await page.goto("/?view=atlas-map&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "AC-2", level: 1 })).toBeVisible();
  // Purpose/RMF are lenses inside Path now, not peer tabs.
  await expect(page.getByRole("tab", { name: "Path", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Map" }).click();
  await expect(page.getByRole("group", { name: /connection groups around AC-2/i })).toBeVisible();
  await page.getByRole("tab", { name: "List" }).click();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("Atlas default route is the source Path, not an empty graph", async ({ page }) => {
  await page.goto("/?view=atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Control Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Novice questions path" })).toBeVisible();
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("relationship graph on detail page retains its accessible List fallback", async ({ page }) => {
  await page.goto(
    "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas Map" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("legacy detail Map still clusters large groups outside the Atlas route", async ({ page }) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-is-cluster="true"]').first()).toBeVisible({
    timeout: 15000,
  });
});

test("record detail opens the same record in the new Atlas", async ({ page }) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open in Atlas Map" }).first().click();
  await expect(page).toHaveURL(/atlas-map/);
  await expect(page.getByRole("heading", { name: "AC-2", level: 1 })).toBeVisible();
});
