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

async function openCompare(page, route = "/#/compare") {
  await gotoApp(page, route);
  await waitForAppReady(page);
  await dismissOnboarding(page);
}

test("Compare opens as the Orbital three-stage Frameworks flow", async ({
  page,
}) => {
  await openCompare(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "Compare" }),
  ).toBeVisible();
  await expect(page.locator(".page-header-eyebrow")).toHaveText(
    "PUBLISHED CROSSWALKS / 24 COMPARABLE PAIRS",
  );
  await expect(page.locator(".page-summary")).toHaveText(
    "See how frameworks connect using published crosswalks.",
  );

  const modes = page.getByRole("tablist", { name: "Comparison mode" });
  await expect(modes.getByRole("tab", { name: "Frameworks" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    modes.getByRole("tab", { name: "Specific item" }),
  ).toHaveAttribute("aria-selected", "false");

  const progress = page.getByRole("navigation", { name: "Step progress" });
  await expect(progress.locator("li")).toHaveCount(3);
  await expect(progress.locator("li")).toHaveText([
    /01 \/ Source/,
    /02 \/ Target/,
    /03 \/ Results/,
  ]);
  await expect(progress.locator('[aria-current="step"]')).toContainText(
    "01 / Source",
  );

  await expect(
    page.getByRole("heading", { level: 2, name: "Choose a framework" }),
  ).toBeVisible();
  const source = page.getByRole("combobox", { name: "Publication" });
  await expect(source).toBeVisible();
  await expect(source).toHaveAttribute("list", /-options$/);
  await expect(page.getByLabel("Target publication")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 2, name: "Nothing selected yet" }),
  ).toBeVisible();

  // Setup stays mission-level: no future field, evidence chooser, systems
  // controls, or legacy card chooser is mounted before the user earns it.
  await expect(page.getByText("Crosswalk source", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Refine results", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Source basis", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Trust level", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/candidate|inferred/i)).toHaveCount(0);
  await expect(page.locator(".intent-card")).toHaveCount(0);
  await expect(page.locator("#compare-workspace.panel")).toHaveCount(0);

  // A publication with no published crosswalk partner cannot be selected.
  const listId = await source.getAttribute("list");
  await expect(page.locator(`#${listId} option[value="DoD AI Assurance"]`)).toHaveCount(0);

  const specificItem = modes.getByRole("tab", { name: "Specific item" });
  await specificItem.focus();
  await expect(specificItem).toBeFocused();
  await specificItem.press("Enter");
  await expect(specificItem).toHaveAttribute("aria-selected", "true");
  const frameworks = modes.getByRole("tab", { name: "Frameworks" });
  await frameworks.focus();
  await frameworks.press("Enter");
  await expect(frameworks).toHaveAttribute("aria-selected", "true");
});

test("Frameworks reveals connected targets and a two-column published result", async ({
  page,
}) => {
  await openCompare(page);

  await page.getByRole("combobox", { name: "Publication" }).fill(
    "SP 800-53 Rev. 5",
  );
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Choose a framework to compare with",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Step progress" })
      .locator('[aria-current="step"]'),
  ).toContainText("02 / Target");

  const support = page.locator(".compare-flow-support");
  await expect(support).toContainText("SP 800-53 Rev. 5");
  await expect(support).toContainText(/\d+ connected publications/);

  const target = page.getByLabel("Target publication");
  await expect(target).toBeVisible();
  await expect(target.locator('option[value="csf-2"]')).toHaveText("NIST CSF 2.0");
  await expect(target.locator('option[value="dod-rai"]')).toHaveCount(0);
  await target.selectOption("csf-2");
  await page.getByRole("button", { name: "Show published mappings" }).click();

  await expect(page.locator("#compare-results")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#compare-results h2")).toContainText(
    "SP 800-53 Rev. 5 ↔ NIST CSF 2.0",
  );
  await expect(page.locator(".compare-mapping-total")).toHaveText(
    "746 published mappings",
  );

  const table = page.getByRole("table", { name: "Published crosswalk mappings" });
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveText(["From", "Maps to"]);
  await expect(table.locator("tbody tr").first().locator("td")).toHaveCount(2);

  const sourceEvidence = page.locator(".compare-crosswalk-source");
  await expect(sourceEvidence).toContainText("Crosswalk source");
  await expect(sourceEvidence).toContainText("NIST CSF 2.0");
  await expect(page.getByRole("combobox", { name: "Crosswalk source" })).toHaveCount(0);

  const boundary = page.getByText(
    "A published crosswalk shows a cited relationship; it does not by itself establish equivalence or compliance.",
    { exact: true },
  );
  await expect(boundary).toHaveCount(1);
  await expect(boundary).toBeVisible();

  const refine = page.getByText("Refine results", { exact: true });
  await expect(refine).toBeVisible();
  await refine.click();
  await expect(page.getByLabel("Connection type")).toBeVisible();
  await expect(page.getByText("Source basis", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Trust level", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/candidate|inferred/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Map", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "List", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Atlas map" })).toHaveCount(0);
});

