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
    page.getByText(
      "Nine layers make up federal cyber compliance. Select a layer to open it and see the sources inside.",
    ),
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

test("selecting a layer drills into its sources and back", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button", {
      name: "Control Catalog / Requirement Set",
      exact: true,
    })
    .click();

  // Drill view: the layer is the center, its member sources fan out.
  await expect(page).toHaveURL(/node=hierarchy(%3A|:)control-catalog-requirement-set/);
  await expect(
    page.getByRole("heading", {
      name: "Control Catalog / Requirement Set",
      level: 1,
    }),
  ).toBeVisible();
  const drillNodes = page
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button");
  await expect(
    drillNodes.filter({ hasText: "NIST SP 800-53 Rev. 5" }).first(),
  ).toBeVisible();

  // Selecting a source shows its plain-language detail card.
  await drillNodes.filter({ hasText: "NIST SP 800-53 Rev. 5" }).first().click();
  const detail = page.getByRole("complementary", { name: "Selected source" });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText("NIST");
  await expect(
    detail.getByRole("link", { name: /Open official source/ }),
  ).toBeVisible();

  // Breadcrumb returns to the nine-layer overview.
  await page.getByRole("button", { name: "← All layers" }).click();
  await expect(
    page.getByRole("group", { name: "Map nodes" }).getByRole("button"),
  ).toHaveCount(9);
});

test("drilling into a mapped source continues to its runtime records", async ({
  page,
}) => {
  await page.goto("/#/atlas-map?node=hierarchy%3Abaseline-overlay-program-profile");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const drillNodes = page
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button");
  await drillNodes
    .filter({ hasText: "FedRAMP Rev. 5 Baselines" })
    .first()
    .click();

  const detail = page.getByRole("complementary", { name: "Selected source" });
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Explore its records" }).click();

  await expect(page).toHaveURL(/node=fedramp-rev5(%3A|:)HIGH/);
});
