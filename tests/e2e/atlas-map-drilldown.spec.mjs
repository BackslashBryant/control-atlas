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

function atlas(page) {
  return page.getByTestId("atlas-map");
}

function level(page, key) {
  return atlas(page).locator(`.atlas-decomp__column[data-column="${key}"]`);
}

/** Opens a row in the named level. Every row is a real, labelled button. */
async function open(page, key, name) {
  const row = level(page, key).getByRole("button", { name });
  await expect(row).toBeVisible();
  await row.click();
}

/**
 * Opens a publisher from the landing board. A publisher card leads to that
 * publisher's own columns, because "what does NIST put out?" is an inventory
 * question the columns already answer.
 */
async function openPublisher(page, label) {
  const card = page
    .getByTestId("atlas-family-board")
    .getByRole("button", { name: label, exact: true });
  await expect(card).toBeVisible();
  await card.click();
}

test("the Atlas landing starts with source ecosystems and NIST drills to its publications", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas?atlasLanding=publishers");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // The landing groups by publisher: eight publisher cards, plus the three
  // authority landmarks named in a strip beneath them because obligations are
  // not publishers and nobody crosswalks to them.
  const board = page.getByTestId("atlas-family-board");
  await expect(board).toBeVisible();
  await expect(board.locator(".atlas-family-board__card")).toHaveCount(8);
  await expect(board.locator(".atlas-family-board__strip li")).toHaveCount(4);
  const labels = await board
    .locator(".atlas-family-board__open")
    .allTextContents();
  for (const ecosystem of ["NIST", "DISA", "MITRE", "FedRAMP", "DoD CIO"]) {
    expect(labels, `${ecosystem} card`).toContain(ecosystem);
  }

  await openPublisher(page, "NIST");
  await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
  await expect(
    level(page, "publication").getByRole("button", { name: /SP 800-53 Rev\. 5 Catalog/ }),
  ).toBeVisible();
});

test("a drilled branch survives refresh and the breadcrumb steps back one generation", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas?atlasLanding=publishers");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await openPublisher(page, "NIST");
  await open(page, "publication", /SP 800-53 Rev\. 5 Catalog/);
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");

  await page.reload();
  await waitForAppReady(page);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");

  const trail = page.getByRole("navigation", { name: "Atlas scope" });
  await trail.getByRole("button", { name: "NIST", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=ecosystem(?::|%3A)nist/);
  await expect(page).not.toHaveURL(/atlasFramework=/);

  await page.goBack();
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "publication");
});

test("section drill stays scoped to the publication's real child records", async ({
  page,
}) => {
  await gotoApp(page, "/#/atlas?atlasLanding=publishers");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await openPublisher(page, "NIST");
  await open(page, "publication", /SP 800-53 Rev\. 5 Catalog/);
  await open(page, "detail", /Access Control/);
  await expect(page).toHaveURL(/atlasFamily=group:nist-800-53:0/);
  await expect(atlas(page)).toHaveAttribute("data-scope-level", "detail");
  await expect(atlas(page).locator(".atlas-decomp__scope-count")).toHaveText(
    "148 records in view",
  );

  await expect(
    level(page, "record").getByRole("button", { name: /^AC-2 — Account Management/ }),
  ).toBeVisible();
});

test("structural records use publisher-native labels without changing their route targets", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const cases = [
    {
      route: "/#/atlas?atlasLimb=ecosystem%3Anist&atlasFramework=csf-2&atlasFamily=group%3Acsf-2%3A9",
      label: "PR.AA — Identity Management, Authentication, and Access Control",
      target: /#\/atlas\/csf-2:CATEGORY-PR\.AA\?/,
    },
    {
      route: "/#/atlas?atlasLimb=ecosystem%3Amitre&atlasFramework=mitre-attack&atlasFamily=group%3Amitre-attack%3A8",
      label: "TA0001 — Initial Access",
      target: /#\/atlas\/mitre-attack:TACTIC-TA0001\?/,
    },
    {
      route: "/#/atlas?atlasLimb=ecosystem%3Anist&atlasFramework=nist-800-53&atlasFamily=group%3Anist-800-53%3A0",
      label: "AC — Access Control",
      target: /#\/atlas\/nist-800-53:FAMILY-AC\?/,
    },
  ];

  for (const entry of cases) {
    await gotoApp(page, entry.route);
    await waitForAppReady(page);
    await dismissOnboarding(page);
    const records = level(page, "record");
    await expect(records.locator(".atlas-decomp__label").first()).toBeVisible();
    const label = records
      .locator(".atlas-decomp__label")
      .getByText(entry.label, { exact: true });
    const showMore = records.getByRole("button", { name: /Show \d+ more/ });
    if (!(await label.count()) && (await showMore.count())) {
      await showMore.click();
    }
    await expect(label).toBeVisible();
    await label.locator("xpath=ancestor::button").click();
    await expect(page).toHaveURL(entry.target);
  }
});

test("guided structural identity is identical before and after optional catalog hydration", async ({
  page,
}) => {
  let releaseRecords = () => {};
  const recordsGate = new Promise((resolve) => {
    releaseRecords = () => resolve();
  });
  await page.route(
    "**/data/generated/catalog-records/mitre-attack.json*",
    async (route) => {
      await recordsGate;
      await route.continue();
    },
  );

  await gotoApp(
    page,
    "/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-THREAT&atlasFramework=mitre-attack&relationshipView=path",
  );
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);
  const explorer = page.locator("[data-atlas-structural-explorer]:visible");
  const row = explorer.getByRole("button", {
    name: "Open TA0001 — Initial Access",
    exact: true,
  });
  await expect(row).toBeVisible();
  const label = row.locator("strong");
  const initialLabel = await label.innerText();
  expect(initialLabel).toBe("TA0001 — Initial Access");

  releaseRecords();
  await waitForAppReady(page);
  await expect(label).toHaveText(initialLabel);
  await row.click();
  await expect(page).toHaveURL(/#\/atlas\/mitre-attack:TACTIC-TA0001\?/);
});

test("CMMC detail scope reports all three publisher-native levels", async ({ page }) => {
  await gotoApp(page, "/#/atlas?atlasLanding=publishers");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await openPublisher(page, "DoD");
  await open(page, "publication", /CMMC 2\.0 Catalog/);
  await open(page, "detail", /CMMC 2\.0 Levels/);

  const records = level(page, "record");
  await expect(records).toHaveAttribute("data-row-count", "3");
  for (const levelNumber of [1, 2, 3]) {
    await expect(
      records.locator(".atlas-decomp__label").getByText(`CMMC Level ${levelNumber}`, { exact: true }),
    ).toBeVisible();
  }
  await expect(atlas(page).locator(".atlas-decomp__scope-count")).toHaveText(
    "3 records in view",
  );
});
