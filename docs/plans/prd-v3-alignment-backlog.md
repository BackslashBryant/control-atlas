# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** June 19, 2026 (after Epic 5 Patterns + Glossary + Start Here ship)

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

* **Status:** Shipped.

## Epic 5: Patterns + Glossary + Start Here

* **Status:** Shipped.

## Epic 6: QA + Accessibility + Release

* **Status:** Active sprint.
* **E2E gap:** Graph/table fallback and full critical-path matrix still open. Template generation E2E shipped in Epic 4. Start Here navigation E2E shipped in Epic 5.
* **A11y:** Playwright a11y suite exists; occasional timeout flake under full `precommit`.
* **Release:** No versioned release candidate tag yet.

---

> [!NOTE]
> When an item ships, remove it from this file and update the Epic Status table in [`docs/Plan.md`](../Plan.md) in the **same commit**.
