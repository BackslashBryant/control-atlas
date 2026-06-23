import assert from "node:assert/strict";
import test from "node:test";

import { SOURCE_LINKS, sourceLinkFor } from "../../src/ui/graph/sourceLinks.ts";
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