test("a pair with multiple published sources defaults to all and exposes one result filter", async ({
  page,
}) => {
  await openCompare(
    page,
    "/#/compare/relationships?intent=item-mapping&source=nist-800-53&items=AC-2&target=disa-cci",
  );

  await page.getByRole("button", { name: "Show published mappings" }).click();
  const sourceFilter = page.getByRole("combobox", { name: "Crosswalk source" });
  await expect(sourceFilter).toBeVisible({ timeout: 30_000 });
  await expect(sourceFilter).toHaveValue("");
  await expect(sourceFilter.locator("option")).toHaveText([
    "All published sources",
    "DISA CCI",
    "SP 800-53 Rev. 5",
  ]);

  await sourceFilter.selectOption("disa-cci-nist-references");
  await expect(page).toHaveURL(/mappingSource=disa-cci-nist-references/);
  await expect(
    page.getByRole("table", { name: "Published crosswalk mappings" }),
  ).toBeVisible();
});

test("Specific item reveals only targets with a real mapping for the exact item", async ({
  page,
}) => {
  await openCompare(page);

  await page.getByRole("tab", { name: "Specific item" }).click();
  await expect(
    page.getByRole("tab", { name: "Specific item" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("navigation", { name: "Step progress" }).locator("li"),
  ).toHaveText([/01 \/ Item/, /02 \/ Target/, /03 \/ Results/]);
  await expect(page.getByLabel("Control / requirement / rule")).toBeVisible();

  await page.getByRole("combobox", { name: "Publication" }).fill(
    "SP 800-171 Rev. 3",
  );
  await page.getByLabel("Control / requirement / rule").fill("3.1.1");

  const target = page.getByLabel("Target publication");
  await expect(target).toBeVisible({ timeout: 30_000 });
  await expect(target.locator('option[value="nist-800-53"]')).toHaveText(
    "SP 800-53 Rev. 5",
  );
  await expect(target.locator('option[value="dod-rai"]')).toHaveCount(0);

  await target.selectOption("nist-800-53");
  await page.getByRole("button", { name: "Show published mappings" }).click();
  await expect(page.locator(".compare-mapping-total")).toHaveText(
    "4 published mappings",
  );
  const table = page.getByRole("table", { name: "Published crosswalk mappings" });
  await expect(table).toBeVisible();
  await expect(table.getByText("3.1.1", { exact: true }).first()).toBeVisible();
});

test("invalid and zero-capability scopes never become selectable result states", async ({
  page,
}) => {
  await openCompare(
    page,
    "/#/compare/relationships?intent=frameworks&source=nist-800-53&target=not-a-real-catalog",
  );

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Choose a framework to compare with",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Target publication")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Show published mappings" }),
  ).toBeDisabled();
  await expect(page.locator("#compare-results")).toHaveCount(0);
  await expect(page.getByText("Crosswalk source", { exact: true })).toHaveCount(0);
});
