import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Anti-drift guard for the Orbital Archive No. 01 design system.
//
// vendor/orbital-archive/tokens.palette.json is a pinned snapshot of the
// upstream release's colour palette (see its _pinnedVersion/_pinnedCommit
// fields). It is vendored rather than installed as a git dependency because a
// git dep makes `npm ci` resolve the design system's own devDependencies, which
// breaks the locked install in CI.
//
// When the style guide is updated: replace the snapshot with the new release's
// palette, then run this test. It FAILS on any hue Control Atlas has not
// reconciled — so re-alignment is a caught build error instead of a silent
// visual drift, which is what replaces hand-chasing hex values by eye.

const upstream = JSON.parse(
  readFileSync("vendor/orbital-archive/tokens.palette.json", "utf8"),
);
const tokens = readFileSync("styles/tokens.css", "utf8");

// Upstream palette key -> Control Atlas --lsm-* token name.
const PALETTE = {
  orbit: "--lsm-orbit",
  graphite: "--lsm-graphite",
  slate: "--lsm-slate",
  alloy: "--lsm-alloy",
  gridline: "--lsm-grid-line",
  dust: "--lsm-dust",
  bone: "--lsm-bone",
  teal: "--lsm-teal",
  gold: "--lsm-gold",
  orange: "--lsm-orange",
  signal: "--lsm-signal",
  rust: "--lsm-rust",
  fault: "--lsm-fault",
};

function caHex(name) {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `Control Atlas token ${name} must define a hex value`);
  return match[1].toLowerCase();
}

test("Control Atlas --lsm-* palette matches the pinned Orbital Archive release", () => {
  for (const [key, token] of Object.entries(PALETTE)) {
    const upstreamHex = upstream.color.palette[key]?.$value;
    assert.ok(
      typeof upstreamHex === "string" && upstreamHex.startsWith("#"),
      `upstream palette missing a literal hex for ${key}`,
    );
    assert.equal(
      caHex(token),
      upstreamHex.toLowerCase(),
      `${token} drifted from Orbital Archive color.palette.${key}: ` +
        `Control Atlas has ${caHex(token)}, upstream is ${upstreamHex.toLowerCase()}. ` +
        `Reconcile styles/tokens.css to the pinned release, or bump the pin deliberately.`,
    );
  }
});

test("relay stays a Control Atlas data hue, intentionally diverging from upstream", () => {
  // Upstream deprecates color.palette.relay -> teal (to be removed in v2).
  // Control Atlas keeps --lsm-relay as a distinct blue data/provenance hue
  // (NIST/official provenance, graph accents), so it is deliberately NOT
  // reconciled to teal. Pinning both sides documents that this divergence is a
  // conscious decision, not accidental drift.
  assert.match(tokens, /--lsm-relay:\s*#54bcd9/i);
  assert.equal(
    upstream.color.palette.relay?.$value,
    "{color.palette.teal}",
    "upstream relay is expected to be the deprecated teal alias",
  );
});
