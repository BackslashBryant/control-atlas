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

async function clickFlowNode(page, id) {
  const node = page.locator(`.react-flow__node:has([data-atlas-node-id="${id}"])`);
  await expect(node).toBeVisible();
  await node.dispatchEvent("click");
}

test("the Atlas landing shows nine honest areas and a populated area drills to its publications", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);

  await expect(page.getByRole("application", { name: "Interactive Atlas map hierarchy" })).toBeVisible();
  await expect(page.locator(".atlas-tree__areas [data-area-id]")).toHaveCount(9);
  await expect(page.locator(".atlas-tree__areas [data-area-id]:disabled")).toHaveCount(2);
  await expect(page.locator(".atlas-tree__areas").getByText("Nothing mapped yet.", { exact: true })).toHaveCount(2);

  await page.locator('.atlas-tree__areas [data-area-id="atlas:LIMB-COMPLIANCE"]').click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-COMPLIANCE/);
  await expect(
    page.locator('[data-atlas-node-id="nist-800-53:CATALOG"]'),
  ).toBeVisible();
});

test("a canvas branch survives refresh and its breadcrumb steps back one generation", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await clickFlowNode(page, "atlas:LIMB-COMPLIANCE");
  await clickFlowNode(page, "nist-800-53:CATALOG");
  await expect(page).toHaveURL(/atlasFramework=nist-800-53/);
  const breadcrumb = page.getByRole("navigation", { name: "Atlas breadcrumb" });
  await expect(breadcrumb).toContainText("Compliance");
  await expect(breadcrumb).toContainText("SP 800-53 Rev. 5 Catalog");

  await page.reload();
  await waitForAppReady(page);
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-layout-status", "ready");
  await expect(breadcrumb).toContainText("SP 800-53 Rev. 5 Catalog");

  await breadcrumb.getByRole("button", { name: "Compliance", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-COMPLIANCE/);
  await expect(page).not.toHaveURL(/atlasFramework=/);

  await page.goBack();
  await expect(breadcrumb).toContainText("SP 800-53 Rev. 5 Catalog");
});

test("family filtering is local and an empty result explains itself", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await clickFlowNode(page, "atlas:LIMB-COMPLIANCE");
  await clickFlowNode(page, "nist-800-53:CATALOG");
  await clickFlowNode(page, "nist-800-53:FAMILY-AC");
  const filter = page.getByLabel("Filter this family");
  await filter.fill("AC-2");
  await expect(page.locator(".atlas-path-record")).not.toHaveCount(0);
  await filter.fill("definitely-not-a-control");
  await expect(
    page.getByText("No structural children match that filter."),
  ).toBeVisible();
});
