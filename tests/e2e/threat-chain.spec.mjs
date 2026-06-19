import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("threat chain: trace T1033 through D3FEND to NIST controls", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=threat-chain&chainCatalog=mitre-attack&chainItem=mitre-attack%3AT1033",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText("Selected threat chain")).toBeVisible();
  await expect(
    page.getByText("D3FEND countermeasures", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("NIST controls", { exact: true }),
  ).toBeVisible();
});

test("threat chain: library detail links into compare workbench", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=mitre-attack%3AT1033");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("button", {
      name: "Trace this technique to D3FEND and NIST controls",
    })
    .click();
  await expect(page).toHaveURL(/workbench=threat-chain/);
  await expect(page.getByText("Selected threat chain")).toBeVisible();
});
