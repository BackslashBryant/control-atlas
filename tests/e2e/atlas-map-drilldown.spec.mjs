import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("framework choices survive refresh and the rail steps back one generation", async ({
  page,
}) => {
  await page.goto(
    "/#/atlas-map?atlasAxis=framework&atlasFramework=nist-800-53&atlasBaseline=nist-800-53b%3ALOW&atlasFamily=nist-800-53%3AFAMILY-AC",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByLabel("Filter this family")).toBeVisible();
  await expect(page.locator(".tree-path-rail")).toContainText(
    "AtlasNIST SP 800-53LOWFAMILY-AC",
  );

  await page.reload();
  await waitForAppReady(page);
  await expect(page.getByLabel("Filter this family")).toBeVisible({
    timeout: 30000,
  });

  await page
    .locator(".tree-path-rail")
    .getByRole("button", { name: "LOW" })
    .click();
  await expect(
    page.getByText("Which control family do you want to open?"),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/atlasFamily=/);

  await page.goBack();
  await expect(page.getByLabel("Filter this family")).toBeVisible();
});

test("family filtering is local and an empty result explains itself", async ({
  page,
}) => {
  await page.goto(
    "/#/atlas-map?atlasAxis=framework&atlasFramework=nist-800-53&atlasBaseline=nist-800-53b%3ALOW&atlasFamily=nist-800-53%3AFAMILY-AC",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const filter = page.getByLabel("Filter this family");
  await filter.fill("AC-2");
  await expect(page.locator(".atlas-path-record")).not.toHaveCount(0);
  await filter.fill("definitely-not-a-control");
  await expect(page.getByText("No controls match that filter.")).toBeVisible();
});
