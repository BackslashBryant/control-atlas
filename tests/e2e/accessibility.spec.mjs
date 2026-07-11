import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
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
  attachPageDiagnostics(page);
});

const ROUTES = [
  { label: "home", path: "/" },
  { label: "atlas map", path: "/?view=atlas-map" },
  { label: "explore search", path: "/?view=explore&q=AC-2" },
  {
    label: "library detail",
    path: "/?view=library-detail&node=nist-800-53%3AAC-2",
  },
  {
    label: "library detail graph map",
    path: "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=map",
  },
  {
    label: "library detail graph list",
    path: "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=list",
  },
  { label: "compare hub", path: "/?view=matrix" },
  {
    label: "compare threat chain",
    path: "/?view=matrix&workbench=threat-chain&chainCatalog=mitre-attack&chainItem=mitre-attack%3AT1033",
  },
  {
    label: "library mitre detail",
    path: "/?view=library-detail&node=mitre-attack%3AT1033",
  },
  { label: "sources registry", path: "/?view=sources" },
  { label: "templates hub", path: "/?view=templates" },
  {
    label: "template detail",
    path: "/?view=templates&templateType=security_plan_starter",
  },
  { label: "playbooks hub", path: "/?view=playbooks" },
  { label: "playbook detail", path: "/?view=playbooks&pattern=rmf-lifecycle" },
  { label: "start here", path: "/?view=start-here" },
  { label: "about", path: "/?view=about" },
];

for (const route of ROUTES) {
  test(`a11y: ${route.label} has no serious or critical violations`, async ({
    page,
  }) => {
    if (route.label === "compare threat chain") {
      test.setTimeout(60_000);
    }
    await gotoApp(page, route.path);
    await waitForAppReady(page);
    await dismissOnboarding(page);
    await assertNoBlockingViolations(page, route.path);
  });
}

test("a11y: compare detailed mappings table has no serious or critical violations", async ({
  page,
}) => {
  // This scan already ran 78-90s on a clean baseline before any of this
  // session's CSS changes (axe-core against a large table); the CSS fix in
  // this diff adds marginal global-stylesheet overhead that reproducibly
  // tipped it over the old 90s cap in 3/3 runs. Assertion is unchanged.
  test.setTimeout(120_000);
  await gotoApp(
    page,
    "/?view=matrix&workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator("#compare-results")).toBeVisible({
    timeout: 60000,
  });
  await expect(
    page.getByRole("table", { name: "Relationship mappings" }),
  ).toBeVisible();

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
    "/?view=library-detail&node=nist-800-53%3AAC-2&relationshipView=table",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("table", { name: "Relationship table" }),
  ).toBeVisible();
  await assertNoBlockingViolations(page, "library detail relationship table");
});
