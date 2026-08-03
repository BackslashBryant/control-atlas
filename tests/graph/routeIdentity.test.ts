import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_DESTINATIONS,
  canonicalizeHashLocation,
  recoveryViewFor,
  routeIdentityFor,
  selectedNavFor,
} from "../../src/ui/lib/routeIdentity";
import { parseHashLocation } from "../../src/ui/lib/hashRoutes";

test("route matrix preserves current durable destinations", () => {
  const cases = [
    {
      input: "/explore?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
      canonical: "/explore?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
    },
    {
      input: "/resources/official-nist-sp800-53-r5?from=templates",
      canonical: "/resources/official-nist-sp800-53-r5?from=templates",
    },
    {
      input: "/build?templateType=security_plan_starter&format=docx",
      canonical: "/build/documents/security_plan_starter?format=docx",
    },
    {
      input: "/resources?category=tools&lane=open_source&resourceType=tool",
      canonical: "/resources?category=tools&lane=open_source&resourceType=tool",
    },
    {
      input: "/search?q=access+control&connectedOnly=true",
      canonical: "/search?q=access+control&connectedOnly=true",
    },
    {
      input: "/catalog/nist-800-53?q=account&family=AC&browseAll=true",
      canonical: "/catalog/nist-800-53?q=account&family=AC&browseAll=true",
    },
    {
      input: "/build/documents?category=assessment&q=plan",
      canonical: "/build/documents?category=assessment&q=plan",
    },
    {
      input: "/start?step=dataSensitivity&systemType=Cloud+SaaS",
      canonical: "/start",
    },
    { input: "/?view=templates&templateType=security_plan_starter", canonical: "/?view=templates&templateType=security_plan_starter" },
  ];

  for (const { input, canonical } of cases) {
    const resolved = canonicalizeHashLocation(input);
    assert.equal(resolved.canonicalPath, canonical, input);
    assert.equal(resolved.requiresReplace, input !== canonical, input);
  }
});

test("invalid parameters are discarded with a visible recovery contract", () => {
  const resolved = canonicalizeHashLocation(
    "/explore?relationshipView=unsupported&sourceView=unknown&bogus=value",
  );

  assert.equal(resolved.canonicalPath, "/explore");
  assert.match(resolved.recoveryMessage, /removed|could not/i);
});

test("invalid Resources facet state recovers to the valid canonical browse scope", () => {
  const resolved = canonicalizeHashLocation("/resources?category=made-up&lifecycle=Monitor");
  assert.equal(resolved.canonicalPath, "/resources");
  assert.match(resolved.recoveryMessage, /removed|could not/i);
});

test("former Build-nested Resources links redirect to the top-level spoke", () => {
  const browse = canonicalizeHashLocation(
    "/build/resources?category=tools&lane=open_source",
  );
  assert.equal(
    browse.canonicalPath,
    "/resources?category=tools&lane=open_source",
  );
  assert.equal(browse.requiresReplace, true);

  const detail = canonicalizeHashLocation(
    "/build/resources/official-nist-sp800-53-r5?from=templates",
  );
  assert.equal(
    detail.canonicalPath,
    "/resources/official-nist-sp800-53-r5?from=templates",
  );
  assert.equal(
    parseHashLocation(
      "/build/resources/official-nist-sp800-53-r5",
      "?from=templates",
    ).view,
    "commons-detail",
  );
});

test("invalid comparison and boolean state fails closed", () => {
  const compare = canonicalizeHashLocation("/compare?crosswalk=decide-for-me&source=nist-800-53");
  assert.equal(compare.canonicalPath, "/compare?source=nist-800-53");
  assert.match(compare.recoveryMessage, /removed/i);

  const search = canonicalizeHashLocation("/search?q=AC-2&connectedOnly=yes");
  assert.equal(search.canonicalPath, "/search?q=AC-2");
  assert.match(search.recoveryMessage, /removed/i);
});

test("every routable state has one approved display identity", () => {
  for (const view of [
    "home", "start-here", "atlas-map", "search", "catalog-detail",
    "library-detail", "matrix", "patterns", "templates", "sources",
    "commons", "commons-detail", "about", "retired", "not-found",
  ] as const) {
    const identity = routeIdentityFor(view);
    assert.ok(identity.label, view);
    assert.ok(identity.title, view);
    assert.ok(identity.contextLabel, view);
  }

  assert.equal(routeIdentityFor("atlas-map").label, "Atlas");
  assert.equal(routeIdentityFor("search").label, "Library");
  assert.equal(routeIdentityFor("catalog-detail").label, "Library");
  assert.equal(routeIdentityFor("patterns").label, "Guides");
  assert.equal(routeIdentityFor("templates").label, "Documents");
  assert.equal(routeIdentityFor("commons").label, "Resources");
});

test("canonical destinations own URL, label, title, navigation, analytics, context, and recovery identity", () => {
  const expected = [
    ["home", "/", "Home", null, "home"],
    ["search", "/search", "Library", "catalog-detail", "search"],
    ["atlas-map", "/explore", "Atlas", "atlas-map", "explore"],
    ["catalog-detail", "/catalog", "Library", "catalog-detail", "catalog"],
    ["library-detail", "/record", "Record", "catalog-detail", "record_detail"],
    ["matrix", "/compare", "Compare", "matrix", "compare"],
    ["patterns", "/learn", "Guides", "patterns", "learn"],
    ["templates", "/build", "Documents", "templates", "build"],
    ["commons", "/resources", "Resources", "commons", "resources"],
    ["sources", "/sources", "Sources", "sources", "sources"],
    ["about", "/about", "About", null, "about"],
  ];

  assert.deepEqual(
    CANONICAL_DESTINATIONS.map((destination) => [
      destination.view,
      destination.path,
      destination.label,
      selectedNavFor(destination.view),
      destination.analyticsName,
    ]),
    expected,
  );
  for (const destination of CANONICAL_DESTINATIONS) {
    assert.equal(destination.title, destination.label, destination.view);
    // Search results are Library in navigation but name their own state in
    // the context bar, so contextLabel is allowed to differ there.
    if (destination.view !== "search") {
      assert.equal(destination.contextLabel, destination.label, destination.view);
    }
    assert.ok(recoveryViewFor(destination.view), destination.view);
    assert.doesNotMatch(destination.label, /atlas-map|catalog-detail|templates|patterns/);
  }
});

