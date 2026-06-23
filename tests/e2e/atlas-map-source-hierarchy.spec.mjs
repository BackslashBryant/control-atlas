import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("Atlas Map starts with nine ordered source categories", async ({ page }) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByText("Explore the compliance ecosystem."),
  ).toBeVisible();

  const nodes = page.getByRole("group", { name: "Map nodes" }).getByRole("button");
  await expect(nodes).toHaveCount(9);
  await expect(page.getByRole("button", { name: "Authority", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Governance / Risk Framework",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Control Catalog / Requirement Set",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Map nodes" })
      .getByRole("button", { name: "NIST SP 800-53 Rev. 5", exact: true }),
  ).toHaveCount(0);

  const authorityRank = Number(
    await page.getByRole("button", { name: "Authority", exact: true }).getAttribute("data-layout-rank"),
  );
  const governanceRank = Number(
    await page
      .getByRole("button", { name: "Governance / Risk Framework", exact: true })
      .getAttribute("data-layout-rank"),
  );
  const catalogRank = Number(
    await page
      .getByRole("button", {
        name: "Control Catalog / Requirement Set",
        exact: true,
      })
      .getAttribute("data-layout-rank"),
  );
  expect(authorityRank).toBeLessThan(governanceRank);
  expect(governanceRank).toBeLessThan(catalogRank);
  await expect(
    page.getByRole("button", { name: "Supporting Reference", exact: true }),
  ).toHaveAttribute("data-deemphasized", "true");
});

test("selecting the control catalog category shows translation-first guidance", async ({
  page,
}) => {
  await page.goto("/#/atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page
    .getByRole("button", {
      name: "Control Catalog / Requirement Set",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Control Catalog / Requirement Set",
      level: 2,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Primary requirement sources that define controls or security requirements.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore sources" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View as list" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open related controls" })).toBeVisible();
});
