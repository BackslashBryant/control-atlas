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
* **MiniSearch Integration**: `minisearch` is added to dependencies and used in data scripts, but full UI integration (field-weighted search for IDs vs plain language) is incomplete in the browser runtime (`app.mjs`).
* **Object Detail UI**: Object detail pages do not yet lead with the `plain_language_summary` before the formal source text, as the field does not yet exist.
* **Library Filters**: Need to verify and finalize comprehensive filtering by object type, source class, family, and severity without requiring page reloads.

## Epic 3: Crosswalks
* **Relationship Table Missing Fields**: The relationship table UI needs to be updated to display the `plain_language_rationale`.
* **Crosswalk Workflows**: The specific 3-click trace workflow from a STIG rule → CCI → NIST control is not explicitly built out.
* **Baseline Comparator**: The baseline comparator UI (comparing NIST Low/Moderate/High vs. FedRAMP Low/Moderate/High) with a clear delta view is entirely unimplemented.

## Epic 4: Template Factory
* *Largely aligned.* The template engine exists and all 9 templates are registered. 
* **QA Need**: Conduct a review to guarantee that all templates strictly use plain-language prompts for all fields and enforce the rule of requiring zero organizational data.

## Epic 5: Patterns + Glossary + Start Here
* **Start Here Flow Missing**: The "Start Here" button exists in the UI, but it does not open the required 3-question flow (System Type, Data Sensitivity, Operational Environment) to generate an actionable reference recommendation.

---

> [!NOTE]  
> All deliverables listed here represent deviations from the PRD v3.0. They should be prioritized and resolved to bring the current baseline up to date with the canonical product direction.
