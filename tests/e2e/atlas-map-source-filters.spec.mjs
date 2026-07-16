import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("optional source filters expose gated records with warnings", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Source guide" }).click();
  await expect(page).toHaveURL(/node=foundation/);

  // Source-visibility filters now live in a "Display options" disclosure.
  await page.getByText("Display options", { exact: true }).click();

  const supporting = page.getByRole("checkbox", {
    name: "Show supporting references",
  });
  await supporting.check();
  await expect(
    page.getByText(
      "Supporting references add context but do not drive authoritative mappings.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "STIG Viewer Public Catalog" }),
  ).toBeVisible();
  await supporting.uncheck();
  await expect(
    page.getByRole("button", { name: "STIG Viewer Public Catalog" }),
  ).toHaveCount(0);

  const draft = page.getByRole("checkbox", {
    name: "Show draft / legacy sources",
  });
  await draft.check();
  await expect(
    page.getByText(
      "Draft and legacy sources may not represent current authoritative guidance.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "OLIR CSF 2.0 to SP 800-53 Rev. 5.2.0 Mapping",
    }),
  ).toBeVisible();
  await draft.uncheck();
  await expect(
    page.getByRole("button", {
      name: "OLIR CSF 2.0 to SP 800-53 Rev. 5.2.0 Mapping",
    }),
  ).toHaveCount(0);
});
