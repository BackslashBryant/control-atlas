import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const compareHelpers = readFileSync("src/ui/lib/compareHelpers.tsx", "utf8");
const css = readFileSync("src/styles/app.css", "utf8");

test("provenance badges always render text labels alongside tone classes", () => {
  assert.match(compareHelpers, /function PublicationStatusBadge/);
  assert.match(compareHelpers, /Inferred link/);
  assert.match(compareHelpers, /Official link/);
  assert.match(compareHelpers, /function ProvenanceBadge/);
  assert.match(compareHelpers, /displayNameFor\('provenance_class'/);
});

test("fedramp provenance token uses teal, not primary blueprint blue", () => {
  assert.match(css, /--ca-provenance-fedramp:\s*#0D9488/i);
  assert.doesNotMatch(css, /--ca-provenance-fedramp:\s*#2563EB/i);
  assert.match(css, /--ca-primary:\s*#2563EB/i);
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

test("full PRD provenance color tokens are defined", () => {
  for (const token of [
    "--ca-provenance-official",
    "--ca-provenance-dod",
    "--ca-provenance-nist",
    "--ca-provenance-disa",
    "--ca-provenance-fedramp",
    "--ca-provenance-mitre",
    "--ca-provenance-community",
    "--ca-provenance-inferred",
    "--ca-provenance-deprecated",
  ]) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

test("reduced motion preferences disable transitions and animations", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition:\s*none !important/);
  assert.match(css, /animation:\s*none !important/);
});
