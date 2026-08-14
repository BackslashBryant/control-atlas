import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from "./support.mjs";

async function openRecord(page, route) {
  attachPageDiagnostics(page);
  await page.goto(route);
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);
}

test("WS2 record template leads with qualified identity and one source action", async ({ page }) => {
  await openRecord(page, "/#/record/nist-800-171-rev2/3.1.1");

  const template = page.locator('[data-template="E"]');
  await expect(template).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "NIST AC 3.1.1", level: 1 })).toBeVisible();
  await expect(page.locator("[data-canonical-breadcrumb]"))
    .toHaveAttribute("data-canonical-breadcrumb", /3\.1\.1$/);
  await expect(page.locator(".record-official-name")).toHaveCount(0);
  await expect(template.locator(".bucket-tag")).toHaveCount(1);
  await expect(template.locator(".bucket-tag")).toContainText("Compliance");
  await expect(page.locator(".record-classification-tags").locator(":scope > *"))
    .toHaveCount(5);
  await expect(page.getByRole("link", { name: "Filter the Library by Access Control", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View official source", exact: true })).toHaveCount(1);

  await expect(page.getByRole("heading", { name: "Requirement", level: 2 })).toBeVisible();
  await expect(page.locator('[data-source-field="description"]')).toContainText(
    /Limit system access to authorized users, processes acting on behalf/,
  );
  await expect(page.getByRole("heading", { name: "About This Record", exact: true })).toBeVisible();
  await expect(page.getByText(/What this is|What you need to do|How to satisfy it/i)).toHaveCount(0);
});

test("WS2 related records exclude structural parents and public pages expose no developer fields", async ({ page }) => {
  await openRecord(page, "/#/record/nist-800-53/AC-2");

  const connections = page.locator('[data-record-section="related-records"]');
  await expect(connections).toBeVisible();
  await expect(connections.getByRole("heading", { name: "Related records", exact: true })).toBeVisible();
  await expect(connections).toContainText("Evidence-backed published links to other publications.");
  await expect(connections).not.toContainText("Contains");
  await expect(connections).not.toContainText("FAMILY-ACCESS-CONTROL");
  const connectionRows = connections.locator("[data-record-connection-id]");
  expect(await connectionRows.count()).toBeGreaterThan(1);
  const connectionIds = await connectionRows.evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-record-connection-id")),
  );
  expect(new Set(connectionIds).size).toBe(connectionIds.length);
  for (const row of await connectionRows.all()) {
    await expect(row.locator(".relationship-meta")).not.toBeEmpty();
    await expect(row.locator(".relationship-citation")).not.toBeEmpty();
  }

  const visibleText = await page.locator("main").innerText();
  expect(visibleText).not.toContain("nist-800-53:AC-2");
  expect(visibleText).not.toMatch(/\/data\/|Node ID/);
  await expect(page.locator("[data-record-source-locator] code")).toHaveText("controls-800-53.json#AC-2");
  await expect(page.getByText("Developer details", { exact: true })).toHaveCount(0);
});

test("WS2 CCI records expose publisher references and a bounded first set of connected records", async ({ page }) => {
  await openRecord(page, "/#/record/disa-cci/CCI-000366");

  const source = page.locator('[data-record-section="official-text"]');
  await expect(source.getByRole("heading", { name: "Requirement", exact: true })).toBeVisible();
  await expect(source.getByRole("heading", { name: "Publisher References", exact: true })).toBeVisible();
  await expect(source.locator('[data-source-field="references"] li')).toHaveCount(4);

  const connected = page.locator('[data-record-section="related-records"]');
  await expect(connected.getByRole("heading", { name: "Evidence-backed connected records", exact: true })).toBeVisible();
  await expect(connected.locator('[data-record-connection-id]')).toHaveCount(12);
  await expect(connected.getByRole("link", { name: "Explore all connections in Atlas", exact: true })).toBeVisible();
});

