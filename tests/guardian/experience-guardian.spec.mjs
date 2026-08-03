import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const matrix = JSON.parse(
  await readFile("config/experience-guardian/route-matrix.json", "utf8"),
);
const outputDir = join(process.cwd(), "artifacts", "experience-guardian");
const screenshotDir = join(outputDir, "screenshots");
const renderedFindings = [];
const screenshots = [];

await mkdir(screenshotDir, { recursive: true });

const cases = matrix.states.flatMap((state) =>
  state.viewports.map((viewport) => ({
    state,
    viewport,
    size: matrix.viewports[viewport],
  })),
);

test.describe("Control Atlas Experience Guardian", () => {
  for (const reviewCase of cases) {
    const { state, viewport, size } = reviewCase;
    test(`${state.id} · ${viewport}`, async ({ page }) => {
      await page.setViewportSize(size);

      if (state.scenario === "loading") {
        await page.route("**/catalog-bootstrap.json", async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await route.continue();
        });
        await page.goto(state.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(350);
      } else {
        await page.goto(state.path);
        await expect(page.locator('[data-app-ready="true"]')).toBeVisible({
          timeout: 30000,
        });
      }

      const screenshot = join(screenshotDir, `${state.id}--${viewport}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      screenshots.push(screenshot.replaceAll("\\", "/"));

      if (state.scenario === "loading") {
        await expect(page.locator("body")).toContainText(/loading|opening|search/i);
        return;
      }

      await expect(page.locator("h1:visible").first()).toBeVisible();
      if (state.expectedIdentity) {
        await expect(
          page.locator(`[data-visual-identity="${state.expectedIdentity}"]`).first(),
        ).toBeVisible();
      }

      if (state.officialBeforeEditorial && viewport === "mobile") {
        const order = await page.evaluate(() => {
          const official = [...globalThis.document.querySelectorAll("article")].find((element) =>
            /Official description|Source identity unavailable/.test(element.textContent || ""),
          );
          const editorial = globalThis.document.querySelector('[data-editorial-boundary="explicit"]');
          if (!official || !editorial) return "missing";
          return official.compareDocumentPosition(editorial) & globalThis.Node.DOCUMENT_POSITION_FOLLOWING
            ? "official-first"
            : "editorial-first";
        });
        expect(order).toBe("official-first");
      }

      const cards = await page.locator(".result-card, .summary-card, .card").count();
      const signatures = await page
        .locator(".result-card, .summary-card, .card")
        .evaluateAll((elements) => new Set(elements.map((element) => element.className)).size);
      if (cards >= 14 && signatures / cards < 0.2) {
        renderedFindings.push({
          severity: "warning",
          route: state.path,
          viewport,
          target: ".result-card, .summary-card, .card",
          principle: "Visual identity and monotony",
          evidence: `${cards} card-like regions use ${signatures} class signatures.`,
          recommendation: "Delete redundant containers or introduce a task-specific information shape.",
        });
      }

      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = accessibility.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact),
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }

  test.afterAll(async () => {
    const report = {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      command: "review:experience",
      reviewStates: matrix.states.length,
      screenshots,
      findings: renderedFindings,
    };
    await writeFile(
      join(outputDir, "rendered-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    const rows = renderedFindings.length
      ? renderedFindings
          .map(
            (finding) =>
              `| ${finding.severity} | ${finding.route} | ${finding.viewport} | ${finding.target} | ${finding.principle} | ${finding.recommendation} |`,
          )
          .join("\n")
      : "| note | all | all | - | Rendered review | No report-only findings. |";
    await writeFile(
      join(outputDir, "rendered-report.md"),
      `# Control Atlas rendered experience review\n\nCaptured ${screenshots.length} screenshots across ${matrix.states.length} registered states.\n\n| Severity | Route | Viewport | Target | Principle | Recommendation |\n|---|---|---|---|---|---|\n${rows}\n`,
    );
  });
});
