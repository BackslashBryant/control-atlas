import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("brand entrance is immediate and does not interrupt the user", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Control Atlas introduction" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start here" })).toBeVisible();
  const flourishKeys = page.locator(".landing-hero .brand-key");
  await expect(flourishKeys).toHaveCount(3);
  await expect(flourishKeys.nth(0)).toHaveText("Ctrl");
  await expect(flourishKeys.nth(1)).toHaveText("Alt");
  const flourish = page.locator(".landing-hero .brand-key-word");
  await expect(flourish).toHaveText("Comply");
  await expect(flourish).toHaveText("Map", { timeout: 4000 });
});

test("reduced motion bypasses the brand entrance without an artificial hold", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.removeItem("ca_intro_seen"));
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Control Atlas introduction" }),
  ).toHaveCount(0);
  await context.close();
});

test("control atlas map-first shell exposes navigation and guided start path", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAppReady(page);

  await expect(page).toHaveTitle(/Control Atlas/);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();

  // Home is a calm, chrome-free entrance (its own wordmark/search/buttons
  // cover navigation there) — the persistent primary nav is hidden until the
  // user has gone somewhere else. The primary action goes to Start Here.
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Start here" }).click();
  await expect(
    page.getByRole("heading", { name: "Find the best place to start" }),
  ).toBeVisible();
  await page.getByLabel("System type").selectOption("Cloud SaaS");
  await page.getByLabel("Data sensitivity").selectOption("Moderate");
  await page.getByLabel("Operational environment").selectOption("CSP");
  await page.getByRole("button", { name: "Show recommendation" }).click();
  await expect(
    page.getByText("Recommended next step", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("FedRAMP Rev. 5 Baselines", { exact: true })).toBeVisible();
  await expect(page.getByText(/Related guides, documents, and comparisons/)).toBeVisible();

  // Off the home view, the persistent site chrome exposes recognizable
  // destinations directly instead of hiding them in category dropdowns.
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(primaryNav).toBeVisible();
  const navLabels = await primaryNav
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(navLabels).toEqual([
    "Atlas",
    "Library",
    "Compare",
    "Commons",
    "Guides",
    "Documents",
  ]);

  await primaryNav.getByRole("button", { name: "Compare" }).click();
  await expect(page).toHaveURL(/view=matrix|#\/compare/);
  await expect(
    primaryNav.getByRole("button", { name: "Compare" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Start here" })).toBeVisible();

  // Clicking the brand button returns to the calm home entrance, which
  // hides the chrome again.
  await page.getByRole("button", { name: "Control Atlas" }).click();
  await expect(page).toHaveURL(/#\/?$|\/$/);
  await expect(primaryNav).toBeHidden();
});

test("visible search trigger opens the global search dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // The header search trigger lives in the persistent site chrome, which is
  // hidden on the calm home entrance — exercise it from a page where it's
  // actually visible.
  await page.goto("/?view=explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Open search" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("searchbox", { name: "Search records" }),
  ).toBeFocused();
});

test("Control Commons renders its compiled utility layout", async ({ page }) => {
  await page.goto("/#/commons");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Control Commons", exact: true }),
  ).toBeVisible();

  const commonsSurface = page.locator("div.min-h-screen.bg-\\[var\\(--ca-bg\\)\\]");
  await expect(commonsSurface).toHaveCount(1);
  await expect(commonsSurface).toHaveCSS("padding-bottom", "64px");

  // Shallow-to-deep: the full resource grid opens on intent. Reveal it, then
  // confirm a resource's Details still routes to the detail view.
  await page
    .getByRole("button", { name: /browse all \d+ resources/i })
    .click();
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page).toHaveURL(/#\/commons-detail\?id=/);
  await expect(
    page.getByRole("button", { name: "Back to Commons Hub" }),
  ).toBeVisible();
});

test("mobile navigation covers the page and closes predictably", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?view=about");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const toggle = page.getByRole("button", { name: "Open navigation menu" });
  await toggle.click();

  const sheet = page.locator("#mobile-nav-sheet");
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("button", { name: "Library", exact: true }),
  ).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const coverage = await sheet.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const background = globalThis.getComputedStyle(node).backgroundColor;
    return { bottom: box.bottom, background };
  });
  expect(coverage.bottom).toBeGreaterThanOrEqual(843);
  expect(coverage.background).toBe("rgb(15, 23, 42)");

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("library detail deep links stay compatible and keep advanced details collapsed by default", async ({
  page,
}) => {
  await page.goto("/?view=library-detail&node=nist-800-53%3AAC-2&mode=expert");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/record\/nist-800-53\/AC-2|library-detail/);
  await expect(
    page.getByRole("heading", {
      name: "AC-2 — Account Management",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("What this is")).toBeVisible();
  await expect(page.getByText("Where it appears")).toBeVisible();
  await expect(
    page.getByText("Connections", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open in Atlas Map" }).first(),
  ).toBeVisible();
  await expect(page.locator(".relationship-card")).toHaveCount(0);
  const firstGroup = page.locator(".relationship-group-trigger").first();
  await expect(firstGroup).toBeVisible();
  await firstGroup.click();
  await expect(page.locator(".relationship-group-trigger").first()).toBeFocused();
  await expect(page.locator(".relationship-card").first()).toBeVisible();
  const siteHeaderBox = await page.locator(".site-header").boundingBox();
  const connectionGroupBox = await page.locator(".relationship-groups-accordion .accordion-item").first().boundingBox();
  expect(siteHeaderBox).not.toBeNull();
  expect(connectionGroupBox).not.toBeNull();
  expect(connectionGroupBox.y).toBeGreaterThanOrEqual(
    siteHeaderBox.y + siteHeaderBox.height - 1,
  );
  await expect(page.getByText("Source support", { exact: true })).toBeVisible();
  await expect(page.getByText(/Automatically synchronized/)).toBeVisible();
  await expect(
    page.getByText("What to do next", { exact: true }),
  ).toBeVisible();
  // Secondary record actions now sit behind one "More actions" affordance so
  // the record opens with a single obvious next step.
  await expect(page.getByRole("button", { name: "Copy link" })).toHaveCount(0);
  await page.locator("details.record-actions-menu > summary").click();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(
    page.locator("#app").getByRole("button", { name: "Compare" }),
  ).toBeVisible();
  await expect(page.getByText("Official text / source excerpt")).toBeVisible();
  await expect(page.getByText("Source location")).not.toBeVisible();
  await page.getByRole("button", { name: "Advanced details" }).click();
  await expect(page.getByText("Source location")).toBeVisible();
});

test("explore filters narrow results without a page reload", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Search everything in one place" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refine results" }).click();
  await page.getByLabel("Item type").selectOption("control");
  await expect(page.locator("#library-results .result-card")).toHaveCount(1);
  await expect(page.locator("#library-results")).toContainText(
    "Account Management",
  );
});

