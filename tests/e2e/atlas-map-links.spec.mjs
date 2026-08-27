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

test("selected publications expose their verified official destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const cases = [
    {
      source: "nist-800-53",
      href: "https://csrc.nist.gov/projects/cprt/catalog#/cprt/home",
    },
    {
      source: "mitre-d3fend-ontology",
      href: "https://d3fend.mitre.org/",
    },
  ];

  for (const fixture of cases) {
    await gotoApp(page, `/#/sources?source=${fixture.source}`);
    await waitForAppReady(page);
    await dismissOnboarding(page);
    const inspector = page.locator(
      ".sources-inspector-pane .source-inspector--inline",
    );
    await expect(inspector).toBeVisible();
    await expect(
      inspector.getByRole("link", {
        name: "Open official publication",
        exact: true,
      }),
    ).toHaveAttribute("href", fixture.href);
  }
});

test("publication rows reconcile their source-file count to the inspector", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/sources?source=dod-rai-toolkit");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.locator(".source-register-row--selected .source-attached-pill"),
  ).toContainText("2 source files");
  const inspector = page.locator(
    ".sources-inspector-pane .source-inspector--inline",
  );
  await expect(inspector.locator(".source-material-item")).toHaveCount(2);
  const technicalDetails = inspector.locator(".source-inspector-provenance");
  await technicalDetails.locator("summary").click();
  await expect(technicalDetails).toContainText("Stable Source ID");
});

test("Sources preserves useful search and publisher state without legacy layers", async ({ page }) => {
  await gotoApp(page, "/#/sources?q=DISA&publisher=DISA");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByRole("searchbox", { name: "Search publications" })).toHaveValue(
    "DISA",
  );
  await expect(page.getByLabel("Publisher", { exact: true })).toHaveValue("DISA");
  await expect(
    page.getByRole("table", { name: "Control Atlas publication register" }),
  ).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Source register layers" })).toHaveCount(0);
  await expect(page.locator(".calibration-rail")).toContainText(/Showing 1–\d+ of \d+/);
});

test("compact Sources opens a modal inspector without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "CDAO AI Assurance Toolkit" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.locator(".source-register-row").first().locator(".source-mobile-meta")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth -
        globalThis.document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("Sources avoids redundant map-inclusion badges", async ({ page }) => {
  await gotoApp(page, "/#/sources");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText(/Used in map:/i)).toHaveCount(0);
  await expect(page.locator(".source-card .badge.tone-success")).toHaveCount(0);
});
