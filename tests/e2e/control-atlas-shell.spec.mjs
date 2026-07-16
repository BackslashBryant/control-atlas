import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("brand entrance appears once, is dismissible, and hides navigation while visible", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.removeItem("ca_intro_seen"));
  await page.goto("/");
  const entrance = page.getByRole("dialog", {
    name: "Control Atlas introduction",
  });
  await expect(entrance).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeHidden();
  await entrance.press("Escape");
  await expect(entrance).toBeHidden();
  // Home is a calm, chrome-free entrance — the primary nav stays hidden here
  // by design; dismissing the intro reveals the home hero's own controls.
  await expect(
    page.getByRole("button", { name: /^click to start$/i }),
  ).toBeVisible();
  await page.reload();
  await expect(entrance).toHaveCount(0);
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
  // user has gone somewhere else. The center "Click to start" orb goes
  // straight to the guided Start Here flow.
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: /^click to start$/i })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find the best place to start" }),
  ).toBeVisible();
  await page.getByLabel("System type").selectOption("Cloud SaaS");
  await page.getByLabel("Data sensitivity").selectOption("Moderate");
  await page.getByLabel("Operational environment").selectOption("CSP");
  await page.getByRole("button", { name: "Show recommendation" }).click();
  await expect(
    page.getByRole("heading", { name: "Explore", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Templates", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("FedRAMP Rev. 5 Baselines")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Generate Inheritance Worksheet",
      exact: true,
    }),
  ).toBeVisible();

  // Off the home view, the persistent site chrome appears with its three
  // nav groups.
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(primaryNav).toBeVisible();
  // Nav groups are disclosures: plain buttons revealing a container of plain
  // buttons (no ARIA menu roles) — scope item queries to the revealed panel.
  const openGroupMenu = primaryNav.locator(".nav-more-menu");
  const navLabels = await primaryNav
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(navLabels).toEqual(["Search", "Learn", "Navigate", "Build"]);

  await primaryNav.getByRole("button", { name: "Navigate" }).click();
  await expect(openGroupMenu).toBeVisible();
  await expect(
    openGroupMenu.getByRole("button", { name: "Atlas" }),
  ).toBeVisible();

  const navigateMenuLabels = await openGroupMenu
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(navigateMenuLabels).toEqual(["Atlas", "Compare"]);

  await primaryNav.getByRole("button", { name: "Learn", exact: true }).click();
  const researchMenuLabels = await openGroupMenu
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(researchMenuLabels).toEqual(["Start", "Sources", "Playbooks"]);

  await primaryNav.getByRole("button", { name: "Build", exact: true }).click();
  const buildMenuLabels = await openGroupMenu
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(buildMenuLabels).toEqual(["Templates"]);

  await primaryNav.getByRole("button", { name: "Search", exact: true }).click();
  const searchMenuLabels = await openGroupMenu
    .getByRole("button")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
    );
  expect(searchMenuLabels).toEqual(["Search"]);

  // Disclosure keyboard contract (SPR A11Y-002): Escape closes the open
  // group and returns focus to its toggle button.
  await openGroupMenu
    .getByRole("button", { name: "Search", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(openGroupMenu).toHaveCount(0);
  await expect(
    primaryNav.getByRole("button", { name: "Search", exact: true }),
  ).toBeFocused();

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
    dialog.getByRole("searchbox", { name: "Search records and glossary" }),
  ).toBeFocused();
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
  const groupNav = page.getByRole("navigation", { name: "Connection groups" });
  await expect(groupNav).toBeVisible();
  await groupNav.getByRole("button").first().click();
  await expect(page.locator(".relationship-group-trigger").first()).toBeFocused();
  await expect(page.locator(".relationship-card").first()).toBeVisible();
  await expect(page.getByText("Source support", { exact: true })).toBeVisible();
  await expect(page.getByText(/Automatically synchronized/)).toBeVisible();
  await expect(
    page.getByText("What to do next", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
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
  await expect(
    page.getByLabel("Show only items with connections"),
  ).toBeVisible();
  await expect(
    page.locator("#library-results .accordion-trigger").first(),
  ).toBeVisible();
  await page.getByLabel("Show only items with connections").check();
  await expect(
    page.getByText("Loading connection data for this filter"),
  ).toBeHidden({
    timeout: 90000,
  });
  await expect(
    page.getByText("No connections yet", { exact: true }),
  ).toHaveCount(0);
  const firstCard = page.locator("#library-results .result-card").first();
  await expect(
    firstCard.getByRole("button", { name: "Open record" }),
  ).toBeVisible();
  await expect(
    firstCard.getByRole("button", { name: "More actions" }),
  ).toBeVisible();
});

test("explore explains when the connections-only filter removes every record", async ({
  page,
}) => {
  await page.goto("/?view=explore&q=LEVEL-1");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("Show only items with connections").check();
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
  await expect(chainPanel.getByText("Official link").first()).toBeVisible();
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
      name: "Review sources before you rely on a match",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refine sources" }).click();
  await page.getByLabel("Included in map").selectOption("excluded");
  await page.getByRole("button", { name: /Federal referenced/i }).click();
  const communityCard = page
    .locator(".source-card")
    .filter({ hasText: "Community CCI Research" });
  await expect(communityCard).toBeVisible();
  await expect(
    communityCard.getByText(
      "This source is not used in the public map by default.",
    ),
  ).toBeVisible();
  await expect(communityCard).toContainText("Official link only");
  await communityCard
    .getByRole("button", { name: "View source details" })
    .click();
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
    page.getByRole("heading", { name: "What are you trying to create?" }),
  ).toBeVisible();
  await page.locator(".intent-card").first().click();
  await expect(page.getByText("What this template is for")).toBeVisible();
  await expect(page.getByText("What it includes")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "More options" }),
  ).toBeVisible();

  await page.goto("/?view=playbooks");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Compliance playbooks" }),
  ).toBeVisible();
  await page.locator(".intent-card").first().click();
  await expect(page.getByText("Purpose")).toBeVisible();
  await expect(
    page.getByText("Common mistakes", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Next action", { exact: true })).toBeVisible();
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
        name: "Where would you like to start?",
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
  await page.getByRole("button", { name: "Start here" }).click();
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
    page.getByRole("button", { name: "Review the Sources registry" }),
  ).toBeVisible();
});
