import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas opens directly to the novice source Path", async ({ page }) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Control Atlas", level: 1 })).toBeVisible();
  // With no subject chosen there is no view switcher at all: Map and List are
  // views OF a record, and offering them here produced a dead-end that told
  // the user to go pick one.
  await expect(page.getByRole("tab", { name: "Map", exact: true })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "List", exact: true })).toHaveCount(0);
  await expect(
    page.getByText(
      "Start with the question you are trying to answer. Each path opens the same trusted source model in a more useful order.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Novice questions path" }).getByRole("tab")).toHaveCount(6);
  await expect(page.locator(".react-flow")).toHaveCount(0);
});

test("Purpose and RMF reorder the same source inventory without fabricating Map edges", async ({ page }) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Purpose", exact: true }).click();
  await expect(page).toHaveURL(/sourceView=purpose/);
  await expect(page.getByRole("tablist", { name: "Purpose path" }).getByRole("tab")).toHaveCount(9);
  await page.getByRole("tab", { name: /Controls/ }).click();
  await expect(page.getByRole("heading", { name: "NIST SP 800-53 Rev. 5" })).toBeVisible();

  await page.getByRole("button", { name: "RMF lifecycle", exact: true }).click();
  await expect(page).toHaveURL(/sourceView=rmf/);
  await expect(page.getByRole("tablist", { name: "RMF lifecycle path" }).getByRole("tab")).toHaveCount(7);
  await expect(page.locator(".atlas-bounded-map")).toHaveCount(0);
});

test("Map without a selected record explains why it is unavailable", async ({ page }) => {
  await page.goto("/#/atlas-map?relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Choose a record before opening Map." })).toBeVisible();
  await expect(page.getByText(/guided source path is navigation, not relationship evidence/i)).toBeVisible();
  await expect(page.locator(".atlas-bounded-map")).toHaveCount(0);
});

test("a source Path card opens a real connected record", async ({ page }) => {
  await page.goto("/#/atlas-map?sourceView=purpose");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("tab", { name: /Controls/ }).click();
  const sourceCard = page.locator(".atlas-source-cards article").filter({
    has: page.getByRole("heading", { name: "NIST SP 800-53 Rev. 5" }),
  });
  await sourceCard.getByRole("button", { name: "View connected records" }).click();
  await expect(page).toHaveURL(/node=nist-800-53%3AFAMILY-AC/);
  await expect(page.getByRole("heading", { name: "FAMILY-AC", level: 1 })).toBeVisible();
  await expect(page.locator(".atlas-path-stage-option")).toHaveCount(6);
  await expect(
    page.getByRole("complementary", { name: "Selected path" }),
  ).toBeVisible();
});