test("WS2 NIST Mobile records show publisher fields without adapter-generated threat prose", async ({ page }) => {
  await openRecord(page, "/#/record/nist-mobile-threats/APP-0");

  await expect(page.locator("[data-record-source-error]")).toHaveCount(0);
  await expect(page.getByText("Eavesdropping on Unencrypted App Traffic", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Possible Countermeasures", exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Threat APP-0 published in the NIST Mobile Threat Catalogue.");
});

test("WS2 NIST Mobile title-only records explain the publisher field boundary", async ({ page }) => {
  await openRecord(page, "/#/record/nist-mobile-threats/CEL-10");

  await expect(page.locator("[data-record-source-error]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "NIST Consumer-grade Femtocell CEL-10", level: 1 })).toBeVisible();
  await expect(page.getByText(/weaker, nonstandard handset authentication/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Publisher Field Availability", exact: true })).toBeVisible();
  await expect(page.getByText(/NIST publishes a title for this threat/i)).toBeVisible();
});

test("WS2 preserves source-specific STIG fields and responsive flow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openRecord(page, "/#/record/disa-stig/V-222387");

  await expect(page.getByRole("heading", { name: "Discussion", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fix", level: 2 })).toBeVisible();
  await expect(page.locator('[data-source-field="fix_text"]')).not.toBeEmpty();
  const overflow = await page.evaluate(() =>
    globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator(".record-template-sidebar")).toHaveCSS("position", "static");
});

test("WS2 turns clear DISA commands and file procedures into copyable source formatting", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => { globalThis.__copiedSourceSnippet = value; } },
    });
  });
  await openRecord(page, "/#/record/disa-stig/V-256609");

  const check = page.locator('[data-source-field="check_text"]');
  await expect(check.locator("[data-source-code-snippet]")).toHaveCount(1);
  await check.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__copiedSourceSnippet)).toMatch(/rpm -V VMware-Postgres/);

  const fix = page.locator('[data-source-field="fix_text"]');
  await expect(fix.locator(".source-procedure-list")).toHaveCount(2);
  await expect(fix.locator("[data-source-code-snippet]")).toHaveCount(2);
  await expect(fix.locator(".source-procedure-list__code-step > [data-source-code-snippet]")).toHaveCount(2);
  await expect(fix.locator(":scope > .source-text-blocks > [data-source-code-snippet]")).toHaveCount(0);

  for (const snippet of await page.locator("[data-source-code-snippet] pre").all()) {
    const snippetOverflow = await snippet.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(snippetOverflow).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  for (const copyButton of await page.getByRole("button", { name: "Copy", exact: true }).all()) {
    expect(
      await copyButton.evaluate((element) => ({
        fits: element.scrollWidth <= element.clientWidth,
        whiteSpace: globalThis.getComputedStyle(element).whiteSpace,
      })),
    ).toEqual({ fits: true, whiteSpace: "nowrap" });
  }
  for (const codeStep of await fix.locator(".source-procedure-list__code-step").all()) {
    expect(
      await codeStep.evaluate((element) => ({
        display: globalThis.getComputedStyle(element).display,
        marker: globalThis.getComputedStyle(element).listStyleType,
      })),
    ).toEqual({ display: "list-item", marker: "disc" });
  }
  const overflow = await page.evaluate(() =>
    globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("WS2 exposes exact retained locators and governed publication names at every supported width", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => { globalThis.__copiedSourceLocator = value; } },
    });
  });
  const widths = [320, 375, 390, 768, 1024, 1440];
  const locator = "U_VMW_vSphere_7-0_Y25M04_STIG.zip/U_VMW_vSphere_7-0_vCA_PostgreSQL_V1R2_Manual_STIG/U_VMW_vSphere_7-0_vCA_PostgreSQL_STIG_V1R2_Manual-xccdf.xml#V-256609";

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await openRecord(page, "/#/record/disa-stig/V-256609");
    await waitForAppReady(page);
    const disclosure = page.locator("[data-record-source-locator]");
    const sourceLocationButton = disclosure.getByRole("button", { name: "Source location", exact: true });
    if (await sourceLocationButton.getAttribute("aria-expanded") !== "true") {
      await sourceLocationButton.click();
    }
    await expect(sourceLocationButton).toHaveAttribute("aria-expanded", "true");
    await expect(disclosure.locator("code")).toHaveText(locator);
    await expect(disclosure.getByText("Artifact path", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px source locator overflow`).toBeLessThanOrEqual(1);
  }

  await page.getByRole("button", { name: "Copy source locator", exact: true }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__copiedSourceLocator)).toBe(locator);
  await expect(page.getByText("Source locator copied to clipboard", { exact: true })).toBeAttached();

  await openRecord(page, "/#/record/nist-mobile-threats/APP-0");
  await expect(page.locator(".record-source-facts")).toContainText("NIST Mobile Threat Catalogue");
  await expect(page.locator(".record-source-facts")).not.toContainText("nist-mobile-threats");
  await expect(page.locator("[data-canonical-breadcrumb]")).toContainText("NIST Mobile Threat Catalogue");
  await expect(page.locator("[data-canonical-breadcrumb]")).not.toContainText("nist-mobile-threats");
  await openRecord(page, "/#/record/nist-zt/SP800-207");
  await expect(page.locator(".record-source-facts")).toContainText("NIST Zero Trust");
  await expect(page.locator(".record-source-facts")).not.toContainText("nist-zt");
  await expect(page.locator("[data-canonical-breadcrumb]")).toContainText("NIST Zero Trust");
  await expect(page.locator("[data-canonical-breadcrumb]")).not.toContainText("nist-zt");

  const representativeLocators = [
    ["/#/record/nist-800-171-rev2/3.1.1", "requirements-800-171-rev2.json#3.1.1"],
    ["/#/record/nist-800-53/AC-2", "controls-800-53.json#AC-2"],
    ["/#/record/nist-800-53a/AC-1", "controls-800-53.json#AC-1#assessment"],
    ["/#/record/disa-cci/CCI-000366", "U_CCI_List.xml#CCI-000366"],
    ["/#/record/disa-srg/V-202013", "U_NDM_V5R5_SRG.zip/U_NDM_V5R5_Manual_SRG/U_NDM_SRG_V5R5_Manual-xccdf.xml#V-202013"],
    ["/#/record/mitre-attack/T1195.002", "enterprise-attack.json#T1195.002"],
    ["/#/record/mitre-attack-ics/T0800", "ics-attack.json#T0800"],
    ["/#/record/mitre-d3fend/D3-AA", "technique/all.json#D3-AA"],
    ["/#/record/dod-zt/ACT-1-1-1", "capabilities.pdf#page=10&table=table-1&row=1"],
    ["/#/record/nist-zt/SP800-207", "NIST.SP.800-207.pdf#page=13"],
    ["/#/record/nist-mobile-threats/APP-0", "https://pages.nist.gov/mobile-threat-catalogue/mtc-data.json#/0"],
    ["/#/record/nist-zt/COLLABORATOR-APPGATE-835EC7F121", "https://pages.nist.gov/zero-trust-architecture/#implementing-a-zero-trust-architecture-full-document:block-189"],
    ["/#/record/nist-zt/MAPPING-CONTRIBUTOR-APPGATE-835EC7F121", "https://pages.nist.gov/zero-trust-architecture/VolumeE/Mappings.html"],
  ];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, expectedLocator] of representativeLocators) {
    await openRecord(page, route);
    await waitForAppReady(page);
    const representativeDisclosure = page.locator("[data-record-source-locator]");
    const representativeToggle = representativeDisclosure.getByRole("button", { name: "Source location", exact: true });
    await representativeToggle.click();
    await expect(representativeDisclosure.locator("code")).toHaveText(expectedLocator);
    await representativeDisclosure.getByRole("button", { name: "Copy source locator", exact: true }).click();
    await expect.poll(() => page.evaluate(() => globalThis.__copiedSourceLocator)).toBe(expectedLocator);
    expect(await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth,
    )).toBeLessThanOrEqual(1);
  }
});

test("WS2 keeps every published record form readable at compact width", async ({ page }) => {
  const records = [
    ["assessment procedure", "/#/record/nist-800-53a/AC-1", "Assessment Procedure"],
    ["ATT&CK technique", "/#/record/mitre-attack-ics/T0800", "Technique Description"],
    ["baseline", "/#/record/fedramp-rev5/HIGH", "Baseline"],
    ["control", "/#/record/nist-800-53/AC-1", "Control Statement"],
    ["control enhancement", "/#/record/nist-800-53/AC-11.1", "Control Statement"],
    ["D3FEND countermeasure", "/#/record/mitre-d3fend/D3-AA", "Countermeasure Description"],
    ["impact category", "/#/record/fips-199/FIPS-199-HIGH", "Impact Category"],
    ["policy", "/#/record/cui-policy/CATEGORY-ACCIDENT-INVESTIGATION", "Policy Statement"],
    ["program", "/#/record/cmmc-2/LEVEL-1", "Program Level"],
    ["requirement", "/#/record/csf-2/DE.AE-02", "Outcome"],
    ["RMF step", "/#/record/nist-800-37/RMF-ASSESS", "RMF Step"],
    ["SRG requirement", "/#/record/disa-srg/V-202013", "Discussion"],
    ["STIG rule", "/#/record/disa-stig/V-213117", "Discussion"],
    ["Zero Trust activity", "/#/record/dod-zt/ACT-1-1-1", "Activity"],
    ["Zero Trust capability", "/#/record/dod-zt/CAP-1-1", "Capability"],
    ["Zero Trust document", "/#/record/dod-zt/DOC-OVERLAYS", "Document Summary"],
    ["NIST Zero Trust publication", "/#/record/nist-zt/SP800-207", "Publication Summary"],
    ["NIST Zero Trust logical component", "/#/record/nist-zt/SP800207-COMPONENT-POLICY-ENGINE-PE", "Logical Component"],
    ["NIST Zero Trust implementation", "/#/record/nist-zt/SP180035-E1B1", "Implementation Summary"],
    ["Zero Trust assessment question", "/#/record/microsoft-zt-maturity/MSZT-2-1", "Assessment Guidance"],
    ["Zero Trust pillar", "/#/record/dod-zt/PILLAR-1", "Pillar Summary"],
    ["Zero Trust tenet", "/#/record/dod-zt/TENET-1", "Tenet"],
  ];

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [form, route, heading] of records) {
    await openRecord(page, route);
    await expect(page.locator("[data-record-source-error]"), `${form} source data`).toHaveCount(0);
    await expect(page.getByRole("heading", { name: heading, level: 2 }).first(), `${form} heading`).toBeVisible();
    await expect(page.locator(".record-official-text > section").first(), `${form} published text`).toBeVisible();
    const overflow = await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth,
    );
    expect(overflow, `${form} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});

