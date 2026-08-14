import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

// Checked against the same artifact the page renders, which is built from the
// graph by scripts/build-framework-data.mjs. Counting nodes.json directly
// disagreed by exactly the 10 Class-4 spine nodes (trunk + nine limbs): those
// are Control Atlas's own organizing layer, not records it loaded.
const CONNECTION_INVENTORY = JSON.parse(
  readFileSync("data/generated/connection-inventory.json", "utf8"),
).connection_inventory;
const GRAPH_NODE_COUNT = CONNECTION_INVENTORY.totalRecords;
const GRAPH_PUBLISHED_LINK_COUNT = CONNECTION_INVENTORY.publishedLinks;

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Sources page exposes required canonical source links", async ({ page }) => {
  await page.goto("/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.locator("#official-source-links > summary").click();

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
  await inventory.getByText("Connection inventory", { exact: true }).click();
  // Derived from the generated graph rather than hardcoded. The previous literals
  // ("11,486 records", "16,207 published links") had to be hand-bumped on every
  // legitimate data change and broke when the GRC parent tiers were added, while
  // never actually checking that the page agrees with the graph it renders.
  await expect(inventory).toContainText(
    `${GRAPH_NODE_COUNT.toLocaleString("en-US")} records across 7 practical categories`,
  );
  await expect(inventory).toContainText(
    `${GRAPH_PUBLISHED_LINK_COUNT.toLocaleString("en-US")} published links`,
  );
  await inventory.getByText("Per-category counts (7)", { exact: true }).click();
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
  await inventory.getByText("Connection inventory", { exact: true }).click();
  await inventory.getByText("Per-category counts (7)", { exact: true }).click();
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

test("Sources layers keep contextual URL state, filters, counts, and bounded rows", async ({
  page,
}) => {
  await page.goto("/#/sources?layer=ingestion&publisher=ComplianceAsCode");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("tab", { name: /Source material/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator(".source-register-total")).toContainText(
    "1 of 94 source materials",
  );

  await page.setViewportSize({ width: 768, height: 844 });
  const totalBox = await page.locator(".source-register-total").boundingBox();
  expect(totalBox?.width || 0).toBeGreaterThan(120);

  await page.getByRole("tab", { name: /Connection sources/ }).click();
  await expect(page).toHaveURL(/#\/sources\?layer=connection$/);
  await expect(page.locator(".source-register-total")).toContainText(
    "13 of 13 connection sources",
  );
  await expect(page.getByLabel("Publisher")).not.toHaveValue("ComplianceAsCode");

  await page.goBack();
  await expect(page.getByRole("tab", { name: /Source material/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Publisher")).toHaveValue("ComplianceAsCode");

  await page.goto("/#/sources?layer=connection&publisher=ComplianceAsCode");
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/sources\?layer=connection$/);
  await expect(page.getByLabel("Publisher")).not.toHaveValue("ComplianceAsCode");

  await page.goto("/#/sources?layer=ingestion");
  await waitForAppReady(page);
  await expect(page.locator(".source-register-row")).toHaveCount(25);
  await page.getByRole("button", { name: /Show 25 more source materials/ }).click();
  await expect(page.locator(".source-register-row")).toHaveCount(50);
  await expect(page.locator(".source-register-row").nth(25)).toBeFocused();
  await expect(page.locator(".source-results-orientation")).toContainText(
    "Showing 50 of 94 source materials",
  );

  await page.goto("/#/sources?layer=ingestion&q=no-such-source-material");
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", {
      name: "No source materials match these filters.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear source material filters" }),
  ).toBeVisible();

  await page.goto("/#/sources?layer=ingestion&q=artifact-disa-cci-list");
  await waitForAppReady(page);
  const cciPublisher = page.locator(".source-register-row").first().getByText("DISA", { exact: true });
  await expect(cciPublisher).toBeVisible();
  await expect(cciPublisher.locator("..")).toContainText("From parent publication");
});

test("Sources rows stay self-describing from 320 through 768 pixels", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 768]) {
    const viewportHeight = width === 320 ? 700 : 844;
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto("/#/sources?layer=ingestion");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const firstRow = page.locator(".source-register-row").first();
    await expect(firstRow.getByRole("link", { name: "ComplianceAsCode/content" })).toBeVisible();
    await expect(firstRow.locator("code")).toHaveText("artifact-complianceascode-content");

    if (width <= 768) {
      for (const label of ["Source material", "Publisher", "Format", "Retrieved", "Imported records", "Status"]) {
        await expect(firstRow.locator(".ca-source-cell__label", { hasText: label })).toBeVisible();
      }
    }

    const copy = firstRow.getByRole("button", {
      name: "Copy source ID artifact-complianceascode-content",
    });
    const box = await copy.boundingBox();
    expect(box?.width || 0).toBeGreaterThanOrEqual(44);
    expect(box?.height || 0).toBeGreaterThanOrEqual(44);
    await copy.click();
    await expect(copy).toHaveText("Copied");

    const dimensions = await page.evaluate(() => ({
      client: globalThis.document.documentElement.clientWidth,
      scroll: globalThis.document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);

    if (width < 768) {
      const layerTop = await page
        .locator(".source-view-toggle")
        .evaluate((element) => element.getBoundingClientRect().top);
      const resultTop = await firstRow.evaluate(
        (element) => element.getBoundingClientRect().top + globalThis.scrollY,
      );
      expect(layerTop).toBeLessThan(700);
      expect(resultTop).toBeLessThanOrEqual(viewportHeight * 1.25);
    }

    if (width === 390) {
      await page.evaluate(() => {
        globalThis.document.documentElement.style.scrollBehavior = "auto";
        globalThis.scrollTo(0, 1200);
      });
      await page.waitForFunction(() => globalThis.scrollY >= 1000);
      const orientationBox = await page.locator(".source-results-orientation").boundingBox();
      expect(orientationBox?.y || 0).toBeGreaterThanOrEqual(75);
      expect(orientationBox?.y || 0).toBeLessThan(110);
    }

    if (width === 768) {
      const publisherBox = await firstRow
        .locator(".ca-source-cell", { hasText: "Publisher" })
        .boundingBox();
      const formatBox = await firstRow
        .locator(".ca-source-cell", { hasText: "Format" })
        .boundingBox();
      expect(Math.abs((publisherBox?.y || 0) - (formatBox?.y || 0))).toBeLessThan(2);
    }
  }
});

test("Sources inheritance explanations name the human parent at every governed width", async ({ page }) => {
  const derivedRows = [
    {
      layer: "ingestion",
      id: "artifact-disa-cci-list",
      parentName: "DISA CCI",
      parentId: "disa-cci-list",
    },
    {
      layer: "connection",
      id: "artifact-dod-zt-overlays-2024",
      parentName: "DoD Zero Trust Overlays",
      parentId: "dod-zt-overlays-2024",
    },
  ];
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    for (const fixture of derivedRows) {
      await gotoApp(page, `/#/sources?layer=${fixture.layer}&q=${fixture.id}`);
      await waitForAppReady(page);
      await dismissOnboarding(page);

      const row = page.locator(".source-register-row").first();
      await expect(row.getByText("From parent publication", { exact: true })).toBeVisible();
      const explanation = row.locator(".ca-source-field--derived .visually-hidden");
      await expect(explanation).toContainText(
        `Inherited from parent publication ${fixture.parentName}.`,
      );
      await expect(explanation).not.toContainText(fixture.parentId);
      await expect(row.getByRole("button", { name: `Copy source ID ${fixture.id}` })).toBeVisible();
      expect(await page.evaluate(() =>
        globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth,
      )).toBeLessThanOrEqual(1);
    }
  }
});