test("explore groups results and filters out records without connections", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=account");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "Refine results" }).click();
  await expect(
    page.getByLabel("Only show items with published connections"),
  ).toBeVisible();
  await expect(
    page.locator("#library-results .accordion-trigger").first(),
  ).toBeVisible();
  await page.getByLabel("Only show items with published connections").check();
  await expect(
    page.getByText("Loading connection data for this filter"),
  ).toBeHidden({
    timeout: 90000,
  });
  await expect(
    page.getByText("No connections yet", { exact: true }),
  ).toHaveCount(0);
  const firstCard = page.locator("#library-results .result-card").filter({
    has: page.locator(".result-actions-menu"),
  }).first();
  await expect(
    firstCard.locator(".card-title-action"),
  ).toBeVisible();
  await expect(
    firstCard.getByText("Compare, map, or export"),
  ).toBeVisible();
});

test("explore explains when the connections-only filter removes every record", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=DE.AE-01");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Refine results" }).click();
  await page.getByLabel("Only show items with published connections").check();
  await expect(
    page.getByText("Loading connection data for this filter"),
  ).toBeHidden({ timeout: 90000 });
  await expect(
    page.getByRole("heading", { name: "No matching connected records found." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show all matching records" }),
  ).toBeVisible();
});

test("template advanced options stay collapsed until requested", async ({
  page,
}) => {
  await page.goto("/?view=templates&templateType=security_plan_starter");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByLabel("Framework")).not.toBeVisible();
  await page.getByRole("button", { name: "More options" }).click();
  await expect(page.getByLabel("Framework")).toBeVisible();
});

test("compare starts with intent cards and opens summary-first framework results", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "What do you want to compare?" }),
  ).toBeVisible();
  await expect(page.locator("#compare-results")).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole("heading", { name: "Shared mappings", level: 3 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Map", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "List", exact: true }),
  ).toBeVisible();
  await page
    .locator("#compare-results details.export-disclosure summary")
    .click();
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export JSON", exact: true }),
  ).toBeVisible();
  const mappingsTable = page.getByRole("table", {
    name: "Relationship mappings",
  });
  await expect(mappingsTable).toBeVisible({ timeout: 15000 });
  await expect(mappingsTable).toContainText("AC-2");
  await expect(mappingsTable).toContainText("Plain-language rationale");
});

