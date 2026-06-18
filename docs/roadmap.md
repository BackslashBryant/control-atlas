# Control Atlas Roadmap

The v3.0 PRD defines the active product direction. Existing working components are reused wherever practical, and Epic 0 comes first so the repo, shell, runtime contract, and delivery process are aligned before deeper feature work begins.

## Epic 0: GovFrame → Control Atlas Migration

**Goal:** Complete the Control Atlas rename, shift the app to a `src/` source tree with staged static deployment, and harden the public runtime without breaking the adopted five-artifact contract.

**Stories:** Rename and rebrand; Apply design tokens; Extend node/edge schema; Update graph renderer; CI/CD pipeline.

**Acceptance criteria:** Repo renamed to `control-atlas`; All GovFrame identity removed; Node schema extended to include `plain_language_summary`; Edge schema extended to include `provenance_class`, `confidence`, `relationship_type`, `source_refs`, `plain_language_rationale`; Graph edge colors use provenance tokens with text/icon labels; CI/CD pipeline implemented and green.

**Dependencies:** None.

## Epic 1: Data Backbone

**Goal:** Convert public sources into reproducible normalized bundles for Control Atlas.

**Stories:** NIST OSCAL importer; STIG/SRG importer; CCI mapping importer; Relationship builder; Provenance registry seed.

**Acceptance criteria:** Controls and baselines normalized as nodes with `plain_language_summary` populated; STIG/SRG rules normalized with severity, IDs, check/fix text, CCI refs, `plain_language_summary`; CCI-to-control and STIG-to-CCI relationships with provenance class and confidence; All 10 MVP sources entered with full schema compliance.

**Dependencies:** Epic 0.

## Epic 2: Library + Search

**Goal:** Provide searchable public reference objects across the compliance ecosystem.

**Stories:** MiniSearch index; Object detail pages; Library filters.

**Acceptance criteria:** Searching shows a plain-language summary before formal source text; Stable deep link and copyable ID on every object; "What to do next" section present on every detail page; Filter by object type, source class, family/severity without page reload.

**Dependencies:** Epic 1.

## Epic 3: Crosswalks

**Goal:** Expose public relationships, baseline comparisons, and provenance-aware exports.

**Stories:** Relationship table; STIG → CCI → NIST crosswalk; Baseline comparator.

**Acceptance criteria:** Three-click trace from STIG rule to NIST control; Official and inferred mappings visually distinct with text labels; Baseline delta view shows which controls appear in one baseline but not the other; Export includes provenance metadata.

**Dependencies:** Epics 1-2.

## Epic 4: Template Factory

**Goal:** Generate blank, reference-driven templates locally in the browser.

**Stories:** Template engine; Templates (Security Plan Starter, Evidence Expectation Matrix, POA&M Starter, Inheritance Worksheet, Reciprocity Checklist, STIG Evidence Checklist, Assessment Planning Worksheet, Continuous Monitoring Calendar).

**Acceptance criteria:** Client-side only; Selector leads with artifact type; Outputs include disclaimer and source metadata; Plain-language prompts on every field; No user/org data required.

**Dependencies:** Epics 1-3.

## Epic 5: Patterns + Glossary + Start Here

**Goal:** Explain common patterns, provide shared language, and give new practitioners a clear entry point.

**Stories:** Pattern page template; Inheritance pattern pages; Reciprocity pattern pages; RMF/ATO/ATC pattern pages; Evidence expectation patterns; Boundary and scope patterns; Glossary; Start Here flow.

**Acceptance criteria:** Pattern pages use plain language before formal terms and link to templates/sources; Glossary provides plain-language definitions before formal citations; Start Here flow produces an actionable reference recommendation in under 60 seconds without storing data.

**Dependencies:** Epics 2-4.

## Epic 6: QA + Accessibility + Release

**Goal:** Deliver a stable, accessible, secure public MVP.

**Stories:** E2E test suite (Playwright); Accessibility pass; Content review; Release candidate.

**Acceptance criteria:** Playwright covers critical paths; Keyboard navigation complete; Color never sole indicator; Dark theme contrast passes; No high/critical vulnerabilities; CI green; Release candidate tagged.

**Dependencies:** Epics 0-5.

## Recommended Next Sequence

1. Complete Epic 0 closeout with a fresh live Pages audit against `https://backslashbryant.github.io/control-atlas/`.
2. Extend the data normalization pipeline (Epic 1) using the adopted runtime contract.
3. Expand Library Browser (Epic 2) and Crosswalk Workbench (Epic 3).
4. Add Template Factory (Epic 4), then Patterns, Glossary, and Start Here (Epic 5).
5. Finish Epic 6 release hardening and live audits.
