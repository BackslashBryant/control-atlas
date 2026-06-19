import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("relationship graph: open from AC-2 detail, filter, table fallback, and navigate", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "View as map" }).click();
  await expect(
    page.getByRole("heading", { name: "Relationship map" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Use the table view for full screen-reader access/i),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Table" }).click();
  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  await expect(table).toContainText("Plain-language rationale");

  await page.getByLabel("Connection type").selectOption({ index: 1 });
  await page.getByRole("tab", { name: "Map" }).click();
  await page.getByRole("tab", { name: "Table" }).click();

  const firstRowLink = table.getByRole("button").first();
  await expect(firstRowLink).toBeVisible();
  await firstRowLink.click();
  await expect(page).toHaveURL(/view=library-detail/);
});

test("relationship graph: sidebar link opens map view", async ({ page }) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("button", { name: "Explore connections as a map" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Relationship map" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/relationshipView=map/);
});
