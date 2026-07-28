# Control Atlas Roadmap

The v3.0 PRD defines the active product direction. Existing working components are reused wherever practical, and Epic 0 comes first so the repo, shell, runtime contract, and delivery process are aligned before deeper feature work begins.

## Source-First Product Standard

Control Atlas is a public reference workbench that makes official cybersecurity guidance searchable, connected, and traceable without inventing record-by-record interpretation.

Future work must preserve this order:

1. Official record content
2. Visible source provenance
3. Published relationships
4. Clearly labelled product navigation
5. User questions for the governing program

No roadmap item may be accepted unless it identifies the user confusion it reduces and the action it enables.

## Epic 0: GovFrame → Control Atlas Migration

**Goal:** Complete the Control Atlas rename, shift the app to a `src/` source tree with staged static deployment, and harden the public runtime without breaking the adopted five-artifact contract.

**Stories:** Rename and rebrand; Apply design tokens; Extend node/edge schema; Update graph renderer; CI/CD pipeline.

**Acceptance criteria:** Repo renamed to `control-atlas`; All GovFrame identity removed; node schema preserves official descriptions; edge schema includes provenance, source references, and provenance-labelled explanations; graph edge colors use provenance tokens with text/icon labels; CI/CD pipeline implemented and green.

**Dependencies:** None.

## Epic 1: Data Backbone

**Goal:** Convert public sources into reproducible normalized bundles for Control Atlas.

**Stories:** NIST OSCAL importer; STIG/SRG importer; CCI mapping importer; Relationship builder; Provenance registry seed.

**Acceptance criteria:** Controls and baselines normalize official descriptions where published; STIG/SRG rules normalize severity, IDs, check/fix text, CCI refs, and official descriptions where published; CCI-to-control and STIG-to-CCI relationships retain provenance class and confidence; all MVP sources enter with full schema compliance.

**Dependencies:** Epic 0.

## Epic 2: Library + Search

**Goal:** Provide searchable public reference objects across the compliance ecosystem.

**Stories:** MiniSearch index; Object detail pages; Library filters.

**Acceptance criteria:** Searching shows identifiers, titles, and official descriptions; stable deep link and copyable ID on every object; official source link and published relationships present on every detail page; filter by object type, source class, family/severity without page reload.

**Dependencies:** Epic 1.

## Epic 3: Compare

**Goal:** Expose public relationships, baseline comparisons, and provenance-aware exports.

**Stories:** Relationship table; STIG → CCI → NIST crosswalk; Baseline comparator.

**Acceptance criteria:** Three-click trace from STIG rule to NIST control; Official and inferred mappings visually distinct with text labels; Baseline delta view shows which controls appear in one baseline but not the other; Export includes provenance metadata.

**Dependencies:** Epics 1-2.

## Epic 4: Compliance Artifact and Template Nexus

**Goal:** Shorten the path from a compliance task to its authoritative source, official artifact, usable companion, compatible format, validation evidence, and next action.

**Stories:** Official artifact, workflow, and tool catalogs; Template engine; Templates (Security Plan Starter, Implementation Statement Worksheet, Evidence Expectation Matrix, POA&M Working Register, Inheritance Worksheet, Reciprocity Package Review, STIG Viewer CSV Preparation Worksheet, Assessment Planning Worksheet, Continuous Monitoring Delivery Calendar, Hardware Baseline, Software Baseline, PPSM Preparation Worksheet).

**Acceptance criteria:** Client-side only; Official resources appear before companions; Selector leads with task and artifact type; Outputs include disclaimer, source metadata, and compatibility limitations; Plain-language prompts on every field; No user/org data required.

**Dependencies:** Epics 1-3.

## Epic 5: Patterns + Glossary + Start Here

**Goal:** Explain common patterns, provide shared language, and give new practitioners a clear entry point.

**Stories:** Pattern page template; Inheritance pattern pages; Reciprocity pattern pages; RMF/ATO/ATC pattern pages; Evidence expectation patterns; Boundary and scope patterns; Glossary; Start Here flow.

**Acceptance criteria:** Public Playbooks appear only when their guidance has source-registry IDs and canonical public URLs; glossary cites its sources; Start Here browses public source catalogs without a classification, baseline, or authorization recommendation.

**Dependencies:** Epics 2-4.

## Epic 6: QA + Accessibility + Release

**Goal:** Deliver a stable, accessible, secure public MVP.

**Stories:** E2E test suite (Playwright); Accessibility pass; Content review; Release candidate.

**Acceptance criteria:** Playwright covers critical paths; Keyboard navigation complete; Color never sole indicator; Dark theme contrast passes; No high/critical vulnerabilities; CI green; Release candidate tagged.

**Dependencies:** Epics 0-5.

## Recommended Next Sequence

1. **Maintenance** — CI-driven dependency, security, and smoke gates
2. **Optional** — promote `v1.0.0` after RC feedback

Epics 0–10 and the UI and Brand Correction v2.2 pass are shipped for MVP.
