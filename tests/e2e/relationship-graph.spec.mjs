import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas standalone route opens the focused canvas with Connections below", async ({ page }) => {
  await page.goto("/#/atlas?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connections", level: 2 })).toBeVisible();
  const focused = page.getByRole("region", { name: "Focused Atlas record" });
  await expect(focused).toBeVisible();
  await expect(focused).toContainText("AC-2");
  await expect(focused).toContainText("Account Management");
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(page.getByRole("table", { name: "Relationship table" })).toBeVisible();
});

test("Atlas default route is the semantic Atlas network, not an empty focused-record graph", async ({ page }) => {
  await page.goto("/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  // The default lens groups the corpus by what each document is, drawn from
  // the same semantic network; publisher and job are the other two groupings
  // of the same 28 publications. The landing is the groups; a publication is
  // one step in.
  const landscape = page.getByTestId("atlas-area-map");
  await expect(landscape).toBeVisible();
  await landscape.getByRole("button", { name: /^Control catalogs/ }).click();
  await expect(landscape.getByRole("button", { name: /^800-53 / }).first()).toBeVisible();
  await page
    .getByRole("navigation", { name: "Map depth" })
    .getByRole("button", { name: "All groups" })
    .click();
  await expect(page.getByRole("region", { name: "Focused Atlas record" })).toHaveCount(0);
  await expect(page.locator(".ca-flow-wrap")).toHaveCount(0);

  // The same corpus, regrouped: switching lens keeps the board and changes
  // what the groups are.
  await page.getByRole("button", { name: "By publisher" }).click();
  const publishers = page.getByTestId("atlas-area-map");
  await expect(publishers).toBeVisible();
  await expect(publishers.locator("button.atlas-area__cell")).toHaveCount(8);
  await expect(publishers.getByRole("button", { name: /^NIST / })).toBeVisible();
});

test("record detail keeps published connections in an accessible list", async ({ page }) => {
  await page.goto(
    "/#/record/nist-800-53/AC-2?relationshipView=list",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-template="E"]')).toBeVisible();
  // Relationship-display governance summarises large groups behind a
  // disclosure; open them before asserting the list is reachable.
  const groups = page.locator("details:has([data-record-connection-id])");
  for (const group of await groups.all()) {
    await group.evaluate((element) => { element.setAttribute("open", ""); });
  }
  await expect(page.locator('[data-record-section="related-records"] ul').first()).toBeVisible();
});

test("record detail leaves the shared relationship graph in Atlas", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2?relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator('[data-template="E"]')).toBeVisible();
  await expect(page.locator(".record-template .react-flow")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See connections", exact: true })).toBeVisible();
});

test("record detail opens the same record in the new Atlas", async ({ page }) => {
  await page.goto("/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("link", { name: "See connections", exact: true }).click();
  await expect(page).toHaveURL(/#\/atlas/);
  await expect(page.getByRole("heading", { name: "Atlas", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Focused Atlas record" })).toContainText("Account Management");
});
