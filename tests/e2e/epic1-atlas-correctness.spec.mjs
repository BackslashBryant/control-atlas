import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
});

test("exact Atlas identifier focuses the record and keeps choices out of ancestry", async ({
  page,
}) => {
  await page
    .getByRole("searchbox", { name: "Search Atlas" })
    .fill("nist-800-53:AC-2");
  await page.getByRole("searchbox", { name: "Search Atlas" }).press("Enter");

  await expect(page).toHaveURL(/node=nist-800-53%3AAC-2/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "AC-2 — Account Management",
    }),
  ).toBeVisible();
  const structuralPosition = page.getByRole("navigation", {
    name: "Where this sits",
  }).first();
  await expect(structuralPosition).toContainText("SP 800-53 Rev. 5");
  await expect(structuralPosition).toContainText("Access Control");
  await expect(structuralPosition).not.toContainText("CSF");
  await expect(structuralPosition).not.toContainText("Moderate");
});

test("ambiguous Atlas text hands off to canonical Search", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search Atlas" }).fill("account");
  await page.getByRole("searchbox", { name: "Search Atlas" }).press("Enter");

  await expect(page).toHaveURL(/\/search\?q=account/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Search everything in one place",
    }),
  ).toBeVisible();
});

test("no-match Atlas search stays local with announced recovery actions", async ({
  page,
}) => {
  const query = "zzzz-epic-one-no-match";
  await page.getByRole("searchbox", { name: "Search Atlas" }).fill(query);
  await page.getByRole("searchbox", { name: "Search Atlas" }).press("Enter");

  await expect(page).toHaveURL(/\/explore/);
  await expect(
    page.getByText(`No Atlas record matches ${query}.`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Search all records" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Browse the Catalog" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    `No Atlas record matches ${query}. Try Search or browse the Catalog.`,
  );
});

test("focused Atlas exposes explicit lenses and class-direction List semantics", async ({
  page,
}) => {
  await page.goto("/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);

  await expect(
    page.getByRole("navigation", { name: "Where this sits" }).first(),
  ).toContainText("SP 800-53 Rev. 5");
  await expect(
    page.getByRole("navigation", { name: "Where this sits" }).first(),
  ).toContainText("Access Control");
  await expect(page.getByRole("tab", { name: "Path" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "List" })).toBeVisible();

  await page.getByRole("tab", { name: "List" }).click();
  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table.getByRole("columnheader", { name: "Class and direction" })).toBeVisible();
  await expect(table.locator("tbody tr").first()).toContainText(
    /Structure|Applicability|Correlation/,
  );
  await expect(table.locator("tbody tr").first()).toContainText(
    /From selected record|To selected record/,
  );
});
