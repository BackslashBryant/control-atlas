import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPATIBILITY_ALIAS_POLICY,
  COMPATIBILITY_ROUTE_ALIASES,
  canonicalizeHashLocation,
  routeIdentityFor,
} from "../../src/ui/lib/routeIdentity";

test("route matrix canonicalizes current and legacy destinations without losing durable state", () => {
  const cases = [
    {
      input: "/explore?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
      canonical: "/explore?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
    },
    {
      input: "/atlas-map?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
      canonical: "/explore?node=nist-800-53%3AAC-2&atlasAxis=framework&relationshipView=map",
    },
    {
      input: "/explore?q=account+management&objectType=control",
      canonical: "/search?q=account+management&objectType=control",
    },
    {
      input: "/build/community?lane=implement&framework=nist-800-53",
      canonical: "/build/resources?lane=implement&framework=nist-800-53",
    },
    {
      input: "/commons-detail?id=official-nist-sp800-53-r5",
      canonical: "/build/resources/official-nist-sp800-53-r5",
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
      input: "/start?step=dataSensitivity&systemType=Cloud+SaaS",
      canonical: "/start?step=dataSensitivity&systemType=Cloud+SaaS",
    },
    { input: "/menu", canonical: "/" },
    { input: "/library/nist-800-53", canonical: "/catalog/nist-800-53" },
    { input: "/templates", canonical: "/build" },
    { input: "/playbooks", canonical: "/learn" },
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
  assert.equal(COMPATIBILITY_ALIAS_POLICY.owner, "Control Atlas maintainers");
  assert.match(COMPATIBILITY_ALIAS_POLICY.removalDate, /^2026-10-27$/);
});

test("compatibility inventory retains every alias through its owner-gated removal date", () => {
  assert.deepEqual(COMPATIBILITY_ROUTE_ALIASES, {
    "/menu": "/",
    "/home": "/",
    "/start-here": "/start",
    "/atlas-map": "/explore",
    "/atlas": "/explore",
    "/map": "/explore",
    "/browse": "/search",
    "/compare-controls": "/compare",
    "/source": "/sources",
    "/library": "/catalog",
    "/playbooks": "/learn",
    "/playbook": "/learn",
    "/templates": "/build",
    "/template": "/build",
    "/build/community": "/build/resources",
    "/commons": "/build/resources",
    "/resource-bazaar": "/build/resources",
    "/bazaar": "/build/resources",
    "/hub": "/build/resources",
  });
  assert.match(COMPATIBILITY_ALIAS_POLICY.removalCondition, /deployed deep-link smoke/i);
});
