import assert from "node:assert/strict";
import test from "node:test";

import catalogBootstrap from "../../data/generated/catalog-bootstrap.json";
import sources from "../../data/generated/sources.json";
import {
  buildSourceLayers,
  publicationReviewsForSource,
  sourceLayerCompleteness,
  sourceLayerEntityLabel,
  sourceLayerOptions,
} from "../../src/ui/lib/sourceRegister";
import { sourceIdentityPresentationFor } from "../../src/ui/lib/sourceIdentity";

const catalogs = catalogBootstrap.catalog_bootstrap.catalogs;

test("source detail identity separates a specific name from shared family context", () => {
  assert.deepEqual(
    sourceIdentityPresentationFor({
      id: "cyber-mil-stig-downloads",
      name: "DISA STIG Downloads Landing Page",
      display_name: "DISA STIG",
    }),
    {
      primaryName: "DISA STIG Downloads Landing Page",
      familyName: "DISA STIG",
      stableId: "cyber-mil-stig-downloads",
    },
  );
  assert.deepEqual(
    sourceIdentityPresentationFor({
      id: "source-without-human-name",
      name: "source-without-human-name",
      display_name: "source-without-human-name",
    }),
    {
      primaryName: "Source detail",
      familyName: "",
      stableId: "source-without-human-name",
    },
  );
});

test("source layers preserve truthful nullable fields and exact layer counts", () => {
  const layers = buildSourceLayers(sources.sources, catalogs);
  assert.deepEqual(
    Object.fromEntries(Object.entries(layers).map(([layer, rows]) => [layer, rows.length])),
    { organization: 2, publication: 47, connection: 26, ingestion: 117 },
  );

  // Phase 2 (T2.1-T2.3): the publication layer must be exactly the set of
  // canonical identities, never an unclassified row that fell through to
  // the classifier's default. Every row in the publication layer must trace
  // back to a source whose registry metadata.identity_kind is literally
  // "publication" (source_role never applies to publications[] rows).
  const sourcesById = new Map(sources.sources.map((source: any) => [source.id, source]));
  for (const row of layers.publication) {
    const source = sourcesById.get(row.id);
    assert.equal(
      source?.metadata?.identity_kind,
      "publication",
      `${row.id} appears in the publication layer without an explicit identity_kind: "publication"`,
    );
  }

  for (const row of Object.values(layers).flat()) {
    assert.ok(row.displayTitle, row.id);
    assert.notEqual(row.displayTitle, row.id, `${row.id} uses its stable ID as its title`);
    assert.ok(["recorded", "derived", "not_applicable", "missing"].includes(row.publisher.state));
    assert.notEqual(row.publisher.value, "Publisher not recorded");
    for (const field of [
      row.publisher,
      row.coverage,
      row.format,
      row.version,
      row.retrievedAt,
      row.verifiedAt,
      row.lifecycle,
      row.recordCount,
      row.relationshipCount,
    ]) {
      assert.ok(field.reason, `${row.id} field state has no reason`);
      assert.ok(
        !String(field.value || "").includes("Not recorded"),
        `${row.id} stores a presentation sentinel instead of a nullable field`,
      );
    }
  }
});

test("artifact publishers resolve from their parent publications without fabrication", () => {
  const layers = buildSourceLayers(sources.sources, catalogs);
  const derived = [...layers.connection, ...layers.ingestion].filter(
    (row) => row.publicationSourceId,
  );
  assert.equal(derived.length, 91);
  assert.ok(derived.every((row) => row.publisher.value), "every parent-linked artifact resolves a publisher");
  assert.ok(derived.some((row) => row.publisher.state === "derived"));

  const cci = layers.ingestion.find((row) => row.id === "artifact-disa-cci-list");
  assert.equal(cci?.publisher.value, "DISA");
  assert.equal(cci?.publisher.state, "derived");
  assert.equal(
    cci?.publisher.reason,
    "Inherited from parent publication DISA CCI.",
  );

  const sourcesById = new Map(sources.sources.map((source) => [source.id, source]));
  for (const row of derived.filter((candidate) => candidate.publisher.state === "derived")) {
    const parent = sourcesById.get(row.publicationSourceId);
    assert.ok(parent, `${row.id} parent publication is unresolved`);
    assert.ok(
      row.publisher.reason.includes(parent.display_name || parent.name),
      `${row.id} does not name its human parent publication`,
    );
    assert.ok(
      !row.publisher.reason.includes(parent.id),
      `${row.id} exposes raw parent ID ${parent.id}`,
    );
  }

  const fallback = buildSourceLayers(
    [
      {
        id: "parent-publication-id",
        name: "parent-publication-id",
        display_name: "parent-publication-id",
        owner: "Example Publisher",
        source_role: "publication",
        lifecycle_status: "active",
      },
      {
        id: "child-artifact-id",
        name: "Example artifact",
        publication_source_id: "parent-publication-id",
        source_role: "primary_data",
        lifecycle_status: "active",
        metadata: { owner_resolution: "parent_publication" },
      },
    ],
    [],
  ).ingestion[0];
  assert.equal(fallback.publisher.value, "Example Publisher");
  assert.equal(fallback.publisher.state, "derived");
  assert.equal(
    fallback.publisher.reason,
    "Inherited from the linked parent publication.",
  );
  assert.ok(!fallback.publisher.reason.includes("parent-publication-id"));
});

