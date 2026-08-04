import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("the Explore landing shows nine areas, none of them a dead end, and an area opens its publications", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/explore");
  await waitForAppReady(page);

  // The root is now an actual semantic hierarchy: authority roots feed
  // Cybersecurity and the nine areas, with every area remaining actionable.
  await expect(page.getByRole("application", { name: "Interactive Control Atlas hierarchy" })).toBeVisible();
  await expect(page.locator(".atlas-universe__area")).toHaveCount(9);
  await expect(page.locator(".atlas-universe__area[disabled]")).toHaveCount(0);
  await expect(page.getByText("Not yet loaded")).toHaveCount(0);

  // An area with publications splits in place instead of abandoning the map.
  await page.getByRole("button", { name: /Compliance/ }).click();
  await expect(page.locator('[data-semantic-level="publications"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: /SP 800-53 Rev\. 5/ }),
  ).toBeVisible();
});

test("framework choices survive refresh and the rail steps back one generation", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoApp(
    page,
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
  test.setTimeout(120_000);
  await gotoApp(
    page,
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
