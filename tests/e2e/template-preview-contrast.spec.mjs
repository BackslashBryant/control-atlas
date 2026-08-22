import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

// Renders a real document preview. The preview only mounts once the required
// inputs resolve, so both selects are driven natively before asserting.
async function openPreview(page) {
  await gotoApp(page, "/#/build/documents/assessment_planning_worksheet?format=xlsx");
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);

  await page.getByLabel("Catalog or program").selectOption("nist-800-53");
  const baseline = page.getByLabel("Baseline");
  await expect(baseline).toBeEnabled();
  await baseline.selectOption("ALL");

  await expect(page.locator(".template-document-preview")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".template-document-preview td").first()).toBeVisible();
}

// Walks every text-bearing node in the preview and computes its contrast
// against the real painted ground, resolving gradient stops (a gradient is a
// background-image, so reading background-color alone reports a false pass or
// a false failure depending on the ancestor).
function contrastProbe() {
  const parse = (value) => {
    const parts = String(value).match(/[\d.]+/g);
    return parts ? parts.slice(0, 3).map(Number) : null;
  };
  const luminance = (color) => {
    const channels = color.map((raw) => {
      const v = raw / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const gradientStops = (el) => {
    const image = getComputedStyle(el).backgroundImage;
    const plain = [...image.matchAll(/rgba?\(([\d.,\s]+)\)/g)]
      .map((m) => m[1].split(",").slice(0, 3).map(Number));
    const wide = [...image.matchAll(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)/g)]
      .map((m) => [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255]);
    const stops = [...plain, ...wide];
    return stops.length ? stops : null;
  };
  const grounds = (el) => {
    let node = el;
    while (node) {
      const stops = gradientStops(node);
      if (stops) return stops;
      const style = getComputedStyle(node);
      const color = parse(style.backgroundColor);
      const alpha = (style.backgroundColor.match(/[\d.]+/g) || [])[3];
      if (color && alpha !== "0") return [color];
      node = node.parentElement;
    }
    return [[255, 255, 255]];
  };

  const root = document.querySelector(".template-document-preview");
  if (!root) return [{ tag: "MISSING", text: "no preview rendered", ratio: 0, required: 4.5 }];
  const failures = [];
  for (const el of root.querySelectorAll("*")) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const style = getComputedStyle(el);
    const fg = parse(style.color);
    const worst = Math.min(...grounds(el).map((bg) => ratio(fg, bg)));
    const px = parseFloat(style.fontSize);
    const bold = parseInt(style.fontWeight, 10) >= 700;
    const required = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
    if (worst < required) {
      failures.push({
        tag: el.tagName,
        text: el.textContent.trim().slice(0, 30),
        ratio: Number(worst.toFixed(2)),
        required,
        fontPx: px,
      });
    }
  }
  return failures;
}

// Guards the exact regression the audit measured: the global \`table\` rule
// paints --ca-surface (dark app chrome), which leaked behind preview cells that
// declared no background and put #20242c document ink on #2d3a42 -- 1.33:1.
test("every text node in a document preview meets WCAG AA contrast", async ({ page }) => {
  await openPreview(page);
  const failures = await page.evaluate(contrastProbe);
  expect(failures, `contrast failures: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
});

test("preview table cells sit on paper, not on the dark app surface", async ({ page }) => {
  await openPreview(page);
  const rows = await page.locator(".template-document-preview tbody td").evaluateAll((cells) =>
    cells.slice(0, 6).map((cell) => getComputedStyle(cell).backgroundColor),
  );
  expect(rows.length).toBeGreaterThan(0);
  for (const background of rows) {
    // Both paper tones are near-white; the dark surface is rgb(45,58,66).
    const [r, g, b] = background.match(/[\d.]+/g).slice(0, 3).map(Number);
    expect(r + g + b, `cell background ${background} is not paper`).toBeGreaterThan(600);
  }
});

test("the header ramp only darkens, so white text never degrades across it", async ({ page }) => {
  await openPreview(page);
  const contrasts = await page.locator(".template-document-preview-header").evaluate((header) => {
    const image = getComputedStyle(header).backgroundImage;
    const plain = [...image.matchAll(/rgba?\(([\d.,\s]+)\)/g)]
      .map((m) => m[1].split(",").slice(0, 3).map(Number));
    const wide = [...image.matchAll(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)/g)]
      .map((m) => [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255]);
    const luminance = (color) => color
      .map((raw) => {
        const v = raw / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      })
      .reduce((sum, v, i) => sum + [0.2126, 0.7152, 0.0722][i] * v, 0);
    return [...plain, ...wide].map((stop) => 1.05 / (luminance(stop) + 0.05));
  });

  expect(contrasts.length).toBeGreaterThanOrEqual(2);
  for (const contrast of contrasts) {
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});

test("the horizontally scrolling preview table is a named keyboard destination", async ({ page }) => {
  await openPreview(page);
  const wrap = page.locator(".template-document-preview-table-wrap").first();
  await expect(wrap).toHaveAttribute("role", "region");
  await expect(wrap).toHaveAttribute("tabindex", "0");
  await expect(wrap).toHaveAttribute("aria-label", /scrolls horizontally/i);

  await wrap.focus();
  await expect(wrap).toBeFocused();
});
