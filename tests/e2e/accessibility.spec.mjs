import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
  waitForSkeletonsSettled,
} from "./support.mjs";

async function assertNoBlockingViolations(page, contextLabel) {
  const results = await new AxeBuilder({ page })
    .include("#workspace")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact || ""),
  );

  expect(
    blocking,
    `Accessibility violations on ${contextLabel}: ${blocking.map((entry) => `${entry.id} (${entry.impact})`).join(", ")}`,
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  attachPageDiagnostics(page);
});

const ROUTES = [
  { label: "home", path: "/#/" },
  { label: "start here", path: "/#/start" },
  { label: "catalog inventory", path: "/#/catalog" },
  { label: "catalog", path: "/#/catalog/nist-800-53" },
  {
    label: "record detail",
    path: "/#/record/nist-800-53/AC-2",
  },
  { label: "resources", path: "/#/resources" },
  // Deep card grid (opened via a lane) is where badge/tag contrast lives.
  { label: "resources directory", path: "/#/resources?lane=official" },
  {
    label: "resource detail",
    path: "/#/resources/official-nist-sp800-53-r5",
  },
  { label: "retired recovery", path: "/#/retired?q=old-control" },
  { label: "not found recovery", path: "/#/does-not-exist" },
  { label: "explore", path: "/#/explore" },
  {
    label: "focused Atlas Path",
    path: "/#/explore?node=nist-800-53%3AAC-2&relationshipView=path",
  },
  {
    label: "focused Atlas Map",
    path: "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map",
  },
  {
    label: "focused Atlas List",
    path: "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list",
  },
  {
    label: "Atlas zero connections",
    path: "/#/explore?node=csf-2%3ADE.AE-01&relationshipView=map",
  },
  { label: "search", path: "/#/search?q=AC-2" },
  {
    label: "record detail default",
    path: "/#/record/nist-800-53/AC-2",
  },
  {
    label: "record detail graph map",
    path: "/#/record/nist-800-53/AC-2?relationshipView=map",
  },
  {
    label: "record detail graph list",
    path: "/#/record/nist-800-53/AC-2?relationshipView=list",
  },
  { label: "compare hub", path: "/#/compare" },
  {
    label: "compare threat chain",
    path: "/#/compare?workbench=threat-chain&chainCatalog=mitre-attack&chainItem=mitre-attack%3AT1033",
  },
  {
    label: "MITRE record detail",
    path: "/#/record/mitre-attack/T1033",
  },
  { label: "sources registry", path: "/#/sources" },
  { label: "build hub", path: "/#/build" },
  {
    label: "starter document detail",
    path: "/#/build/documents/security_plan_starter",
  },
  { label: "learn hub", path: "/#/learn" },
  { label: "learn detail", path: "/#/learn?pattern=rmf-lifecycle" },
  { label: "about", path: "/#/about" },
];

for (const route of ROUTES) {
  test(`a11y: ${route.label} has no serious or critical violations`, async ({
    page,
  }) => {
    if (route.label === "compare threat chain") {
      test.setTimeout(60_000);
    }
    await gotoApp(page, route.path);
    await waitForAppReady(page, { allowPartial: true });
    await dismissOnboarding(page);
    await assertNoBlockingViolations(page, route.path);
  });
}

test("a11y: compare detailed mappings table has no serious or critical violations", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await gotoApp(
    page,
    "/#/compare?crosswalk=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("combobox", { name: /^Mapping publication/ })
    .selectOption({ label: "NIST CSF 2.0" });
  await page.getByRole("button", { name: "Show mappings" }).click();
  await expect(
    page.getByRole("table", { name: "Relationship mappings" }),
  ).toBeVisible({ timeout: 30_000 });

  const results = await new AxeBuilder({ page })
    .include('table[aria-label="Relationship mappings"]')
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact || ""),
  );

  expect(
    blocking,
    `Accessibility violations on compare detailed mappings: ${blocking.map((entry) => `${entry.id} (${entry.impact})`).join(", ")}`,
  ).toEqual([]);
});

test("a11y: library detail relationship table has no serious or critical violations", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/record/nist-800-53/AC-2?relationshipView=list",
  );
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);
  await waitForSkeletonsSettled(page);

  await expect(
    page.getByRole("table", { name: "Relationship table" }),
  ).toBeVisible();
  await assertNoBlockingViolations(page, "library detail relationship table");
});
