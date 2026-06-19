# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** June 19, 2026 (after Epic 6 QA + Release ship — tag `v1.0.0-rc.1`)

## Epic 0: GovFrame → Control Atlas Migration

* **Status:** Closed for MVP. Residual only.
* **Residual:** D3 graph edge provenance coloring lives in legacy `src/app/app.mjs`; React shell does not expose the graph view. Revisit only if graph returns to the active UI.

## Epic 1: Data Backbone

* **Status:** Closed for MVP. Residual only.
* **Residual:** Continued importer and plain-language quality tuning is maintenance, not a blocking backlog item. Contract tests in `tests/federal-graph-contract.test.mjs` enforce the adopted schema.

## Epics 2–6

* **Status:** Shipped. See Epic Status table in [`docs/Plan.md`](../Plan.md).

---

> [!NOTE]
> When an item ships, remove it from this file and update the Epic Status table in [`docs/Plan.md`](../Plan.md) in the **same commit**.
