import { expect, test } from "@playwright/test";
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from "./support.mjs";

/** @type {Array<[string, string, string, boolean]>} */
const records = [
  ["control", "/#/record/nist-800-53/AC-1", "Policy and Procedures", true],
  ["STIG rule", "/#/record/disa-stig/V-222387", "limit the number of logon sessions", true],
  ["SRG rule", "/#/record/disa-srg/V-202013", "automatically audit account creation", true],
  ["ATT&CK technique", "/#/record/mitre-attack-ics/T0800", "Activate Firmware Update Mode", true],
  ["assessment procedure", "/#/record/nist-800-53a/AC-1", "Policy and Procedures Assessment Procedure", true],
  // D3-AA was the last record type with an empty description (MITRE D3FEND
  // technique/all.json omits d3f:definition; the full ontology graph carries
  // it — docs/plans/full-records-2026-08-02.md). No graph node currently has
  // an empty description, so there is no real fixture left for the
  // "no narrative description" fallback branch in ObjectDetailPage.tsx.
  ["MITRE D3FEND countermeasure", "/#/record/mitre-d3fend/D3-AA", "Agent Authentication", true],
];

/** @type {Array<[string, number, number]>} */
const viewports = [
  ["mobile", 375, 812],
  ["desktop", 1440, 1000],
];

for (const [label, width, height] of viewports) {
  test.describe(`source-first record detail at ${label}`, () => {
    test.use({ viewport: { width, height } });

    for (const [recordType, route, title, hasDescription] of records) {
      test(`${recordType} shows only source-backed record content`, async ({ page }) => {
        attachPageDiagnostics(page);
        await page.goto(route);
        await waitForAppReady(page);
        await dismissOnboarding(page);

        await expect(page.getByRole("heading", { name: new RegExp(title, "i") })).toBeVisible();
        await expect(page.getByText("Official source text", { exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Open official source", exact: true })).toHaveCount(1);
        await expect(page.getByText("What this is", { exact: true })).toBeVisible();
        await expect(page.getByText("What you need to do", { exact: true })).toHaveCount(
          recordType === "ATT&CK technique" || recordType === "MITRE D3FEND countermeasure" ? 0 : 1,
        );

        if (hasDescription) {
          const officialText = page.getByText("Official source text", { exact: true });
          await officialText.click();
          await expect(page.getByText("No narrative description was published for this record.")).toHaveCount(0);
        } else {
          await expect(page.getByText("No narrative description was published for this record.")).toBeVisible();
        }
      });
    }
  });
}
