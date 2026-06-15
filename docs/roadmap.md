# Control Atlas Roadmap

The v2.1 PRD defines the active product direction. Existing working components are reused wherever practical, and Epic 0 comes first so the repo, shell, runtime contract, and delivery process are aligned before deeper feature work begins.

## Epic 0: Control Atlas Full Rename and Phase 0 Baseline

**Goal:** Complete the Control Atlas rename, shift the app to a `src/` source tree with staged static deployment, and harden the public runtime without breaking the adopted five-artifact contract.

**Stories:** Repository/package/Pages rename and hosted cutover; PRD token and shell implementation; staged static build from `src/`; D3 provenance-aware renderer extension; edge metadata defaults and schema hardening; CI/CD and SecDevOps hardening around the staged site; preservation of the five-artifact runtime contract.

**Acceptance criteria:** Public identity, package metadata, workflows, and Pages URLs use Control Atlas; `src/` is the source-of-truth shell and `dist/site` is the deploy surface; provenance, relationship type, and confidence controls exist with an accessible fallback; CI runs staged-build, lint, typecheck, contract, browser, accessibility smoke, Playwright, SBOM, dependency review, and license gates; `npm run precommit` passes while `sources.json`, `nodes.json`, `edges.json`, `evidence.json`, and `graph-health.json` remain the runtime load contract.

**Existing reusable components:** Current static shell, D3 graph surface, runtime bundles, tests, GitHub Pages deployment, current package scripts.

**Dependencies:** None.

**SecDevOps considerations:** Keep the staged build path mandatory, preserve static/public-data-only boundaries, and close deploy-path, accessibility, and release-evidence gaps before larger feature additions.

**Risks:** Hosted rename drift, staged-site contract regressions, graph-library churn outside D3, or new shell polish breaking the static/public-data-only boundary.

## Epic 1: Source / Provenance Registry

**Implementation status:** Implemented on the current static runtime baseline. Provenance now supports public-facing registry framing, source filtering, source detail views, lifecycle/access warnings, and source traceability cues without changing the internal `source-registry` contract.

**Goal:** Maintain the public trust backbone behind every displayed object and mapping.

**Stories:** Provenance Registry framing; source lifecycle warnings; source filtering; license/use review; provenance-facing copy and detail improvements.

**Acceptance criteria:** Every displayable object and relationship traces to eligible public-source metadata; deprecated or restricted sources are clearly labeled; public product language uses Provenance while internal compatibility is preserved.

**Existing reusable components:** `data/source-registry.json`, `sources.json`, validator tests, current source cards and runtime APIs.

**Dependencies:** Epic 0.

**SecDevOps considerations:** Validate URL, access, license/use, and restricted-content handling.

**Risks:** Public naming drift between docs and runtime, or accidental schema churn before needed.

## Epic 2: Data Normalization Pipeline

**Goal:** Convert public sources into reproducible normalized bundles for Control Atlas.

**Stories:** Extend importers, strengthen schema validation, expand relationship builder coverage, and preserve reproducible build governance outputs.

**Acceptance criteria:** Builds are reproducible; invalid, unsupported, or non-public records are blocked; relationship semantics and provenance remain separate.

**Existing reusable components:** OSCAL/CCI/OLIR adapters, federal graph builder, graph-health output, build manifests.

**Dependencies:** Epic 1.

**SecDevOps considerations:** Parser fixtures, deterministic builds, dependency hygiene, and source-integrity checks.

**Risks:** Public source format drift and accidental runtime-contract breakage.

## Epic 3: Library Browser

**Goal:** Provide searchable public reference objects across the compliance ecosystem.

**Stories:** Library search, deep-link object views, copyable IDs, STIG/SRG/CCI browsing, and source-backed object detail.

**Acceptance criteria:** Users can find controls, STIGs, CCIs, and related public objects by identifier or topic and inspect source-backed details.

**Existing reusable components:** Search, browse, detail, source inspection, object cards, current runtime filters.

**Dependencies:** Epic 2.

