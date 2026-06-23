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