test("compare stig chain traces DISA items through CCI to NIST controls", async ({
  page,
}) => {
  await page.goto("/?view=matrix");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "STIG/SRG to controls" }).click();
  await expect(page.locator("#field-catalog")).toBeVisible();
  const itemSelect = page.getByLabel("STIG or SRG item");
  const firstTraceableItem = await itemSelect
    .locator("option")
    .nth(1)
    .getAttribute("value");
  expect(firstTraceableItem).toBeTruthy();
  await itemSelect.selectOption(firstTraceableItem || "");
  await expect(page.getByText("Selected chain")).toBeVisible({
    timeout: 15000,
  });
  const chainPanel = page.locator(".chain-grid");
  await expect(
    chainPanel.getByText("CCI links", { exact: true }),
  ).toBeVisible();
  await expect(
    chainPanel.getByText("NIST controls", { exact: true }),
  ).toBeVisible();
  await expect(chainPanel.getByText("Published mapping").first()).toBeVisible();
  await page
    .locator(".compare-results-panel details.export-disclosure summary")
    .click();
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
});

test("compare baselines shows delta controls and source versions", async ({
  page,
}) => {
  await page.goto("/?view=matrix&workbench=baseline-compare");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByLabel("Baseline A").selectOption("nist-800-53b:LOW");
  await page.getByLabel("Baseline B").selectOption("nist-800-53b:MODERATE");
  await expect(page.getByText("Baseline A:").first()).toBeVisible();
  await expect(page.getByText("Baseline B:").first()).toBeVisible();
  await expect(page.getByText("Shared controls").first()).toBeVisible();
  await expect(
    page.getByText("Only in B", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".chain-grid")).toContainText("AC-");
  await page.locator("details.export-disclosure summary").click();
  await expect(
    page.getByRole("button", { name: "Export Markdown", exact: true }),
  ).toBeVisible();
});

