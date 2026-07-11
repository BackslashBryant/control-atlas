import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const compareHelpers = readFileSync("src/ui/lib/compareHelpers.tsx", "utf8");
const tokens = readFileSync("styles/tokens.css", "utf8");
const baseCss = readFileSync("styles/base.css", "utf8");
const componentsCss = readFileSync("styles/components.css", "utf8");
const surfacesCss = readFileSync("styles/surfaces.css", "utf8");
const provenanceBadge = readFileSync(
  "src/ui/components/ProvenanceBadge.tsx",
  "utf8",
);

test("provenance badges always render text labels alongside tone classes", () => {
  const provenanceTerm = readFileSync(
    "src/ui/components/ProvenanceTerm.tsx",
    "utf8",
  );
  assert.match(compareHelpers, /function PublicationStatusBadge/);
  assert.match(compareHelpers, /Inferred link/);
  assert.match(compareHelpers, /Official link/);
  assert.match(compareHelpers, /function ProvenanceBadge/);
  assert.match(compareHelpers, /ProvenanceTerm/);
  assert.match(provenanceBadge, /entry\.label/);
  assert.match(provenanceTerm, /displayNameFor\("provenance_class"/);
});

test("fedramp provenance token uses teal, not primary blueprint blue", () => {
  assert.match(tokens, /--ca-prov-fedramp:\s*#0D9488/i);
  assert.doesNotMatch(tokens, /--ca-prov-fedramp:\s*#2563EB/i);
  assert.match(tokens, /--ca-primary:\s*#2563EB/i);
});

test("relationship graph surfaces include accessible table fallback and provenance legend", () => {
  const explorer = readFileSync(
    "src/ui/components/RelationshipExplorer.tsx",
    "utf8",
  );
  const table = readFileSync(
    "src/ui/components/RelationshipGraphTable.tsx",
    "utf8",
  );
  assert.match(explorer, /Atlas Map/);
  assert.match(explorer, /role="tablist"/);
  assert.match(explorer, /Map legend/);
  assert.match(table, /aria-label="Relationship table"/);
  assert.match(table, /ProvenanceBadge/);
});

test("compare view state and provenance term support accessible descriptions", () => {
  const viewState = readFileSync("src/ui/lib/viewState.ts", "utf8");
  const provenanceTerm = readFileSync(
    "src/ui/components/ProvenanceTerm.tsx",
    "utf8",
  );
  assert.match(viewState, /compareView/);
  assert.match(provenanceTerm, /aria-describedby/);
  assert.match(provenanceTerm, /visually-hidden/);
});

test("full PRD provenance color tokens are defined", () => {
  for (const token of [
    "--ca-prov-official",
    "--ca-prov-dod",
    "--ca-prov-nist",
    "--ca-prov-disa",
    "--ca-prov-fedramp",
    "--ca-prov-mitre",
    "--ca-prov-community",
    "--ca-prov-inferred",
    "--ca-prov-deprecated",
  ]) {
    assert.match(tokens, new RegExp(`${token}:`));
  }
});

test("reduced motion preferences disable transitions and animations", () => {
  assert.match(baseCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(baseCss, /animation-duration: 0\.01ms !important/);
  assert.match(baseCss, /transition-duration: 0\.01ms !important/);
});

test("hash router shim redirects legacy view query params", () => {
  const hashRoutes = readFileSync("src/ui/lib/hashRoutes.ts", "utf8");
  assert.match(hashRoutes, /applyLegacyQueryRedirect/);
  assert.match(hashRoutes, /serializeHashLocation/);
});

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map((offset) =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16),
  );
}

function relativeLuminance(hex) {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function contrastRatio(foreground, background) {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function tokenValue(name) {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `Missing ${name}`);
  return match[1];
}

test("secondary text and provenance badge text meet WCAG AA contrast", () => {
  const surface = tokenValue("--ca-surface");
  assert.ok(
    contrastRatio(tokenValue("--ca-text-subtle"), surface) >= 4.5,
    "Secondary text must meet 4.5:1 on cards",
  );

  for (const token of [
    "--ca-prov-official-text",
    "--ca-prov-dod-text",
    "--ca-prov-nist-text",
    "--ca-prov-disa-text",
    "--ca-prov-fedramp-text",
    "--ca-prov-mitre-text",
    "--ca-prov-community-text",
    "--ca-prov-inferred-text",
    "--ca-prov-deprecated-text",
    "--ca-prov-active-text",
  ]) {
    assert.ok(
      contrastRatio(tokenValue(token), surface) >= 4.5,
      `${token} must meet 4.5:1 on cards`,
    );
    assert.match(componentsCss, new RegExp(`color:\\s*var\\(${token}\\)`));
  }
});

test("search and glossary dialogs expose accessible control names", () => {
  const searchOverlay = readFileSync(
    "src/ui/components/SearchOverlay.tsx",
    "utf8",
  );
  const glossaryDrawer = readFileSync(
    "src/ui/components/GlossaryDrawer.tsx",
    "utf8",
  );
  assert.match(searchOverlay, /aria-label="Search records and glossary"/);
  assert.match(glossaryDrawer, /aria-label="Close help and glossary"/);
  assert.match(glossaryDrawer, /glossaryTabRef\.current\?\.focus\(\)/);
  assert.match(glossaryDrawer, /helpTabRef\.current\?\.focus\(\)/);
});

test("landing launch actions expose their visible text to assistive technology", () => {
  const homePage = readFileSync("src/ui/pages/HomePage.tsx", "utf8");
  // The orb's accessible name is its visible caption; satellite buttons carry
  // visible label + description text. No landing action text may be
  // aria-hidden (SPR finding A11Y-001).
  assert.match(homePage, /Click to start/);
  assert.doesNotMatch(homePage, /<h3 aria-hidden/);
  assert.doesNotMatch(homePage, /<p aria-hidden/);
  assert.doesNotMatch(homePage, /aria-label="Research/);
  assert.doesNotMatch(homePage, /aria-label="Build/);
});

test("compact icon and chip controls retain 44 pixel touch targets", () => {
  const block = surfacesCss.match(/\.icon-button,\s*\.chip\s*\{([^}]*)\}/);
  assert.ok(block, "Missing shared icon and chip control rule");
  assert.match(block[1], /min-height:\s*44px;/);
  assert.match(block[1], /min-width:\s*44px;/);
});

test("coverage-transparency surfaces warn users when a catalog is under-mapped", () => {
  // CATL coverage blocker: low-coverage catalogs stay visible but must be
  // labelled so users do not read a missing link as proof of no relationship.
  const catalogCoverage = readFileSync(
    "src/ui/lib/catalogCoverage.ts",
    "utf8",
  );
  const sourcesPage = readFileSync("src/ui/pages/SourcesPage.tsx", "utf8");
  const explorePage = readFileSync("src/ui/pages/ExplorePage.tsx", "utf8");

  // isLowCatalogCoverage flags any catalog below the 75% coverage threshold.
  assert.match(catalogCoverage, /export function isLowCatalogCoverage/);
  assert.match(catalogCoverage, /coverage\.pct\s*<\s*75/);

  // SourcesPage carries the supported-catalog contract statement and drives a
  // "Preview / low coverage" badge from isLowCatalogCoverage.
  assert.match(sourcesPage, /Supported catalogs/);
  assert.match(sourcesPage, /Preview \/ low coverage/);
  assert.match(sourcesPage, /not that no relationship exists/);
  assert.match(sourcesPage, /isLowCatalogCoverage\(catalog\)/);

  // ExplorePage result cards derive coverage per document and surface a
  // "Limited coverage" badge so absence of a link is not over-trusted.
  assert.match(explorePage, /catalogCoverageForId\(catalogCoverage/);
  assert.match(explorePage, /Limited coverage/);
});
