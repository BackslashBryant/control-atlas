# Control Atlas Backlog: PRD v3.0 Alignment

This backlog captures all misaligned or unimplemented deliverables from Epics 0 through 5 based on the requirements defined in the **PRD v3.0**.

## Epic 0: GovFrame → Control Atlas Migration
* **Missing Schema Extensions (Nodes)**: The node schema has not been updated to include the required `plain_language_summary` field.
* **Missing Schema Extensions (Edges)**: The edge schema has not been updated to include `provenance_class`, `confidence`, `relationship_type`, `source_refs`, and `plain_language_rationale`.
* **Renderer Incomplete**: The graph renderer does not fully implement edge coloring using the new provenance tokens paired with explicit text/icon labels.

## Epic 1: Data Backbone
* **Importer Gaps**: The existing NIST OSCAL and DISA STIG/SRG importers do not extract or generate the mandatory `plain_language_summary` for nodes.
* **Relationship Builder Gaps**: The relationship builder does not enforce or generate the `rationale` and `plain_language_rationale` fields required for inferred mappings.

## Epic 2: Library + Search
* **Status:** Shipped. `library-search.json` is generated at build time with field-weighted MiniSearch over `item_id`, `title`, `plain_language_summary`, and `description`.
* **React Library UI:** `src/ui/App.tsx` powers search results, facet filters without reload, stable `library-detail` deep links, copyable ID/link actions, plain-language-first detail content, and a "What to do next" section.
* **Runtime:** `src/app/runtime.mjs` exposes `searchLibrary`, facet helpers, and `library-detail` URL state consumed by the React shell.

## Epic 3: Crosswalks
* **Status:** Shipped in React Compare workspace (`src/ui/App.tsx`). Relationship table shows `plain_language_rationale`, provenance badges, source references, and refine filters. STIG → CCI → NIST chain uses three-click trace with export. Baseline comparator shows shared/only-in-A/only-in-B control lists, source versions, and export.

## Epic 4: Template Factory
* *Largely aligned.* The template engine exists and all 9 templates are registered.
* **QA Need**: Conduct a review to guarantee that all templates strictly use plain-language prompts for all fields and enforce the rule of requiring zero organizational data.

## Epic 5: Patterns + Glossary + Start Here
* **Start Here Flow Missing**: The "Start Here" button exists in the UI, but it does not open the required 3-question flow (System Type, Data Sensitivity, Operational Environment) to generate an actionable reference recommendation.

---

> [!NOTE]
> All deliverables listed here represent deviations from the PRD v3.0. They should be prioritized and resolved to bring the current baseline up to date with the canonical product direction.