test("WS2 desktop uses the locked two-column reading layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openRecord(page, "/#/record/nist-800-53/AC-2");

  const columns = await page.locator(".record-template-grid").evaluate((element) =>
    globalThis.getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean),
  );
  expect(columns).toHaveLength(2);
  await expect(page.locator(".record-template-sidebar")).toHaveCSS("position", "sticky");
});

test("WS6 record identities and derived category explanations stay source-truthful", async ({ page }) => {
  const identities = [
    ["/#/record/disa-cci/CCI-000001", "DISA Policy CCI-000001"],
    ["/#/record/disa-cci/CCI-000015", "DISA Technical CCI-000015"],
    ["/#/record/disa-cci/CCI-000099", "DISA Policy and Technical CCI-000099"],
    ["/#/record/mitre-attack/T1195.002", "MITRE Initial Access T1195.002"],
    ["/#/record/mitre-d3fend/D3-AA", "MITRE Harden D3-AA"],
    ["/#/record/disa-stig/V-256876", "DISA HMC V-256876"],
  ];
  for (const [route, identity] of identities) {
    await openRecord(page, route);
    await expect(page.getByRole("heading", { name: identity, level: 1 })).toBeVisible();
    await expect(page.locator("[data-record-source-error]")).toHaveCount(0);
  }

  await openRecord(page, "/#/record/disa-cci/CCI-000001");
  const acronym = page.locator("h1 abbr", { hasText: "DISA" });
  await acronym.focus();
  await expect(acronym).toHaveAttribute("data-tooltip", "Defense Information Systems Agency");
  const referencedCategory = page.locator('.line-tag--explained[data-tooltip="Referenced category."]');
  await referencedCategory.focus();
  await expect(referencedCategory).toContainText("Access Control");
  const inferredArea = page.locator('.bucket-tag--explained[data-tooltip="Inferred category."]');
  await inferredArea.focus();
  await expect(inferredArea).toContainText("Implementation");
});