test("retired aliases no longer redirect and resolve to the not-found state", () => {
  for (const legacyPath of [
    "/menu", "/home", "/start-here", "/atlas-map", "/map",
    "/browse", "/compare-controls", "/source", "/playbooks",
    "/playbook", "/templates", "/template", "/build/community", "/commons",
    "/resource-bazaar", "/bazaar", "/hub",
    "/object/nist-800-53/AC-2",
  ]) {
    const canonical = canonicalizeHashLocation(legacyPath);
    assert.equal(canonical.canonicalPath, legacyPath, legacyPath);
    assert.equal(canonical.requiresReplace, false, legacyPath);
    assert.equal(parseHashLocation(legacyPath, "").view, "not-found", legacyPath);
  }

  const legacyDetail = canonicalizeHashLocation("/commons-detail?id=official-nist-sp800-53-r5");
  assert.equal(legacyDetail.canonicalPath, "/commons-detail");
  assert.equal(parseHashLocation("/commons-detail", "").view, "not-found");
});

test("query-bearing Explore links do not transfer into Search after alias retirement", () => {
  const canonical = canonicalizeHashLocation("/explore?q=account+management&objectType=control");
  assert.equal(canonical.canonicalPath, "/explore");
  assert.match(canonical.recoveryMessage, /removed/i);
  assert.equal(parseHashLocation("/explore", "").view, "atlas-map");
});

// Guard added 2026-08-01 after Start Here's limb routing shipped dead: the new
// atlasLimb field round-tripped through viewState fine, so every unit test
// passed, but canonicalizeHashLocation silently stripped it as an unsupported
// parameter and the link landed on a generic page with a recovery message.
// A route field that the canonicalizer does not allow is a field that does not
// exist in production, so assert every one of them survives a round trip.
test("every durable view field survives canonicalization", () => {
  const SAMPLES: Array<[string, Record<string, string>]> = [
    [
      "/explore",
      {
        node: "nist-800-53:AC-2",
        atlasAxis: "framework",
        atlasLimb: "atlas:LIMB-COMPLIANCE",
        atlasFramework: "nist-800-53",
        atlasBaseline: "nist-800-53b:MODERATE",
        atlasFamily: "nist-800-53:AC",
        atlasRmfStep: "nist-800-37:RMF-SELECT",
        relationshipView: "path",
      },
    ],
    ["/search", { q: "access control", objectType: "control" }],
    ["/catalog", { q: "AC", family: "AC", page: "2", area: "Compliance" }],
    [
      "/resources",
      { q: "reddit", lane: "practitioner", category: "community" },
    ],
  ];

  for (const [path, params] of SAMPLES) {
    for (const [key, value] of Object.entries(params)) {
      const url = `${path}?${key}=${encodeURIComponent(value)}`;
      const canonical = canonicalizeHashLocation(url);
      assert.ok(
        canonical.canonicalPath.includes(`${key}=`),
        `${key} was stripped from ${path}: ${canonical.canonicalPath}`,
      );
      assert.equal(
        canonical.recoveryMessage,
        "",
        `${key} on ${path} triggered a recovery message`,
      );
    }
  }
});

// 2026-08-03: the public names are Atlas, Library, Guides, and Documents. Both
// the new name and the long-standing canonical path must reach the surface, so
// no existing bookmark breaks and no new name is a dead link.
test("public-name URLs resolve to their canonical surface", () => {
  for (const [alias, canonicalPath, view] of [
    ["/atlas", "/explore", "atlas-map"],
    ["/library", "/catalog", "catalog-detail"],
    ["/guides", "/learn", "patterns"],
    ["/documents", "/build", "templates"],
    ["/library/nist-800-53", "/catalog/nist-800-53", "catalog-detail"],
  ] as const) {
    const canonical = canonicalizeHashLocation(alias);
    assert.equal(canonical.canonicalPath, canonicalPath, alias);
    assert.equal(canonical.requiresReplace, true, alias);
    assert.equal(parseHashLocation(alias, "").view, view, alias);
  }

  // The canonical paths keep working untouched.
  for (const [path, view] of [
    ["/explore", "atlas-map"],
    ["/catalog", "catalog-detail"],
    ["/learn", "patterns"],
    ["/build", "templates"],
  ] as const) {
    assert.equal(canonicalizeHashLocation(path).requiresReplace, false, path);
    assert.equal(parseHashLocation(path, "").view, view, path);
  }
});

test("Start here answers survive canonicalization", () => {
  const canonical = canonicalizeHashLocation("/start?goal=assess&context=fedramp");
  assert.equal(canonical.canonicalPath, "/start?goal=assess&context=fedramp");
  const state = parseHashLocation("/start", "?goal=assess&context=fedramp");
  assert.equal(state.view, "start-here");
  assert.equal((state as { goal: string }).goal, "assess");
  assert.equal((state as { context: string }).context, "fedramp");
});
