import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("AC-2 opens a controlled focused map with clustered context", async ({
  page,
}) => {
  await page.goto("/#/atlas-map?node=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const nodes = page.getByRole("group", { name: "Map nodes" }).getByRole("button");
  expect(await nodes.count()).toBeLessThanOrEqual(12);
  await expect(page.getByRole("button", { name: "AC-2", exact: true })).toHaveAttribute(
    "data-graph-role",
    "nist-control",
  );
  await expect(page.getByRole("button", { name: "SP 800-53 Rev. 5" })).toBeVisible();
  await expect(page.getByRole("button", { name: "DISA CCIs cluster" })).toBeVisible();
  await expect(page.getByRole("button", { name: "STIG/SRG cluster" })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Templates / Playbooks / Sources cluster",
    }),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "AC-2", level: 2 })).toBeVisible();
  await expect(page.getByText("Account Management", { exact: true })).toBeVisible();
  await expect(page.getByText("Type: NIST Control", { exact: true })).toBeVisible();
  await expect(page.getByText("Catalog: SP 800-53 Rev. 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Family: Access Control", { exact: true })).toBeVisible();
});
