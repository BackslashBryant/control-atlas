import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

// W5: library-search-manifest.json only eager-loads 3 of 23 catalog shards
// (nist-800-53, csf-2, fedramp-rev5); the other 20 load lazily, one at a
// time, on requestIdleCallback, in manifest order. cmmc-2 sits near the back
// of that queue (17th of 20). On a fast local server the whole queue drains
// in a couple seconds regardless, so this test throttles every library-search
// shard fetch to make the queue-position bug observable: without a priority
// fetch, cmmc-2 would sit behind ~16 delayed shards; with one, it jumps the
// queue and renders in roughly one delay interval.
test("cold deep link into a non-eager catalog renders the record, not a not-found page", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.route("**/library-search/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await gotoApp(page, "/#/record/cmmc-2/LEVEL-2");
  await waitForAppReady(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /LEVEL-2|Level 2/i,
    { timeout: 4000 },
  );
  await expect(page.getByText("Item not found")).toHaveCount(0);
});
