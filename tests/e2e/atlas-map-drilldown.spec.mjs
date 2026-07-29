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
    "/#/explore?atlasAxis=framework&atlasFramework=nist-800-53&atlasBaseline=nist-800-53b%3ALOW&atlasFamily=nist-800-53%3AFAMILY-AC",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByLabel("Filter this family")).toBeVisible();
  await expect(page).toHaveURL(/atlasBaseline=/);
  await expect(
    page.getByText(/shown by this optional baseline filter/i),
  ).toBeVisible();
  await expect(page.locator(".atlas-choice-trail")).toContainText(
    "ExploreSP 800-53 Rev. 5 CatalogAccess Control",
  );
  await expect(page.locator(".atlas-choice-trail")).not.toContainText("LOW");

  await page.reload();
  await waitForAppReady(page);
  await expect(page.getByLabel("Filter this family")).toBeVisible({
    timeout: 30000,
  });

  await page
    .locator(".atlas-choice-trail")
    .getByRole("button", { name: "SP 800-53 Rev. 5 Catalog" })
    .click();
  await expect(
    page.getByText(
      "Optional display filter: which published baseline selection should narrow the records?",
    ),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/atlasFamily=/);
  await expect(page).not.toHaveURL(/atlasBaseline=/);

  await page.goBack();
  await expect(page.getByLabel("Filter this family")).toBeVisible();
});

test("family filtering is local and an empty result explains itself", async ({
  page,
}) => {
  await page.goto(
    "/#/explore?atlasAxis=framework&atlasFramework=nist-800-53&atlasFamily=nist-800-53%3AFAMILY-AC",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const filter = page.getByLabel("Filter this family");
  await filter.fill("AC-2");
  await expect(page.locator(".atlas-path-record")).not.toHaveCount(0);
  await filter.fill("definitely-not-a-control");
  await expect(
    page.getByText("No structural children match that filter."),
  ).toBeVisible();
});
