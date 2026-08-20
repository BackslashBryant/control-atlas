import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const orbitalPackage = JSON.parse(
  readFileSync("node_modules/orbital-archive-no-01/package.json", "utf8"),
);
const projectPackage = JSON.parse(readFileSync("package.json", "utf8"));
const upstream = JSON.parse(
  readFileSync("node_modules/orbital-archive-no-01/tokens/tokens.json", "utf8"),
);
const tokens = readFileSync("styles/tokens.css", "utf8");

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

test("Control Atlas pins the official Orbital v1.8.0 release", () => {
  assert.equal(orbitalPackage.name, "orbital-archive-no-01");
  assert.equal(orbitalPackage.version, "1.8.0");
  assert.match(
    projectPackage.dependencies["orbital-archive-no-01"],
    /\/v1\.8\.0\.tar\.gz$/,
  );
});

test("Control Atlas palette aliases resolve to official Orbital variables", () => {
  for (const [key, alias] of Object.entries(PALETTE)) {
    assert.ok(upstream.color.palette[key], `Orbital palette missing ${key}`);
    assert.match(
      tokens,
      new RegExp(`${alias}:\\s*var\\(--lsm-color-palette-${key}\\)`),
      `${alias} must resolve to Orbital color.palette.${key}`,
    );
  }
});

test("relay stays a documented Control Atlas data-only extension", () => {
  assert.match(tokens, /--lsm-relay:\s*#54bcd9/i);
  assert.equal(upstream.color.palette.relay?.$value, "{color.palette.teal}");
});
