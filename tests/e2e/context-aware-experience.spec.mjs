import { test, expect } from "@playwright/test";

async function open(page, path) {
  await page.goto(path);
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
}

test("Home is a universal, work-first front door", async ({ page }) => {
  await open(page, "/#/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find the source",
  );
  await expect(page.getByRole("searchbox", { name: "Search Control Atlas" })).toBeVisible();
  for (const entrance of [
    "Understand a requirement",
    "Secure or build a system",
    "Assess or authorize",
    "Operate or defend",
    "Manage risk or supply chain",
    "Produce a document",
    "Find a tool, template, portal, training source, or community",
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(entrance) })).toBeVisible();
  }
  await expect(page.getByText("SP 800-171 · Supply Chain Risk Management · 3.17.1")).toBeVisible();
  await expect(page.getByText("ATT&CK · Initial Access · T1195.002")).toBeVisible();
});

test("record keeps official material primary and separates published facts from suggestions", async ({
  page,
}) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await expect(page.getByText("Official description", { exact: true })).toBeVisible();
  await expect(page.getByText("Published fact")).toBeVisible();
  const editorial = page.locator('[data-editorial-boundary="explicit"]');
  await expect(editorial).toBeVisible();
  await expect(editorial.getByText("Control Atlas suggestions", { exact: true }).first()).toBeVisible();
  await expect(editorial.getByText(/Why shown:/).first()).toBeVisible();

  const order = await page.evaluate(() => {
    const official = [...globalThis.document.querySelectorAll("article")].find((element) =>
      /Official description/.test(element.textContent || ""),
    );
    const editorial = globalThis.document.querySelector('[data-editorial-boundary="explicit"]');
    return Boolean(
      official &&
        editorial &&
        official.compareDocumentPosition(editorial) & globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  expect(order).toBe(true);
});

test("record actions preserve durable context across features", async ({ page }) => {
  await open(page, "/#/record/nist-800-53/AC-2");
  await page.getByRole("button", { name: "Open in the Atlas" }).click();
  await expect(page).toHaveURL(/#\/explore\?.*node=nist-800-53%3AAC-2/);

  await open(page, "/#/record/nist-800-53/AC-2");
  await page.getByText("More actions").click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page).toHaveURL(/#\/compare\?.*(source=nist-800-53.*items=AC-2|items=AC-2.*source=nist-800-53)/);

  await open(page, "/#/record/nist-800-53/AC-2");
  await page.getByRole("button", { name: "View all matching resources" }).first().click();
  await expect(page).toHaveURL(/#\/resources\?.*q=/);
});

test("record types receive conservative, useful sections and sparse records omit them", async ({
  page,
}) => {
  const cases = [
    ["/#/record/disa-cci/CCI-000001", "Implementation"],
    ["/#/record/disa-stig/V-222387", "Implementation and validation"],
    ["/#/record/mitre-attack/T1195.002", "Threat intelligence"],
    ["/#/record/nist-800-171/3.17.1", "Acquisition and supply chain"],
  ];
  for (const [path, section] of cases) {
    await open(page, path);
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
    await expect(page.getByText(/Why shown:/).first()).toBeVisible();
  }

  await open(page, "/#/record/cmmc-2/LEVEL-2");
  await expect(page.locator(".record-suggestion-group")).toHaveCount(0);
});

test("universal search keeps result classes visibly distinct", async ({ page }) => {
  await open(page, "/#/search?q=supply%20chain");
  const classes = await page
    .locator("[data-result-class]")
    .evaluateAll((elements) => [...new Set(elements.map((element) => element.dataset.resultClass))]);
  expect(classes).toContain("published-record");
  expect(classes.some((value) => ["ecosystem-resource", "official-resource", "starter-document"].includes(value))).toBe(true);
  await expect(page.getByText(/Why matched:/).first()).toBeVisible();
});
