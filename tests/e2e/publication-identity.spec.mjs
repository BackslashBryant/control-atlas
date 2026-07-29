import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

const publicationRecords = [
  ["nist-800-53", "AC-1", "SP 800-53 Rev. 5", "NIST OSCAL Content"],
  ["nist-800-53a", "AC-1", "SP 800-53A Rev. 5", "NIST OSCAL Content"],
  ["nist-800-171", "3.1.1", "SP 800-171 Rev. 3", "NIST OSCAL Content"],
  [
    "csf-2",
    "CATEGORY-DE.AE",
    "Cybersecurity Framework 2.0",
    "NIST OSCAL Content",
  ],
  [
    "nist-ssdf",
    "GROUP-PREPARE-THE-ORGANIZATION",
    "SP 800-218 SSDF Version 1.1",
    "NIST SSDF OSCAL Content",
  ],
];

test("OSCAL-fed records display exact publication identity, not ingestion identity", async ({
  page,
}) => {
  attachPageDiagnostics(page);

  for (const [catalog, item, publication, ingestion] of publicationRecords) {
    await page.goto(`/#/record/${catalog}/${item}`);
    await waitForAppReady(page);
    await dismissOnboarding(page);

    await expect(
      page.getByText(`Source excerpt from ${publication}`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Source excerpt from ${ingestion}`, { exact: true }),
    ).toHaveCount(0);
  }
});

test("a missing publication identity fails closed without guessed attribution", async ({
  page,
}) => {
  attachPageDiagnostics(page);
  await page.route("**/data/generated/sources.json*", async (route) => {
    if (route.request().url().includes(".json.gz")) {
      await route.fulfill({
        status: 200,
        contentType: "application/gzip",
        body: "invalid gzip fixture",
      });
      return;
    }
    const response = await route.fetch();
    const artifact = await response.json();
    artifact.sources = artifact.sources.filter(
      (source) => source.id !== "nist-csf-2",
    );
    await route.fulfill({ response, json: artifact });
  });

  await page.goto("/#/record/csf-2/CATEGORY-DE.AE");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByText("Source identity unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Official source identity unavailable. This record is not shown as official content until its publication identity can be verified.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Source excerpt from/i)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /open official source/i }),
  ).toHaveCount(0);
});
