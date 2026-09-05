import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

/**
 * Geometry contracts for the two Atlas surfaces.
 *
 * Both defects these cover shipped green: the unit suite, axe, and every
 * name-and-testid e2e spec passed while the landscape drew twenty-four
 * overlapping pairs of cards and the drill-down rendered every row name at
 * zero pixels wide. Nothing in the suite could see either one, because
 * nothing measured what the reader actually gets. These assertions do.
 *
 * Widths span the band where the drill-down sidebar coexists with horizontal
 * columns (~1101-1400px), which is where the name track collapsed, plus the
 * wider and narrower layouts either side of it.
 */
const WIDTHS = [1440, 1280, 1113, 1024, 768];

/** Rectangles that share any area at all. Touching edges are fine; overlap is not. */
async function overlappingPairs(page, selector) {
  return page.evaluate((sel) => {
    const boxes = [...document.querySelectorAll(sel)].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        label: node.textContent?.trim().slice(0, 40) || node.className,
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
      };
    });
    const pairs = [];
    for (let left = 0; left < boxes.length; left += 1) {
      for (let right = left + 1; right < boxes.length; right += 1) {
        const a = boxes[left];
        const b = boxes[right];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapX > 1 && overlapY > 1) {
          pairs.push(
            `${a.label} / ${b.label} (${Math.round(overlapX)}x${Math.round(overlapY)}px)`,
          );
        }
      }
    }
    return pairs;
  }, selector);
}

async function horizontalOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const width of WIDTHS) {
  test(`Atlas landscape draws every framework without collision at ${width}px`, async ({ page }) => {
    attachPageDiagnostics(page);
    await page.setViewportSize({ width, height: 900 });
    // The landing is the board of groups; the drawn hierarchy lives one level
    // in, over the frameworks of a single group. Implementation and
    // configuration is the widest of them (eight publications), so it is the
    // one most likely to collide.
    await page.goto("/#/atlas?atlasLensFamily=implementation");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const landscape = page.getByTestId("atlas-constellation");
    await expect(landscape).toBeVisible();

    // Below the compact breakpoint the landscape is deliberately a list, and a
    // list cannot collide with itself. Above it, a drawn card must never sit
    // on top of another: two names in the same pixels is two names nobody can
    // read.
    const drawn = await page.locator(".atlas-constellation__node").count();
    if (drawn > 0) {
      const collisions = await overlappingPairs(page, ".atlas-constellation__node");
      expect(collisions, `overlapping framework cards at ${width}px`).toEqual([]);
    }

    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  });

  test(`Atlas landing groups the corpus without collision at ${width}px`, async ({ page }) => {
    attachPageDiagnostics(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/atlas");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const board = page.getByTestId("atlas-family-board");
    await expect(board).toBeVisible();

    const collisions = await overlappingPairs(page, ".atlas-family-board__card");
    expect(collisions, `overlapping group cards at ${width}px`).toEqual([]);

    // Every group names its members at rest. A card that opens to reveal what
    // is inside it is a mystery box, and the whole point of grouping first is
    // that the reader can choose without opening anything.
    const named = await page.locator(".atlas-family-board__members button").count();
    expect(named, `member names on the board at ${width}px`).toBeGreaterThan(20);

    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  });

  test(`Atlas drill-down shows every row's name at ${width}px`, async ({ page }) => {
    attachPageDiagnostics(page);
    await page.setViewportSize({ width, height: 900 });
    // Scoped to a framework: the view that also renders the crosswalks
    // sidebar, which is what squeezed the columns until the name track
    // resolved to zero.
    await page.goto("/#/atlas?atlasLanding=publishers&atlasLimb=ecosystem%3Anist&atlasFramework=nist-800-53");
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const rows = page.locator(".atlas-decomp__label");
    await expect(rows.first()).toBeVisible();

    const starved = await page.evaluate(() => {
      // An absolute floor, not a proportion. A name may be ellipsised — some
      // catalog titles are 328px long and will never fit a drill-down column —
      // but enough has to survive to tell one row from another. A proportional
      // rule would condemn any sufficiently long name however much room it got,
      // which is not the defect. Zero pixels is: that is deletion, not
      // truncation, and it is what shipped.
      const LEGIBLE_PX = 88;
      const bad = [];
      for (const label of document.querySelectorAll(".atlas-decomp__label")) {
        const width = label.getBoundingClientRect().width;
        const needed = label.scrollWidth;
        if (width + 1 < Math.min(needed, LEGIBLE_PX)) {
          bad.push(`"${label.textContent?.trim()}" rendered ${Math.round(width)}px of ${needed}px`);
        }
      }
      return bad;
    });
    expect(starved, `starved row names at ${width}px`).toEqual([]);

    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  });
}
