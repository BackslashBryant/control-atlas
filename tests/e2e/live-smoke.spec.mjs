import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("live smoke: home trust links and AC-2 explore path", async ({ page }) => {
  test.setTimeout(120000);
  await gotoApp(page, "/");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  if (process.env.PLAYWRIGHT_BASE_URL) {
    expect(page.url()).toContain("/control-atlas/");
  }
  await expect(
    page.getByRole("button", { name: "About this tool" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review sources" }),
  ).toBeVisible();

  await gotoApp(page, "/?view=explore&q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.locator("#library-results .result-card").first(),
  ).toBeVisible({
    timeout: 30000,
  });
});

test("live smoke: compare hub loads", async ({ page }) => {
  await gotoApp(page, "/?view=matrix");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "What do you want to compare?" }),
  ).toBeVisible();
});

test("live smoke: deployed runtime cache version matches source", async ({
  request,
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    "deployed runtime version check only runs against the live site",
  );
  const source = readFileSync("src/ui/lib/runtimeLoader.ts", "utf8");
  const expectedVersion = source.match(/CACHE_VERSION = "([^"]+)"/)?.[1];
  expect(expectedVersion).toBeTruthy();

  const home = await request.get(process.env.PLAYWRIGHT_BASE_URL);
  expect(home.ok()).toBeTruthy();
  const html = await home.text();
  const asset = html.match(/assets\/index-[^"']+\.js/)?.[0];
  expect(asset).toBeTruthy();

  const script = await request.get(new URL(asset, `${process.env.PLAYWRIGHT_BASE_URL}/`).toString());
  expect(script.ok()).toBeTruthy();
  await expect(script.text()).resolves.toContain(expectedVersion);
});
