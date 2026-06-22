import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const compareHelpers = readFileSync("src/ui/lib/compareHelpers.tsx", "utf8");
const tokens = readFileSync("styles/tokens.css", "utf8");
const baseCss = readFileSync("styles/base.css", "utf8");
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
