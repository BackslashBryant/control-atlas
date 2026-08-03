import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

// docs/plans/audit-alignment-2026-08-02.md Phase 4c / Workstream 0.
//
// The audit's C-01 finding was two Linux/Windows screenshots disagreeing on
// AC-2's path badges and relationship counts. The actual bug (found and
// fixed in session 20) was never a platform difference — it was
// AtlasMapPage's embedded "Where this sits" rail hardcoding every hop's
// origin to "structural", so the same record showed correct organizing
// badges on its direct /record page but not on the Explore-embedded view of
// the exact same node. Pixel screenshots only caught this by accident, on
// whichever platform happened to be captured that day.
//
// These assertions compare semantic content (text, classes, counts) between
// the two render paths for one node, not pixels. Because they are text-based
// rather than image-based, they are inherently platform-independent — the
// same assertion passes or fails identically on Linux and Windows, which is
// what makes this a real regression guard instead of a screenshot that only
// gets compared to itself.
test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("organizing hops agree between the direct record page and the Explore-embedded Path view", async ({
  page,
}) => {
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const recordRail = page.getByRole("navigation", { name: "Where this sits" });
  await expect(recordRail).toBeVisible();
  const recordOrganizingLabels = await recordRail
    .locator(".atlas-path-crumb-organizing")
    .allTextContents();

  await gotoApp(page, "/#/explore?node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const exploreRail = page.getByRole("navigation", { name: "Where this sits" });
  await expect(exploreRail).toBeVisible();
  const exploreOrganizingLabels = await exploreRail
    .locator(".atlas-path-crumb-organizing")
    .allTextContents();

  expect(recordOrganizingLabels.length).toBeGreaterThan(0);
  expect(exploreOrganizingLabels).toEqual(recordOrganizingLabels);
});

test("relationship totals reconcile between the record page and Explore's flat List view", async ({
  page,
}) => {
  // The record page's Connections rollup deliberately excludes control
  // enhancements: ObjectDetailPage.tsx renders them in their own
  // "Decomposes into" block instead of the generic Connections accordion
  // (tree-model.md #7 item 6), so its total is smaller than a flat
  // relationship count by design. Explore's List view has no such carve-out
  // and reports every published edge undifferentiated. The audit's C-01
  // "95 vs 82" finding was this same split observed across a stale
  // pre-fix/post-fix screenshot pair, not a data-loading bug: investigated
  // and confirmed via direct data inspection (session 21) that both totals
  // derive from the same 95 published edges for AC-2. The real invariant is
  // that the two totals reconcile once the carved-out enhancements are added
  // back — not that they're equal outright.
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const rollup = page.locator(".connection-rollup");
  await expect(rollup).toBeVisible();
  const rollupText = (await rollup.textContent()) || "";
  const recordTotal = Number(rollupText.match(/(\d+)\s+published links/)?.[1]);
  expect(Number.isFinite(recordTotal) && recordTotal > 0).toBe(true);

  const decompositionCount = await page
    .locator(".record-decomposition-block .badge-button")
    .count();

  await gotoApp(page, "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const table = page.getByRole("table", { name: "Relationship table" });
  await expect(table).toBeVisible();
  const exploreTotal = await table.locator("tbody tr").count();

  expect(recordTotal + decompositionCount).toBe(exploreTotal);
});

// audit-alignment-2026-08-02.md Workstream 0 (Deterministic baseline): locks
// AC-2's record-page section IDs, connection-group names/counts, and path
// provenance to exact values. Because these are text/DOM assertions rather
// than pixel comparisons, the same command produces the same pass/fail on
// Linux and Windows by construction — there is no separate "cross-platform"
// step to run. This is the semantic snapshot C-01 asked for.
test("semantic route snapshot: AC-2 record page locks section IDs, group counts, and path provenance", async ({
  page,
}) => {
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const rail = page.getByRole("navigation", { name: "Where this sits" });
  await expect(rail).toBeVisible();
  const allCrumbs = await rail
    .locator(".atlas-path-crumb-link, .atlas-path-crumb-subject")
    .allTextContents();
  const organizingCrumbs = await rail
    .locator(".atlas-path-crumb-organizing")
    .allTextContents();
  expect(allCrumbs).toEqual([
    "Cybersecurity",
    "Compliance",
    "SP 800-53 Rev. 5 Catalog",
    "Access Control",
    "Account Management",
  ]);
  expect(organizingCrumbs).toEqual(["Cybersecurity", "Compliance"]);

  const groupItems = await page
    .locator('.accordion-item[id^="connection-group-"]')
    .all();
  const groupLabels = await Promise.all(
    groupItems.map(async (item) => {
      const id = await item.getAttribute("id");
      const text =
        (await item.locator(".relationship-group-trigger span").first().textContent()) ||
        "";
      return `${id}:${text.trim()}`;
    }),
  );
  expect(groupLabels).toEqual([
    "connection-group-disa:DISA CCIs (47)",
    "connection-group-nistBaseline:NIST baselines (3)",
    "connection-group-fedrampBaseline:FedRAMP baselines (4)",
    "connection-group-assessment:Assessment procedures (1)",
    "connection-group-csf:CSF 2.0 crosswalks (NIST OLIR) (5)",
    "connection-group-sp171:SP 800-171 mappings (1)",
    "connection-group-other:Other public mappings (21)",
  ]);

  await expect(page.locator(".record-decomposition-block .badge-button")).toHaveCount(13);
  await expect(page.getByText("Discussion", { exact: true })).toHaveCount(1);
});

test("CCI classification agrees between the record page's chip summary and Explore's Map lens", async ({
  page,
}) => {
  await gotoApp(page, "/#/record/nist-800-53/AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const correlatedRow = page
    .locator(".tree-relationship-class-row")
    .filter({ hasText: "Correlated through" });
  await expect(correlatedRow).toBeVisible();

  await gotoApp(page, "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const map = page.getByRole("region", { name: "Relationship map" });
  const lensCards = map.getByRole("group", { name: "Relationship types" });
  // CCIs are correlation junctions everywhere or nowhere — never
  // "Implementation" in one view and "Correlation" in the other.
  await expect(lensCards.getByRole("button", { name: /Correlation/ })).toBeVisible();
  await expect(lensCards.getByRole("button", { name: /^Implementation/ })).toHaveCount(0);
});