test("quarantined sources surface an explicit blocked field state with the registry's reason", () => {
  const layers = buildSourceLayers(
    [
      {
        id: "quarantined-source-id",
        name: "Quarantined Source",
        display_name: "Quarantined Source",
        owner: "Example Publisher",
        source_role: "primary_data",
        lifecycle_status: "active",
      },
    ],
    [],
    {},
    [{ id: "quarantined-source-id", reason: "Checksum could not be verified against the publisher release." }],
  ).ingestion[0];
  assert.equal(layers.lifecycle.state, "blocked");
  assert.equal(
    layers.lifecycle.reason,
    "Checksum could not be verified against the publisher release.",
  );
  assert.equal(layers.lifecycle.value, null);
});

test("layer-specific fields distinguish missing values from non-applicable concepts", () => {
  const layers = buildSourceLayers(sources.sources, catalogs);
  const reference = layers.ingestion.find(
    (row) => row.id === "artifact-complianceascode-content",
  );
  assert.equal(reference?.format.state, "not_applicable");
  assert.equal(reference?.recordCount.state, "not_applicable");

  const mapping = layers.connection[0];
  assert.equal(mapping.recordCount.state, "recorded");
  assert.equal(mapping.relationshipCount.state, "recorded");
  assert.equal(mapping.coverage.state, "not_applicable");

  const authority = layers.publication.find(
    (row) => row.id === "authority-32-cfr-170",
  );
  assert.equal(authority?.coverage.state, "not_applicable");
});

test("source layer query and facets use resolved presentation values", () => {
  const nist = buildSourceLayers(sources.sources, catalogs, {
    query: "800-53",
    lifecycle: "active",
  }).publication;
  assert.ok(nist.length > 0);
  assert.ok(nist.every((row) => row.lifecycle.value === "active"));
  assert.equal(
    Object.values(buildSourceLayers(sources.sources, catalogs, { query: "not-a-source" })).flat().length,
    0,
  );

  const disaArtifacts = buildSourceLayers(sources.sources, catalogs, {
    publisher: "DISA",
  }).ingestion;
  assert.ok(disaArtifacts.length > 0);
  assert.ok(disaArtifacts.every((row) => row.publisher.value === "DISA"));
});

test("source filter options and entity labels are contextual to a layer", () => {
  const layers = buildSourceLayers(sources.sources, catalogs);
  const publicationOptions = sourceLayerOptions(layers.publication);
  const connectionOptions = sourceLayerOptions(layers.connection);
  assert.notDeepEqual(publicationOptions.publishers, connectionOptions.publishers);
  assert.ok(connectionOptions.publishers.includes("MITRE"));
  assert.equal(sourceLayerEntityLabel("publication", 1), "publication");
  assert.equal(sourceLayerEntityLabel("ingestion", 94), "source materials");
});

test("generated layer completeness accounts for every field state and fails required metadata gaps", () => {
  const layers = buildSourceLayers(sources.sources, catalogs);
  for (const rows of Object.values(layers)) {
    const completeness = sourceLayerCompleteness(rows);
    for (const counts of Object.values(completeness.fields)) {
      assert.equal(
        Object.values(counts).reduce((sum, count) => sum + count, 0),
        completeness.total,
      );
    }
    assert.equal(completeness.fields.publisher.missing, 0);
    assert.equal(completeness.fields.lifecycle.missing, 0);
  }
  assert.equal(
    sourceLayerCompleteness(layers.ingestion).fields.format.missing,
    0,
  );
});

test("all governed publication reviews resolve without replacing source check dates", () => {
  const reviewedCatalogs = catalogs.filter((catalog) => catalog.source_review);
  assert.equal(reviewedCatalogs.length, 27);

  for (const catalog of reviewedCatalogs) {
    const reviews = publicationReviewsForSource(
      catalog.source_id,
      sources.sources,
      catalogs,
    );
    const review = reviews.find((entry) => entry.catalogId === catalog.id);
    assert.ok(review, `${catalog.id} review does not resolve from its publication source`);
    assert.equal(review.reviewedAt, catalog.source_review.reviewed_at);
    assert.equal(
      review.upstreamCurrentnessReview,
      catalog.source_review.upstream_currentness_review,
    );
  }

  const iotSource = sources.sources.find(
    (source) =>
      source.id === "nist-iot-device-cybersecurity-requirement-catalogs",
  );
  assert.equal(iotSource?.last_checked, undefined);
  assert.deepEqual(
    publicationReviewsForSource(iotSource!.id, sources.sources, catalogs).map(
      (review) => ({
        catalogId: review.catalogId,
        reviewedAt: review.reviewedAt,
        currentness: review.upstreamCurrentnessReview,
      }),
    ),
    [
      {
        catalogId: "nist-iot-cybersecurity",
        reviewedAt: "2026-08-13",
        currentness: "current_as_checked",
      },
    ],
  );

  const checkedSource = sources.sources.find(
    (source) => source.id === "nist-800-53",
  );
  assert.equal(checkedSource?.last_checked, "2026-07-28");
  assert.equal(
    publicationReviewsForSource(
      checkedSource!.id,
      sources.sources,
      catalogs,
    )[0]?.reviewedAt,
    "2026-08-13",
  );

  const childReviews = publicationReviewsForSource(
    "artifact-nist-iot-requirements-80053-mapping-draft",
    sources.sources,
    catalogs,
  );
  assert.ok(
    childReviews.some(
      (review) => review.catalogId === "nist-iot-cybersecurity",
    ),
  );

  assert.deepEqual(
    publicationReviewsForSource(
      "control-atlas-structure",
      sources.sources,
      catalogs,
    ),
    [],
  );

  assert.deepEqual(
    publicationReviewsForSource(
      "nist-800-53a-assessment-procedures",
      sources.sources,
      catalogs,
    ).map((review) => review.catalogId),
    ["nist-800-53", "nist-800-53a"],
  );
});
