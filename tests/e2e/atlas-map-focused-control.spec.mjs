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

  // Coverage matrix now lives in a collapsible drawer (graph-first redesign).
  await page.getByText("Coverage matrix", { exact: true }).click();
  const matrix = page.getByRole("table", { name: "Atlas coverage matrix" });
  await expect(matrix).toBeVisible();
  await expect(matrix).toContainText("AC-2");
  await expect(matrix).toContainText("SP 800-53 Rev. 5");
});

// Phase D2: the leverage inspector answers "if I implement this, what else do
// I satisfy?" — the birds-per-stone impact, on the canvas.
test("focused map shows the leverage inspector with the impact breakdown", async ({
  page,
}) => {
  await page.goto("/#/atlas-map?node=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const leverage = page.locator(".atlas-leverage");
  await expect(leverage).toBeVisible();
  await expect(leverage).toContainText("Implementing this also satisfies");
  await expect(leverage).toContainText("AC-2 — Account Management");
  await expect(leverage).toContainText(/\d+ connected requirements?/);
  await expect(leverage).toContainText(/CCIs \/ requirements/);
});

test("leverage rows filter the map to a connected requirement type", async ({
  page,
}) => {
  await page.goto("/#/atlas-map?node=nist-800-53:AU-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const leverage = page.locator(".atlas-leverage");
  await expect(leverage).toBeVisible();
  await expect(leverage).toContainText("AU-2");
  await leverage.locator("button.atlas-leverage-row").first().click();
  await expect(page).toHaveURL(/[?&]type=/);
});
