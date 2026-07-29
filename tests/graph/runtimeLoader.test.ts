import assert from "node:assert/strict";
import test from "node:test";

import {
  compressedArtifactPath,
  runtimeArtifactPlan,
} from "../../src/ui/lib/runtimeLoader";
import { normalizeViewState } from "../../src/ui/lib/viewState";

test("compressed artifacts keep cache-busting parameters after the gzip extension", () => {
  assert.equal(
    compressedArtifactPath("./data/generated/nodes.json?v=2026-07-29"),
    "./data/generated/nodes.json.gz?v=2026-07-29",
  );
});

test("compressed artifacts without parameters append the gzip extension", () => {
  assert.equal(
    compressedArtifactPath("./data/template-registry.json"),
    "./data/template-registry.json.gz",
  );
});

test("route bootstrap loads only the smallest faithful artifact scope", () => {
  const resources = runtimeArtifactPlan(normalizeViewState("commons"));
  assert.equal(resources.commons, true);
  assert.equal(resources.librarySearch, false);
  assert.equal(resources.fullGraph, false);

  const recordDetail = runtimeArtifactPlan(
    normalizeViewState("library-detail"),
  );
  assert.equal(
    recordDetail.commons,
    true,
    "record pages load their existing contextual Resources module",
  );

  const globalSearch = runtimeArtifactPlan(normalizeViewState("search"));
  assert.equal(globalSearch.librarySearch, true);
  assert.equal(
    globalSearch.commons,
    true,
    "the full results page includes the Resources directory",
  );

  const overlaySearch = runtimeArtifactPlan(normalizeViewState("home"), {
    searchOverlayOpen: true,
  });
  assert.equal(overlaySearch.librarySearch, true);
  assert.equal(
    overlaySearch.commons,
    true,
    "the global search overlay includes the Resources directory",
  );

  const sources = runtimeArtifactPlan(normalizeViewState("sources"));
  assert.equal(sources.sources, true);
  assert.equal(sources.librarySearch, false);
  assert.equal(sources.fullGraph, false);

  const catalog = runtimeArtifactPlan(normalizeViewState("catalog-detail"));
  assert.equal(catalog.catalogBootstrap, true);
  assert.equal(catalog.librarySearch, false);
  assert.equal(catalog.fullGraph, false);

  const record = runtimeArtifactPlan(
    normalizeViewState("library-detail", { node: "nist-800-53:AC-2" }),
  );
  assert.equal(record.recordNodeId, "nist-800-53:AC-2");
  assert.equal(record.fullGraph, false);

  const atlasLanding = runtimeArtifactPlan(normalizeViewState("atlas-map"));
  assert.equal(atlasLanding.recordNodeId, "");
  assert.equal(
    atlasLanding.librarySearch,
    true,
    "the visible Atlas search needs the complete compact search corpus",
  );
  assert.equal(atlasLanding.fullGraph, false);

  const atlasStructure = runtimeArtifactPlan(
    normalizeViewState("atlas-map", { atlasAxis: "framework" }),
  );
  assert.equal(
    atlasStructure.fullGraph,
    true,
    "published-structure choices require the structural graph",
  );

  const atlasProcess = runtimeArtifactPlan(
    normalizeViewState("atlas-map", { atlasAxis: "process" }),
  );
  assert.equal(
    atlasProcess.fullGraph,
    true,
    "RMF process choices require the relationship graph",
  );
});

test("expensive graph scope begins only after an explicit graph-dependent action", () => {
  const configuredCompare = normalizeViewState("matrix", {
    crosswalk: "relationships",
    source: "nist-800-53",
    target: "csf-2",
  });
  assert.equal(runtimeArtifactPlan(configuredCompare).fullGraph, false);
  assert.equal(
    runtimeArtifactPlan({ ...configuredCompare, compareRun: "true" }).fullGraph,
    true,
  );

  const build = normalizeViewState("templates");
  assert.equal(runtimeArtifactPlan(build).fullGraph, false);
  assert.equal(runtimeArtifactPlan(build).registries, false);
  assert.equal(runtimeArtifactPlan(build).commons, false);
  assert.equal(
    runtimeArtifactPlan({
      ...build,
      buildSection: "tasks",
    }).registries,
    true,
  );
  assert.equal(
    runtimeArtifactPlan({
      ...build,
      buildSection: "documents",
      templateType: "security_plan_starter",
    }).fullGraph,
    true,
  );
});
