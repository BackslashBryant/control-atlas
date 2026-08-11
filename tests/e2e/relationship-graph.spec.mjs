import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas standalone route opens the focused canvas with Connections below", async ({ page }) => {
  await page.goto("/#/atlas?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Atlas breadcrumb" })).toContainText("Access Control");
  await expect(page.getByRole("heading", { name: "Connections", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: /View all \d+ connections/ }).click();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("Atlas default route is the semantic authority hierarchy, not an empty relationship graph", async ({ page }) => {
  await page.goto("/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("application", { name: "Interactive Atlas map hierarchy" })).toBeVisible();
  await expect(page.locator(".atlas-tree__areas [data-area-id]")).toHaveCount(9);
  await expect(page.locator(".react-flow")).toHaveCount(1);
  await expect(page.locator(".ca-flow-wrap")).toHaveCount(0);
});

test("record detail keeps published connections in an accessible list", async ({ page }) => {
  await page.goto(
    "/#/record/nist-800-53/AC-2?relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-template="E"]')).toBeVisible();
  await expect(page.locator('[data-record-section="connections"] ul').first()).toBeVisible();
});

test("record detail leaves the shared relationship graph in Atlas", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2?relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-template="E"]')).toBeVisible();
  await expect(page.locator(".record-template .react-flow")).toHaveCount(0);
  await page.locator(".record-actions-menu summary").click();
  await expect(page.getByRole("link", { name: "See in Atlas", exact: true })).toBeVisible();
});

test("record detail opens the same record in the new Atlas", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.locator(".record-actions-menu summary").click();
  await page.getByRole("link", { name: "See in Atlas", exact: true }).click();
  await expect(page).toHaveURL(/#\/atlas/);
  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Atlas breadcrumb" })).toContainText("Access Control");
});
