# Source truth profiles

Owner: Control Atlas data stewardship

Status: Active

Last reviewed: 2026-08-26

Supersession: This document governs source-truth profile and adapter additions until replaced by an approved data-policy revision.

Control Atlas connects publisher records, artifacts, resources, and relationships. It does not fill empty pages with guessed facts. Unknown optional values stay absent.

The current governed inventory covers 138 Organization envelopes, 202 Resources, 100 Publications, 142 source Artifacts, 30,969 Content Records, and 77,230 Assertions. Fourteen declared adapters cover all 27 catalog bundles.

## Canonical objects

The canonical kinds are Organization, Publication, Artifact, Content Record, Resource, and Assertion. `data/profiles/profile-registry.json` defines the active subtype contract for every observed object. `data/profiles/source-truth-migration-manifest.json` records the migration from existing type labels without changing stable identifiers or routes.

Origin values have precise meanings:

- `publisher_exact`: publisher value retained verbatim.
- `publisher_normalized`: lossless formatting or structural normalization.
- `publisher_derived`: deterministic projection from publisher material.
- `atlas_editorial`: reviewed Control Atlas context.
- `atlas_inferred`: machine or rule inference, always labeled and reviewable.

## Add a source or parser

1. Register the publication and acquired artifact in `data/source-registry.json`. Include lifecycle, version or an explicit version-unknown reason, retrieval date, checksum, parser identifier, parser version, and license or use basis.
2. Select the strongest publisher format available. Prefer native schemas, structured exports, stable publisher documents, then commit-pinned official repositories.
3. Add or update the adapter declaration in `data/profiles/source-adapter-registry.json`. Declare accepted source types, produced profiles, transformations, relationship rules, fixture set, and failure policy.
4. Add a minimal source fixture. Required structure fails closed. Unsupported optional fields are omitted.
5. Run `npm run build:data`, `npm run verify:profiles`, and `npm run verify:source-truth`.

Do not copy a title into a missing description. Do not infer cost, audience, access, lifecycle, completeness, or a replacement. Do not use a mutable branch URL when a release or commit exists.

For mixed-access destinations, distinguish the public information page from the service or action behind it. Store a scoped, sourced access-boundary note instead of applying a blanket authentication label to the page. PDISP is the reference case: its product record is public, while ordering and connection actions require authorized DoD access.

## Add a profile

1. Add the subtype to `data/profiles/profile-registry.json` and inherit from the appropriate canonical base profile.
2. Define required and optional fields, allowed origins, evidence-required fields, lifecycle states, and visible sections.
3. Regenerate the migration manifest with `node scripts/build-source-truth-migration-manifest.mjs`.
4. Add contract and presentation coverage. An observed object cannot use a generic fallback profile.

An optional field that has no publisher support remains absent. Its heading and explanatory placeholder must not render.

## Add a lifecycle state or replacement

Retired, sunset, withdrawn, deprecated, archived, superseded, and historical objects remain indexed and receive a prominent status label. A replacement link requires a publisher assertion and evidence locator. Similarity, chronology, or an Atlas guess is not replacement evidence.

## Add a relationship

1. Add a normalized assertion profile and migration alias.
2. Classify it as structural, published mapping, publisher-derived, Atlas navigation, or Atlas inference.
3. Supply subject, predicate, object, directionality, authority, lifecycle, and evidence according to the assertion class.
4. Keep Atlas navigation and inference visually distinct from publisher relationships.

The release gates reject unclassified relationships, unsupported factual defaults, visible absence prose, publisher claims without evidence, and replacements without evidence.
