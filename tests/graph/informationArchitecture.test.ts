import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LIBRARY_KINDS,
  USER_FILTER_EXCLUDED_TYPES,
  libraryKindForRawType,
  rawTypesForKind,
} from "../../src/ui/lib/informationArchitecture";
import { PRIMARY_NAV_ITEMS, UTILITY_NAV_ITEMS } from "../../src/ui/lib/navigation";

test("Phase 3 exposes exactly three primary doors and two utilities", () => {
  assert.deepEqual(
    PRIMARY_NAV_ITEMS.map(({ label, path }) => [label, path]),
    [["Start here", "/start"], ["Library", "/library"], ["Guides", "/guides"]],
  );
  assert.deepEqual(
    UTILITY_NAV_ITEMS.map(({ label, path }) => [label, path]),
    [["Sources", "/sources"], ["About", "/about"]],
  );
  assert.equal(new Set([...PRIMARY_NAV_ITEMS, ...UTILITY_NAV_ITEMS].map(({ path }) => path)).size, 5);
});

test("Library uses the canonical two-tier taxonomy", () => {
  assert.deepEqual(
    LIBRARY_KINDS.map(({ label }) => label),
    [
      "Requirements",
      "Technical rules",
      "Threats & defenses",
      "Baselines & profiles",
      "Process & methods",
      "Tools & communities",
    ],
  );
  assert.equal(libraryKindForRawType("control"), "requirements");
  assert.equal(libraryKindForRawType("stig_rule"), "technical-rules");
  assert.equal(libraryKindForRawType("attack_technique"), "threats-defenses");
  assert.equal(libraryKindForRawType("baseline"), "baselines-profiles");
  assert.equal(libraryKindForRawType("assessment_procedure"), "process-methods");
  assert.equal(libraryKindForRawType("community_forum"), "tools-communities");
});

test("internal hierarchy nodes never become user-facing type refinements", () => {
  for (const excluded of ["limb", "trunk", "group", "function", "family", "category"]) {
    assert.equal(USER_FILTER_EXCLUDED_TYPES.has(excluded), true, excluded);
    assert.equal(libraryKindForRawType(excluded), "", excluded);
    assert.equal(LIBRARY_KINDS.some(({ id }) => rawTypesForKind(id).includes(excluded)), false, excluded);
  }
});

test("the permanent placement rule and complete relocation audit stay in repository guidance", () => {
  const contributing = readFileSync("CONTRIBUTING.md", "utf8");
  for (const rule of [
    "New content becomes a Library facet value.",
    "A new content action becomes a record action or Library bulk mode.",
    "A new explanation becomes a Guide.",
    "A new provenance or trust surface belongs in Sources or the footer.",
    "Only a genuinely new product earns a primary navigation slot.",
  ]) {
    assert.match(contributing, new RegExp(rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const plan = readFileSync("docs/plans/epic-12-first-click-clarity-2026-08-08.md", "utf8");
  const movedSurfaces = [
    "Atlas overview",
    "Atlas record focus",
    "Compare",
    "Documents",
    "Tasks",
    "Resources directory",
    "Curated resource collections",
    "Resource detail",
    "Catalog",
    "Publication detail",
    "Search",
    "Help",
    "Guides",
  ];
  assert.match(plan, /\| Moved surface \| Old route \| New home \| Redirect \| Tested click path \|/);
  for (const surface of movedSurfaces) {
    const row = plan.split("\n").find((line) => line.startsWith(`| ${surface} |`));
    assert.ok(row, `${surface} must appear in the permanent relocation audit`);
    assert.equal(row.split("|").slice(1, -1).every((cell) => cell.trim().length > 0), true, `${surface} must keep a tested click path`);
  }
});
