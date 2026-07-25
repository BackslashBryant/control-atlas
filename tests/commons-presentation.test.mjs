import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  COMMONS_GROUPS,
  groupResourcesByKind,
  hostIdentity,
  resourceHost,
} from "../src/ui/lib/commonsPresentation.mjs";

const dataset = JSON.parse(
  readFileSync(resolve("data/commons-resource-dataset.json"), "utf8"),
);
const resources = dataset.resources;

test("resourceHost normalizes hostnames and refuses to guess at malformed URLs", () => {
  assert.equal(resourceHost("https://www.reddit.com/r/NISTControls/"), "reddit.com");
  assert.equal(resourceHost("https://CSRC.NIST.GOV/pubs/sp/800/53/r5/upd1/final"), "csrc.nist.gov");
  assert.equal(resourceHost("not a url"), "");
  assert.equal(resourceHost(""), "");
  assert.equal(resourceHost(null), "");
  assert.equal(resourceHost(undefined), "");
});

test("hostIdentity resolves bundled brand marks from the canonical URL", () => {
  assert.deepEqual(hostIdentity("https://github.com/ComplianceAsCode/content"), {
    host: "github.com",
    kind: "github",
    label: "github.com",
  });
  assert.equal(
    hostIdentity("https://raw.githubusercontent.com/org/repo/main/file.json").kind,
    "github",
  );
  assert.equal(hostIdentity("https://www.reddit.com/r/NISTControls/").kind, "reddit");
  assert.equal(hostIdentity("https://old.reddit.com/r/CMMC/").kind, "reddit");
  assert.equal(hostIdentity("https://oscal.slack.com/").kind, "slack");
  assert.equal(hostIdentity("https://docs.aws.amazon.com/whitepapers/").kind, "aws");
  assert.equal(hostIdentity("https://learn.microsoft.com/en-us/azure/").kind, "microsoft");
});

test("hostIdentity resolves publishing-organization monograms per registrable domain", () => {
  assert.deepEqual(hostIdentity("https://csrc.nist.gov/pubs/sp/800/53/r5/final"), {
    host: "csrc.nist.gov",
    kind: "monogram",
    label: "NIST",
  });
  assert.equal(hostIdentity("https://nvd.nist.gov/").label, "NIST");
  assert.equal(hostIdentity("https://niccs.cisa.gov/").label, "CISA");
  assert.equal(hostIdentity("https://marketplace.fedramp.gov/").label, "FedRAMP");
  assert.equal(hostIdentity("https://public.cyber.mil/stigs/").label, "DoD");
  assert.equal(hostIdentity("https://esd.whs.mil/Directives/").label, "DoD");
  assert.equal(hostIdentity("https://p1.dso.mil/").label, "DoD");
});

test("hostIdentity falls back to the hostname rather than approximating an unknown publisher", () => {
  assert.deepEqual(hostIdentity("https://open-scap.org/tools/scap-workbench/"), {
    host: "open-scap.org",
    kind: "generic",
    label: "open-scap.org",
  });
  assert.deepEqual(hostIdentity("garbage"), { host: "", kind: "generic", label: "" });
});

test("every resource in the shipped dataset yields a resolvable host", () => {
  const unresolved = resources.filter((resource) => !resourceHost(resource.canonicalUrl));
  assert.deepEqual(
    unresolved.map((resource) => `${resource.id} -> ${resource.canonicalUrl}`),
    [],
  );
});

test("every host used by two or more resources has a specific identity, not a generic glyph", () => {
  const counts = new Map();
  for (const resource of resources) {
    const host = resourceHost(resource.canonicalUrl);
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }

  const repeatedButGeneric = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .filter(([host]) => hostIdentity(`https://${host}/`).kind === "generic")
    .map(([host, count]) => `${host} (${count} resources)`);

  assert.deepEqual(repeatedButGeneric, []);
});

test("grouping classifies every shipped resource exactly once, in section order", () => {
  const groups = groupResourcesByKind(resources);

  const total = groups.reduce((sum, group) => sum + group.resources.length, 0);
  assert.equal(total, resources.length);

  const seen = new Set();
  for (const group of groups) {
    for (const resource of group.resources) {
      assert.ok(!seen.has(resource.id), `Resource classified twice: ${resource.id}`);
      seen.add(resource.id);
    }
  }
  assert.equal(seen.size, resources.length);

  const expectedOrder = COMMONS_GROUPS.map((group) => group.id).filter((id) =>
    groups.some((group) => group.id === id),
  );
  assert.deepEqual(groups.map((group) => group.id), expectedOrder);
});

test("every resourceType in the shipped dataset maps to a named section, never to Other", () => {
  const mapped = new Set(COMMONS_GROUPS.flatMap((group) => group.types));
  const unmapped = [...new Set(resources.map((resource) => resource.resourceType))]
    .filter((type) => !mapped.has(type))
    .sort();
  assert.deepEqual(unmapped, []);

  const groups = groupResourcesByKind(resources);
  assert.equal(groups.find((group) => group.id === "other"), undefined);
});

test("grouping keeps an unclassified resourceType visible under Other instead of dropping it", () => {
  const groups = groupResourcesByKind([
    { id: "a", resourceType: "tool" },
    { id: "b", resourceType: "something_new" },
  ]);

  assert.deepEqual(groups.map((group) => group.id), ["tools", "other"]);
  assert.deepEqual(
    groups.find((group) => group.id === "other").resources.map((r) => r.id),
    ["b"],
  );
});

test("grouping preserves the caller's ordering inside each section", () => {
  const groups = groupResourcesByKind([
    { id: "tool-second", resourceType: "tool" },
    { id: "policy-first", resourceType: "policy" },
    { id: "tool-first", resourceType: "tool" },
  ]);

  assert.deepEqual(
    groups.find((group) => group.id === "tools").resources.map((r) => r.id),
    ["tool-second", "tool-first"],
  );
});

test("every section carries a plain-English label and blurb, and no type is double-assigned", () => {
  const seenTypes = new Set();
  for (const group of COMMONS_GROUPS) {
    assert.ok(group.label.length > 0, `Group ${group.id} has no label`);
    assert.ok(group.blurb.length > 0, `Group ${group.id} has no blurb`);
    assert.ok(group.types.length > 0, `Group ${group.id} claims no resource types`);
    for (const type of group.types) {
      assert.ok(!seenTypes.has(type), `resourceType ${type} claimed by two groups`);
      seenTypes.add(type);
    }
  }
});