test("sources, templates, and playbooks follow trust-first, artifact-first, and outcome-first flows", async ({
  page,
}) => {
  await page.goto("/?view=sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", {
      name: "Where the data comes from",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refine sources", exact: true }).click();
  await page.getByLabel("Included in map").selectOption("excluded");
  await page.getByRole("button", { name: /Federal referenced/i }).click();
  const communityCard = page
    .locator(".source-card")
    .filter({ hasText: "Community CCI Research" });
  await expect(communityCard).toBeVisible();
  await expect(
    communityCard.getByText(
      "This source is linked for reference; its records are not imported into Atlas connections.",
    ),
  ).toBeVisible();
  await expect(communityCard).toContainText("Official link only");
  await communityCard.locator(".card-title-action").click();
  await expect(
    page.getByText("How Control Atlas uses it", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Trust and status", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advanced metadata" }).click();
  await expect(page.getByText("Update model", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Official link only — not hosted by Control Atlas"),
  ).toBeVisible();

  await page.goto("/?view=templates");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "What do you need to get done?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Build an authorization package/i })
    .click();
  await page.getByText("Official sources and tools for this task", { exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: /Official resources for Build an authorization package/i,
    }),
  ).toBeVisible();
  await page.locator("#companion-templates .intent-grid button").first().click();
  await expect(page.getByText("What this template is for")).toBeVisible();
  await expect(page.getByText("What it includes")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "More options" }),
  ).toBeVisible();

  await page.goto("/?view=playbooks");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Guides for common compliance jobs" }),
  ).toBeVisible();
  await page.locator(".intent-grid button").first().click();
  await expect(page.getByText("Use this when", { exact: true })).toBeVisible();
  await expect(page.getByText("What to do", { exact: true })).toBeVisible();
  await expect(
    page.getByText("What to avoid", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Limits of this guide", { exact: true })).toBeVisible();
  await expect(page.getByText("Next action", { exact: true })).toBeVisible();
});

test("playbook copy names the decision, next record, and recovery action", async ({
  page,
}) => {
  await page.goto("/?view=playbooks&pattern=common-control-provider");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", {
      name: "Providing Controls Other Systems Can Inherit",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Define which controls a shared service owns, what evidence it provides, and what each customer system still owns.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Control Atlas companion")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Inheritance Worksheet", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Open PL-2 in Atlas" })).toBeVisible();

  await page.getByRole("button", { name: "Back to playbooks" }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("not-a-real-playbook");
  await expect(page.getByText("No playbooks match this search and category.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".intent-grid button").first()).toBeVisible();
});

test("FedRAMP workbench distinguishes current rules from the complete legacy library", async ({
  page,
}) => {
  await page.goto("/?view=templates");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("button", { name: /Build an authorization package/i })
    .click();
  await page.getByText("Official sources and tools for this task", { exact: true }).click();

  await expect(
    page.getByRole("heading", {
      name: "Consolidated Rules 2026.07.14.01",
    }),
  ).toBeVisible();
  await expect(page.getByText("16 stable process documents")).toBeVisible();
  await expect(
    page.getByText(/Only 1 process is marked placeholder: AGU/),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Browse complete official catalog" })
    .click();

  const showAll = page.getByRole("button", {
    name: /Show all \d+ official resources/,
  });
  if (await showAll.isVisible()) await showAll.click();
  const legacyCard = page
    .locator(".nexus-card")
    .filter({ hasText: "FedRAMP Legacy Assets Combined Archive" });
  await expect(legacyCard).toBeVisible();
  await legacyCard
    .getByText("Browse all 27 official legacy files", { exact: true })
    .click();
  await expect(legacyCard.locator(".fedramp-legacy-index li")).toHaveCount(27);
  await expect(legacyCard.getByText("Legacy → current")).toBeVisible();
});

test("legacy view query redirects to hash route on boot", async ({ page }) => {
  await page.goto("/?view=atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/atlas-map/);
  await expect(
    page
      .locator("main")
      .getByRole("heading", {
        name: "Control Atlas",
        level: 1,
      }),
  ).toBeVisible();
});

test("hash deep route survives refresh on built site", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Search everything in one place" }),
  ).toBeVisible();
  await page.reload();
  // Mirror the pre-reload order: wait for the app to finish booting (the
  // explore route requires the full graph chunk, which is slow to reload on a
  // cold CI runner) before interacting or asserting. Doing this in the reverse
  // order races the cold load and intermittently blocks the Pages deploy.
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/explore/);
  await expect(
    page.getByRole("heading", { name: "Search everything in one place" }),
  ).toBeVisible({
    timeout: 15000,
  });
});

test("unknown hash routes render an honest not-found view with recovery actions", async ({
  page,
}) => {
  await page.goto("/#/total-nonsense-xyz");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to Home" })).toBeVisible();
  await page.getByText("Try another path", { exact: true }).click();
  await page.locator("#app").getByRole("button", { name: "Start here" }).click();
  await expect(page).toHaveURL(/#\/start/);
  await expect(
    page.getByRole("heading", { name: "Find the best place to start" }),
  ).toBeVisible();
});

test("explore search is route-derived and survives refresh", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  const input = page.getByRole("searchbox", {
    name: "Search by ID, title, or topic",
  });
  await input.fill("account management");
  await input.press("Enter");
  await expect(page).toHaveURL(/[?&]q=account/);
  await page.reload();
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/[?&]q=account/);
  await expect(
    page.getByRole("searchbox", { name: "Search by ID, title, or topic" }),
  ).toHaveValue("account management");
});

test("release-readiness content stays calm, progressive, and de-duplicated", async ({
  page,
}) => {
  test.setTimeout(90_000);

  await page.goto("/#/explore");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator(".search-result-groups")).toHaveCount(0);
  await expect(
    page.getByText(
      "Search controls, baselines, CCIs, STIGs, terms, starter templates, and official resources.",
    ),
  ).toBeVisible();

  const search = page.getByRole("searchbox", {
    name: "Search by ID, title, or topic",
  });
  await search.fill("how do I control user accounts");
  await search.press("Enter");
  await expect(page.locator(".search-result-groups")).toBeVisible();
  await expect(page.locator(".result-card h3").first()).toContainText("AC-2");

  await page.goto("/#/templates");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Start with a compliance task" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Official federal resources" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Starter documents" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Build an authorization package/i })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /Official resources for Build an authorization package/i,
    }),
  ).toHaveCount(0);
  await page.getByText("Official sources and tools for this task", { exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: /Official resources for Build an authorization package/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Starter documents" }),
  ).toBeVisible();

  await page.goto("/#/playbooks");
  await waitForAppReady(page);
  await expect(
    page.getByText("What Your Cloud Provider Owns vs What You Own", {
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    page.getByText("Reusing Prior Authorization Work", { exact: true }),
  ).toHaveCount(1);

  const footer = page.locator("footer");
  await expect(
    footer.getByText("See how federal cybersecurity requirements connect."),
  ).toBeVisible();
  await expect(
    footer.getByText(
      "Control Atlas is an open-source reference tool. It does not replace official guidance. Not an official government system.",
      { exact: true },
    ),
  ).toHaveCount(1);
});

test("footer about link opens the trust page with full disclaimer", async ({
  page,
}) => {
  await page.goto("/#/search");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.getByRole("link", { name: "About & trust" }).click();
  await expect(page).toHaveURL(/\/about/);
  await expect(
    page.getByRole("heading", { name: "What Control Atlas is — and is not" }),
  ).toBeVisible();
  await expect(
    page.locator("main").getByText("not an official government system"),
  ).toBeVisible();
  await expect(
    page.locator("main").getByText("reference aids based on public sources"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review sources" }),
  ).toBeVisible();
});
