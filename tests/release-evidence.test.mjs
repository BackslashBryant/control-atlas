import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("release evidence is owned by executable gates and keeps external proof boundaries honest", () => {
  const operations = readFileSync("docs/OPERATIONS.md", "utf8");
  const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));

  for (const script of ["precommit", "checks:wait", "ship:main", "test:e2e:live:smoke"]) {
    assert.ok(packageManifest.scripts[script], `missing ${script} release gate`);
  }
  assert.match(operations, /CI artifacts, the pull request, and the release/);
  assert.match(operations, /Automated browser emulation is not physical-device evidence/);
  assert.match(operations, /Automated axe is not hands-on NVDA, VoiceOver, or TalkBack evidence/);
  assert.doesNotMatch(operations, /docs\/audits/);
});
