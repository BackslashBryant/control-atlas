import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Sources page exposes required canonical source links", async ({ page }) => {
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("link", { name: "FISMA / 44 U.S.C. Chapter 35, Subchapter II" })).toHaveAttribute(
    "href",
    "https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap35-subchapII.htm",
  );
  await expect(page.getByRole("link", { name: "NIST SP 800-53 Rev. 5" })).toHaveAttribute(
    "href",
    "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  );
  await expect(page.getByRole("link", { name: "MITRE ATT&CK Enterprise" })).toHaveAttribute(
    "href",
    "https://attack.mitre.org/",
  );
  await expect(page.getByRole("link", { name: "MITRE D3FEND Ontology" })).toHaveAttribute(
    "href",
    "https://d3fend.mitre.org/",
  );
});

// D11 (CATL-24): the Sources page reports honest per-catalog connectivity so
// the tool never implies full coverage.
test("Sources page reports honest per-catalog map coverage", async ({ page }) => {
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const coverage = page.locator(".catalog-coverage");
  await expect(
    coverage.getByRole("heading", { name: "Map coverage by catalog" }),
  ).toBeVisible();
  // Full frameworks and partial ones both appear, with real percentages.
  await expect(coverage).toContainText("SP 800-53 Rev. 5");
  await expect(coverage).toContainText(/NIST CSF 2\.0[\s\S]*connected \(\d+%\)/);
  // Catalog names are humanized, never raw slugs.
  await expect(coverage).not.toContainText("mitre-attack");
  await expect(coverage.getByText("MITRE ATT&CK", { exact: false }).first()).toBeVisible();
});
