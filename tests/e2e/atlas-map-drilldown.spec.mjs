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

function atlas(page) {
  return page.getByTestId("atlas-map");
}

function level(page, key) {
  return atlas(page).locator(`.atlas-decomp__column[data-column="${key}"]`);
}

/** Opens a row in the named level. Every row is a real, labelled button. */
async function open(page, key, name) {
  const row = level(page, key).getByRole("button", { name });
  await expect(row).toBeVisible();
  await row.click();
}

test("the Atlas landing starts with source ecosystems and NIST drills to its publications", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = atlas(page);
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("data-scope-level", "root");

  // Eight publisher ecosystems plus three bounded authority landmarks.
  await expect(level(page, "area")).toHaveAttribute("data-row-count", "11");
  const labels = await level(page, "area")
    .locator(".atlas-decomp__label")
    .allTextContents();
  for (const ecosystem of ["NIST", "DISA", "MITRE", "FedRAMP", "DoD CIO"]) {
    expect(labels, `${ecosystem} row`).toContain(ecosystem);
  }

  await open(page, "area", /^NIST/);
  await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
  await expect(
    level(page, "publication").getByRole("button", { name: /SP 800-53 Rev\. 5 Catalog/ }),
  ).toBeVisible();
});

test("a drilled branch survives refresh and the breadcrumb steps back one generation", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await open(page, "area", /^NIST/);
  await open(page, "publication", /SP 800-53 Rev\. 5 Catalog/);
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");

  await page.reload();
  await waitForAppReady(page);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");

  const trail = page.getByRole("navigation", { name: "Atlas scope" });
  await trail.getByRole("button", { name: "NIST", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
  await expect(page).not.toHaveURL(/atlasFramework=/);

  await page.goBack();
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");
});

test("section drill stays scoped to the publication's real child records", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await open(page, "area", /^NIST/);
  await open(page, "publication", /SP 800-53 Rev\. 5 Catalog/);
  await open(page, "detail", /Access Control/);
  await expect(page).toHaveURL(/atlasFamily=group:nist-800-53:0/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "detail");
  await expect(atlas(page).locator(".atlas-decomp__scope-count")).toHaveText(
    "148 records in view",
  );

  await expect(
    level(page, "record").getByRole("button", { name: /^AC-2 — Account Management/ }),
  ).toBeVisible();
});

test("CMMC detail scope reports all three publisher-native levels", async ({ page }) => {
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await level(page, "area")
    .locator(".atlas-decomp__label")
    .getByText("DoD", { exact: true })
    .click();
  await open(page, "publication", /CMMC 2\.0 Catalog/);
  await open(page, "detail", /CMMC 2\.0 Levels/);

  const records = level(page, "record");
  await expect(records).toHaveAttribute("data-row-count", "3");
  for (const levelId of ["LEVEL-1", "LEVEL-2", "LEVEL-3"]) {
    await expect(records.getByRole("button", { name: new RegExp(`^${levelId} —`) })).toBeVisible();
  }
  await expect(atlas(page).locator(".atlas-decomp__scope-count")).toHaveText(
    "3 records in view",
  );
});
