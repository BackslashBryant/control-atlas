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
    page.getByText(/Explore how controls, baselines, CCIs, STIGs/i),
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
    page.getByText(/Search for an item or select a group/i),
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

test("relationship graph: open in atlas map from detail header", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open in Atlas Map" }).first().click();
  await expect(page).toHaveURL(/view=atlas-map/);
  await expect(page.getByRole("heading", { name: "Atlas Map", level: 1 })).toBeVisible();
});
