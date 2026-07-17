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

// D11 (CATL-24): the Sources page reports the loaded graph inventory without
// turning partial mapping into a percentage score.
test("Sources page reports a factual connection inventory", async ({ page }) => {
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const inventory = page.locator(".connection-inventory");
  await expect(
    inventory.getByRole("heading", { name: "Connection inventory" }),
  ).toBeVisible();
  await expect(inventory).toContainText("11,486 records across 7 practical categories");
  await expect(inventory).toContainText("16,207 published links");
  await expect(inventory).toContainText("Requirements");
  await expect(inventory).toContainText("Assessment checks");
  await expect(inventory).toContainText("Threats and defenses");
  await expect(inventory).toContainText("Connects to:");
  await expect(inventory).not.toContainText("%");
  await expect(inventory).not.toContainText("coverage", { ignoreCase: true });
  await expect(inventory.locator(".catalog-coverage-bar")).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: "artifacts/release-readiness/sources-connection-inventory.png",
  });
});

test("Sources page avoids redundant map-inclusion badges", async ({ page }) => {
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText(/Used in map:/i)).toHaveCount(0);
  await expect(page.locator(".source-card .badge.tone-success")).toHaveCount(0);
});

test("Sources connection inventory reflows on a compact viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const inventory = page.locator(".connection-inventory");
  await expect(inventory).toBeVisible();
  await expect(inventory.locator(".connection-inventory-row")).toHaveCount(7);
  const pageWidth = await page.evaluate(() => ({
    client: globalThis.document.documentElement.clientWidth,
    scroll: globalThis.document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);
  await inventory.screenshot({
    path: "artifacts/release-readiness/sources-connection-inventory-compact.png",
  });
});
