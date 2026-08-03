import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const matrix = JSON.parse(
  readFileSync("config/experience-guardian/route-matrix.json", "utf8"),
);
const routeSource = readFileSync("src/ui/lib/routeIdentity.ts", "utf8");
const activeRoutes = [
  ...routeSource.matchAll(/^\s*(?:"([^"]+)"|([\w-]+)):\s*\{\s*path:/gm),
].map((match) => match[1] || match[2]);

test("every active route has desktop and mobile Guardian coverage", () => {
  assert.deepEqual([...matrix.activeRoutes].sort(), [...activeRoutes].sort());
  for (const route of activeRoutes) {
    const states = matrix.states.filter((state) => state.route === route);
    assert.ok(states.length > 0, `Missing Guardian state for ${route}`);
    const viewports = new Set(states.flatMap((state) => state.viewports));
    assert.ok(viewports.has("desktop"), `Missing desktop review for ${route}`);
    assert.ok(viewports.has("mobile"), `Missing mobile review for ${route}`);
  }
});

test("record review states cover the required object classes and source priority", () => {
  for (const id of [
    "control-rich",
    "cci",
    "stig-rule",
    "attack-technique",
    "supply-chain",
    "record-sparse",
  ]) {
    const state = matrix.states.find((entry) => entry.id === id);
    assert.ok(state, `Missing ${id}`);
    assert.equal(state.officialBeforeEditorial, true);
  }
});

test("major feature identities pair color with words, structure, or icons", () => {
  const home = readFileSync("src/ui/pages/HomePage.tsx", "utf8");
  const records = readFileSync("src/ui/pages/ObjectDetailPage.tsx", "utf8");
  assert.match(home, /data-visual-identity="universal-front-door"/);
  assert.match(home, /Icon(?:FileSearch|ShieldLock|Radar|Tool)/);
  assert.match(records, /threat-research-record/);
  assert.match(records, /defense-research-record/);
  assert.match(records, /displayNameFor\("object_type"/);
});
