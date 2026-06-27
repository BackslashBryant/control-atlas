import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas Map starts with nine ordered source categories", async ({ page }) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByText("Explore the compliance ecosystem."),
  ).toBeVisible();
  await expect(
    page.getByText("Find a control, CCI, baseline, STIG, or source."),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search Atlas Map" }),
  ).toBeVisible();

  const nodes = page.getByRole("group", { name: "Map nodes" }).getByRole("button");
  await expect(nodes).toHaveCount(9);
  await expect(page.getByRole("button", { name: "Authority", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Governance / Risk Framework",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Control Catalog / Requirement Set",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Map nodes" })
      .getByRole("button", { name: "NIST SP 800-53 Rev. 5", exact: true }),
  ).toHaveCount(0);

  const authorityRank = Number(
    await page.getByRole("button", { name: "Authority", exact: true }).getAttribute("data-layout-rank"),
  );
  const governanceRank = Number(
    await page
      .getByRole("button", { name: "Governance / Risk Framework", exact: true })
      .getAttribute("data-layout-rank"),
  );
  const catalogRank = Number(
    await page
      .getByRole("button", {
        name: "Control Catalog / Requirement Set",
        exact: true,
      })
      .getAttribute("data-layout-rank"),
  );
  expect(authorityRank).toBeLessThan(governanceRank);
  expect(governanceRank).toBeLessThan(catalogRank);
  await expect(
    page.getByRole("button", { name: "Supporting Reference", exact: true }),
  ).toHaveAttribute("data-deemphasized", "true");
});

test("Atlas Map search opens a focused control map from the default route", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("searchbox", { name: "Search Atlas Map" }).fill("AC-2");
  await page.getByRole("button", { name: "Open map" }).click();

  await expect(page).toHaveURL(/node=(AC-2|nist-800-53%3AAC-2|nist-800-53:AC-2)/);
  const matrix = page.getByRole("table", { name: "Atlas coverage matrix" });
  await expect(matrix).toBeVisible();
  await expect(matrix).toContainText("AC-2");
});

test("selecting a source category links the graph node to the coverage matrix", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("button", {
      name: "Control Catalog / Requirement Set",
      exact: true,
    })
    .click();

  const matrix = page.getByRole("table", { name: "Atlas coverage matrix" });
  await expect(matrix).toBeVisible();
  const selectedRow = matrix.locator('tbody tr[aria-selected="true"]');
  await expect(selectedRow).toContainText("Control Catalog / Requirement Set");
});
