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
      input: "/build/resources/official-nist-sp800-53-r5?from=templates",
      canonical: "/build/resources/official-nist-sp800-53-r5?from=templates",
    },
    {
      input: "/build?templateType=security_plan_starter&format=docx",
      canonical: "/build/documents/security_plan_starter?format=docx",
    },
    {
      input: "/build/resources?category=tools&lane=open_source&resourceType=tool",
      canonical: "/build/resources?category=tools&lane=open_source&resourceType=tool",
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
  const resolved = canonicalizeHashLocation("/build/resources?category=made-up&lifecycle=Monitor");
  assert.equal(resolved.canonicalPath, "/build/resources");
  assert.match(resolved.recoveryMessage, /removed|could not/i);
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

  assert.equal(routeIdentityFor("atlas-map").label, "Explore");
  assert.equal(routeIdentityFor("search").label, "Search");
  assert.equal(routeIdentityFor("commons").label, "Resources");
});

test("canonical destinations own URL, label, title, navigation, analytics, context, and recovery identity", () => {
  const expected = [
    ["home", "/", "Home", null, "home"],
    ["search", "/search", "Search", null, "search"],
    ["atlas-map", "/explore", "Explore", "atlas-map", "explore"],
    ["catalog-detail", "/catalog", "Catalog", "catalog-detail", "catalog"],
    ["library-detail", "/record", "Record", "catalog-detail", "record_detail"],
    ["matrix", "/compare", "Compare", "matrix", "compare"],
    ["patterns", "/learn", "Learn", "patterns", "learn"],
    ["templates", "/build", "Build", "templates", "build"],
    ["commons", "/build/resources", "Resources", "templates", "resources"],
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
    assert.equal(destination.contextLabel, destination.label, destination.view);
    assert.ok(recoveryViewFor(destination.view), destination.view);
    assert.doesNotMatch(destination.label, /atlas-map|catalog-detail|templates|patterns/);
  }
});

test("retired aliases no longer redirect and resolve to the not-found state", () => {
  for (const legacyPath of [
    "/menu", "/home", "/start-here", "/atlas-map", "/atlas", "/map",
    "/browse", "/compare-controls", "/source", "/library", "/playbooks",
    "/playbook", "/templates", "/template", "/build/community", "/commons",
    "/resource-bazaar", "/bazaar", "/hub", "/library/nist-800-53",
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