**SecDevOps considerations:** No runtime ingestion, unsafe external content, or user data handling.

**Risks:** Search quality drift if data shape expands faster than the UI contract.

## Epic 4: Crosswalk Workbench

**Goal:** Expose public relationships, baseline comparisons, and provenance-aware exports.

**Stories:** Relationship tables; STIG-to-CCI-to-NIST browsing; provenance, confidence, and relationship filters; baseline deltas; CSV/JSON/Markdown export.

**Acceptance criteria:** Official and inferred mappings remain distinct, provenance is visible on every mapping, and visible crosswalks are exportable.

**Existing reusable components:** Matrix runtime/API, CSV export, graph contracts, evidence panels.

**Dependencies:** Epics 2-3.

**SecDevOps considerations:** Export only public/reference data and validate relationship provenance before publication.

**Risks:** Users confusing inferred mappings with official ones if labeling slips.

## Epic 5: Template Factory

**Goal:** Generate blank, reference-driven templates locally in the browser.

**Stories:** Client-side template engine; artifact-type-first selector; blank planning artifacts; Markdown/CSV/JSON/YAML exports; disclaimer and source metadata.

**Acceptance criteria:** No user, organization, or system data is required, transmitted, or stored; generated outputs are blank/reference-only.

**Existing reusable components:** Browser export patterns, static public bundles, shell actions, current runtime query APIs.

**Dependencies:** Epics 2-4.

**SecDevOps considerations:** No network submission, storage, scoring, or completed artifact generation.

**Risks:** Template wording drifting into advisory or decision-making language.

## Epic 6: Pattern Library

**Goal:** Explain common public-reference authorization patterns without becoming a workflow tool.

**Stories:** Inheritance, reciprocity, shared responsibility, RMF/ATO/ATC, evidence expectations, and common failure-pattern pages.

**Acceptance criteria:** Content is source-linked, generic, disclaimed, searchable, and avoids organization-specific decisions.

**Existing reusable components:** Content modules, glossary patterns, detail-card layouts, current help copy structure.

**Dependencies:** Epics 3 and 5.

**SecDevOps considerations:** Content review for prohibited claims and source accuracy.

**Risks:** Drift into consulting or package-specific guidance.

## Epic 7: Start Here + Glossary

**Goal:** Give new practitioners a clear entry point and shared language without collecting user data.

**Stories:** Client-side Start Here flow; glossary terms; related-object links; surface-specific onboarding.

**Acceptance criteria:** The flow is reference-only, finishes quickly, stores nothing remotely, and links directly into Library, Crosswalks, Patterns, and Templates.

**Existing reusable components:** Current onboarding hooks, glossary drawer patterns, runtime search, content modules.

**Dependencies:** Epics 3, 5, and 6.

**SecDevOps considerations:** No user-input persistence or telemetry.

**Risks:** Overcomplicating entry flows or introducing hidden state.

## Epic 8: QA, Accessibility, and Release Hardening

**Goal:** Deliver a stable, accessible, secure public MVP.

**Stories:** Accessibility smoke tests; Playwright E2E tests; content review; source-license review; release evidence; vulnerability and dependency hygiene.

**Acceptance criteria:** Automated gates, live Pages audit, accessibility review, and security checks are green.

**Existing reusable components:** Current contract tests, smoke checks, audit records, Pages deployment, CodeQL, gitleaks, SBOM generation.

**Dependencies:** All prior epics.

**SecDevOps considerations:** Release-blocking CI/security controls, documented exceptions, and protected deployment flow.

**Risks:** Shipping a polished shell without equivalent accessibility or security coverage.

## Recommended Next Sequence

1. Complete Epic 0 closeout with a fresh live Pages audit against `https://backslashbryant.github.io/control-atlas/`.
2. Extend the data normalization pipeline using the adopted five-artifact runtime contract.
3. Expand Library Browser and Crosswalk Workbench.
4. Add Template Factory, then Pattern Library and Start Here.
5. Finish Epic 8 release hardening and live audits.
