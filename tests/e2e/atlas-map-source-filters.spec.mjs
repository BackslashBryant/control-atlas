import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("optional source filters expose gated records with plain warnings", async ({ page }) => {
  await page.goto("/#/atlas-map?relationshipView=list");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByText("Source options", { exact: true }).click();

  const supporting = page.getByRole("checkbox", {
    name: "Show supporting references",
  });
  await supporting.click();
  await expect(supporting).toBeChecked();
  await expect(
    page.getByText(
      "Supporting references add context but do not drive authoritative mappings.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "STIG Viewer Public Catalog" })).toBeVisible();
  await supporting.click();
  await expect(supporting).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "STIG Viewer Public Catalog" })).toHaveCount(0);

  const draft = page.getByRole("checkbox", {
    name: "Show draft / legacy sources",
  });
  await draft.click();
  await expect(draft).toBeChecked();
  await expect(
    page.getByText(
      "Draft and legacy sources may not represent current authoritative guidance.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "OLIR CSF 2.0 to SP 800-53 Rev. 5.2.0 Mapping",
    }),
  ).toBeVisible();
  await draft.click();
  await expect(draft).not.toBeChecked();
  await expect(
    page.getByRole("heading", {
      name: "OLIR CSF 2.0 to SP 800-53 Rev. 5.2.0 Mapping",
    }),
  ).toHaveCount(0);
});
