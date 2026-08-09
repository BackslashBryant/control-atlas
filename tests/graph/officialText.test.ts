import assert from "node:assert/strict";
import test from "node:test";

import {
  officialDescriptionOrStatus,
  officialTextPreview,
} from "../../src/ui/lib/officialText";

test("long official text keeps a bounded preview and an explicit full-text boundary", () => {
  const official = `${"published source wording ".repeat(50)}final sentence`;
  const result = officialTextPreview(official);

  assert.equal(result.truncated, true);
  assert.ok(result.preview.length <= 703);
  assert.ok(result.preview.endsWith("..."));
  assert.equal(official.endsWith("final sentence"), true);
});

test("short official text is not altered", () => {
  const official = "Publisher wording stays intact.";
  assert.deepEqual(officialTextPreview(official), {
    preview: official,
    truncated: false,
  });
});

test("compact search records use the transported official preview", () => {
  assert.equal(
    officialDescriptionOrStatus({ official_text_preview: "Publisher wording preview." }),
    "Publisher wording preview.",
  );
  assert.equal(
    officialDescriptionOrStatus({}),
    "No narrative description was published for this record.",
  );
  assert.equal(
    officialDescriptionOrStatus({ description: "Publisher wording." }),
    "Publisher wording.",
  );
});
