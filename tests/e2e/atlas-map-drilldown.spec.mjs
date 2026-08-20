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

async function openLandmarkList(page) {
  const list = page.locator(".atlas-network-list");
  if (!(await list.evaluate((element) => element.open))) {
    await list.locator("summary").click();
  }
  return list;
}

async function clickLandmark(page, name) {
  const list = await openLandmarkList(page);
  const node = list.getByRole("button", { name });
  await expect(node).toBeVisible();
  await node.dispatchEvent("click");
}

test("the Atlas landing shows nine honest areas and a populated area drills to its publications", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);

  await dismissOnboarding(page);
  const landscape = page.getByTestId("atlas-network");
  await expect(landscape).toBeVisible();
  await expect(landscape).toHaveAttribute("data-projection-level", "landscape");
  await expect(
    landscape.locator(".atlas-network-list button", { hasText: /Area ·/ }),
  ).toHaveCount(9);

  await clickLandmark(page, /Compliance Area/);
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  const publications = await openLandmarkList(page);
  await expect(
    publications.getByRole("button", {
      name: /SP 800-53 Rev\. 5 Catalog/,
    }),
  ).toBeVisible();
});

test("a canvas branch survives refresh and its breadcrumb steps back one generation", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await clickLandmark(page, /Compliance Area/);
  await clickLandmark(page, /SP 800-53 Rev\. 5 Catalog/);
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  const location = page.getByRole("navigation", { name: "Atlas location" });
  await expect(location).toBeVisible();
  await expect(page.getByTestId("atlas-network")).toHaveAttribute(
    "data-projection-level",
    "publication",
  );

  await page.reload();
  await waitForAppReady(page);
  await expect(page.getByTestId("atlas-network")).toHaveAttribute(
    "data-projection-level",
    "publication",
  );

  await location.getByRole("button", { name: "Up one level" }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas:LIMB-COMPLIANCE/);
  await expect(page).not.toHaveURL(/atlasFramework=/);

  await page.goBack();
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(page.getByTestId("atlas-network")).toHaveAttribute(
    "data-projection-level",
    "publication",
  );
});

test("family drill stays scoped to the publication's real child records", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await clickLandmark(page, /Compliance Area/);
  await clickLandmark(page, /SP 800-53 Rev\. 5 Catalog/);
  await clickLandmark(page, /Access Control/);
  await expect(page).toHaveURL(/atlasFamily=group:nist-800-53:0/);
  await expect(page.getByTestId("atlas-network")).toHaveAttribute(
    "data-projection-level",
    "detail",
  );
  const records = await openLandmarkList(page);
  await expect(
    records.getByRole("button", {
      name: /^AC-2 — Account Management /,
    }),
  ).toBeVisible();
});
