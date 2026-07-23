import assert from "node:assert/strict";
import test from "node:test";

import {
  SOURCE_LINKS,
  resolveSourceLink,
  sourceLinkFor,
} from "../../src/ui/graph/sourceLinks.ts";
import { SOURCE_SEED_MANIFEST } from "../../src/ui/graph/sourceSeedManifest.ts";

test("canonical links are centralized and cover every source", () => {
  assert.equal(SOURCE_LINKS.length, SOURCE_SEED_MANIFEST.length);
  for (const source of SOURCE_SEED_MANIFEST) {
    const link = sourceLinkFor(source.sourceId);
    assert.equal(link.canonicalUrl, source.canonicalUrl);
    assert.match(link.canonicalUrl, /^(https:\/\/|registry-local-only$)/);
  }
});

test("required canonical links are exact", () => {
  assert.equal(
    sourceLinkFor("fisma-44-usc-3551").canonicalUrl,
    "https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap35-subchapII.htm",
  );
  assert.equal(
    sourceLinkFor("nist-sp-800-53-r5").canonicalUrl,
    "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  );
  assert.equal(
    sourceLinkFor("mitre-attack-enterprise").canonicalUrl,
    "https://attack.mitre.org/",
  );
  assert.equal(
    sourceLinkFor("mitre-d3fend").canonicalUrl,
    "https://d3fend.mitre.org/",
  );
});

test("unknown source links fail closed", () => {
  assert.throws(() => sourceLinkFor("unknown"), /Unknown sourceId: unknown/);
});

test("resolveSourceLink resolves best-effort CPRT deep links for NIST controls", () => {
  const resolved = resolveSourceLink("nist-sp-800-53-r5", "AC-1");
  assert.equal(resolved.confidence, "best_effort");
  assert.equal(resolved.isDeepLink, true);
  assert.equal(
    resolved.href,
    "https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_2_0/home?element=AC-1",
  );
  assert.equal(resolved.label, "Open AC-1 in NIST SP 800-53 Rev. 5");
});

test("resolveSourceLink falls back to official catalog URL when deep link is unavailable", () => {
  const resolved = resolveSourceLink("disa-cci-list", "CCI-000001");
  assert.equal(resolved.confidence, "verified");
  assert.equal(resolved.isDeepLink, false);
  assert.equal(resolved.href, "https://www.cyber.mil/stigs/cci/");
  assert.equal(
    resolved.label,
    "Open DISA CCI List official publication",
  );
});
