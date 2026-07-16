import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas Map defaults to novice questions and offers purpose and RMF views", async ({ page }) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Source guide" }).click();
  await expect(page).toHaveURL(/node=foundation/);

  await expect(
    page.getByText(
      "Start with the question you are trying to answer. Each path opens the same trusted source model in a more useful order.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Find a control, CCI, baseline, STIG, or source."),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search Atlas Map" }),
  ).toBeVisible();

  const nodes = page.getByRole("group", { name: "Map nodes" }).getByRole("button");
  await expect(nodes).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "Why does this apply?", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "What must I do?", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Map nodes" })
      .getByRole("button", { name: "NIST SP 800-53 Rev. 5", exact: true }),
  ).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Novice questions", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Purpose", exact: true }).click();
  await expect(page).toHaveURL(/sourceView=purpose/);
  await expect(nodes).toHaveCount(9);
  expect(await nodes.allTextContents()).toEqual([
    "Rules",
    "Frameworks",
    "Controls",
    "Baselines",
    "Implementation",
    "Assessment",
    "Mappings",
    "Threat / Defense",
    "Supporting Sources",
  ]);
  await expect(
    page.getByRole("button", { name: "Supporting Sources", exact: true }),
  ).toHaveAttribute("data-deemphasized", "true");

  await page.getByRole("button", { name: "RMF lifecycle", exact: true }).click();
  await expect(page).toHaveURL(/sourceView=rmf/);
  await expect(nodes).toHaveCount(7);
  expect(await nodes.allTextContents()).toEqual([
    "Prepare",
    "Categorize",
    "Select",
    "Implement",
    "Assess",
    "Authorize",
    "Monitor",
  ]);
});

test("Atlas Map search opens a focused control map from the default route", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Source guide" }).click();
  await expect(page).toHaveURL(/node=foundation/);

  await page.getByRole("searchbox", { name: "Search Atlas Map" }).fill("AC-2");
  await page.locator(".atlas-map-command").getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/node=(AC-2|nist-800-53%3AAC-2|nist-800-53:AC-2)/);
  // Coverage matrix now lives in a collapsible drawer (graph-first redesign).
  await page.getByText("Coverage matrix", { exact: true }).click();
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

  // Navigate through the preset menu to the framework map
  await page.getByRole("button", { name: "Source guide" }).click();
  await expect(page).toHaveURL(/node=foundation/);

  await page.getByRole("button", { name: "Purpose", exact: true }).click();

  await page
    .getByRole("group", { name: "Map nodes" })
    .getByRole("button", {
      name: "Controls",
      exact: true,
    })
    .click();

  // Drill view: the layer is the center, its member sources fan out.
  await expect(page).toHaveURL(/node=hierarchy(%3A|:)control-catalog-requirement-set/);
  await expect(
    page.getByRole("heading", {
      name: "Controls",
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

  // Breadcrumb returns to the nine-part purpose overview.
  await page.getByRole("button", { name: "← All purposes" }).click();
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
