# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** June 19, 2026 (after Epic 3 merge `81daf6d`)

## Epic 0: GovFrame → Control Atlas Migration

* **Status:** Closed for MVP. Residual only.
* **Residual:** D3 graph edge provenance coloring lives in legacy `src/app/app.mjs`; React shell does not expose the graph view. Revisit only if graph returns to the active UI.

## Epic 1: Data Backbone

* **Status:** Closed for MVP. Residual only.
* **Residual:** Continued importer and plain-language quality tuning is maintenance, not a blocking backlog item. Contract tests in `tests/federal-graph-contract.test.mjs` enforce the adopted schema.

## Epic 2: Library + Search

* **Status:** Shipped.

## Epic 3: Compare

* **Status:** Shipped. React Compare workspace in `src/ui/App.tsx` with relationship provenance table, STIG→CCI→NIST trace, baseline delta lists, and exports.

## Epic 4: Template Factory

* **Status:** Active sprint.
* **Template QA:** Audit all nine registered templates for plain-language field prompts and zero org-data inputs.
* **Export contract:** Confirm every format (Markdown, CSV, JSON, YAML) includes disclaimer and source metadata.
* **UI alignment:** Templates selector should lead with artifact type; verify React `TemplatesPage` matches PRD intent-first flow.
* **Verification gap:** E2E does not yet cover generation for all template types.

## Epic 5: Patterns + Glossary + Start Here

* **Status:** Partial.
* **Shipped:** Fifteen pattern pages, glossary drawer with required terms, Start Here three-question form with reference-recommendation label.
* **Start Here gap (PRD 5.8):** Recommendations are plain-text lists — need plain-language rationale plus **direct navigable links** to Library, Compare, Patterns, and Templates (not labels only).
* **Glossary gap (PRD 5.7):** Confirm main-bar search integration and inline links from all object detail pages if not already complete.

## Epic 6: QA + Accessibility + Release

* **Status:** Not started.
* **E2E gap:** Crosswalk and baseline tests added; template generation for all types, graph/table fallback, and full critical-path matrix still open.
* **A11y:** Playwright a11y suite exists; occasional timeout flake under full `precommit`.
* **Release:** No versioned release candidate tag yet.

---

> [!NOTE]
> When an item ships, remove it from this file and update the Epic Status table in [`docs/Plan.md`](../Plan.md) in the **same commit**.
