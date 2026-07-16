# Template Professionalism Post-Edit Audit — 2026-07-16

## Scope and method

The pre-edit audit graded all nine templates that actually existed at commit `781123a8ec44ddf3ecf32fa3711d8a808feba506`. This post-edit audit covers the rebuilt nine plus the new hardware baseline, software baseline, and PPSM preparation worksheet.

Review was not limited to schema checks. All 12 Office outputs were regenerated, their structured content was rendered to temporary landscape-Letter PDFs, and every PDF page was visually reviewed for field completeness, clipping, column density, record splitting, provenance, claim accuracy, and practical print use. The PDF files are QA views of the same document/sheet structure; they are not product download formats or substitutes for native Word/Excel rendering.

Commands:

```text
npm run qa:templates
npm run qa:templates:pdf
```

Review outputs:

- `artifacts/template-qa/` — one editable Office output for each template
- `artifacts/template-print-qa/` — temporary PDF review views

## Results

| Template | Pre-edit | Post-edit | Professional judgment |
|---|---:|---:|---|
| Security Plan Starter | F | A | Functions as a polished SSP preparation companion: field/response blocks for system context, boundary, data, access, and document control; control record cards; operating and inheritance views; revision history; native Word bullets; sources; handoff checks; and an explicit non-import limitation. It is intentionally not a substitute for an agency or FedRAMP SSP. |
| Implementation Statement Worksheet | D | A | Uses public eMASS v3.22-aligned field names, testable narrative guidance, responsibility/inheritance, evidence, lifecycle monitoring, reviewer notes, keyed print views, controlled-value dropdowns, and a field dictionary. |
| Evidence Expectation Matrix | D | A | Separates the working evidence plan from a dedicated control-to-CCI-to-STIG/SRG index, retaining real mappings without forcing dense reference strings into the operational view. Ownership, method, cadence, period, repository, confidence, status, and assessor notes remain actionable. |
| STIG Viewer CSV Preparation Worksheet | F | A | Preserves the exact 12 CSV headers and order documented by the DISA STIG Viewer 3.x User Guide V1R7, keeps evidence notes outside the import-contract table, supplies a field dictionary, and states the target-version validation requirement. |
| Inheritance Worksheet | D | A | Captures provider assertion, evidence/version/freshness, residual local responsibility, delta, validation method, decision basis, owner, date, gaps, controlled values, field guidance, and handoff review. |
| Reciprocity Package Review | C- | A | Supports a real receiving-organization decision through provenance, scope/freshness, environment delta, risk, action, due date, disposition, decision record, field guidance, and explicit receiving-AO authority. |
| POA&M Working Register | F | A | Rebuilt around public eMASS v3.22 field names with operational companion fields for milestones, resources, closure evidence, deviation references, and decision rationale. Four keyed print views, controlled values, a field dictionary, and handoff checks replace the unusable 27-column sheet. |
| Assessment Planning Worksheet | D | A | Covers objective/scope, assessor, method, sample, schedule, evidence request, owner, result, finding, risk, and follow-up, with keyed print views, field guidance, controlled values, and a final handoff check. |
| Continuous Monitoring Calendar | C- | A | Provides deliverable, owner, completion evidence, reporting destination, escalation, result, next action, review notes, starter cadences, field guidance, controlled values, and a compact print layout. |
| Hardware Baseline | — | A | Assessment-ready inventory using public eMASS v3.22 hardware field names plus accountable owner, boundary, discovery, verification, lifecycle, reconciliation, controlled values, field guidance, and explicit preparation-only labeling. |
| Software Baseline | — | A | Lifecycle-aware inventory using public eMASS v3.22 software field names plus dependencies, approval, support dates, scope, licensing, discovery, owner, actions, controlled values, field guidance, and explicit preparation-only labeling. |
| PPSM Preparation Worksheet | — | A | Task-first register for mission need, endpoints, protocol/port/transport, direction, data flow, exposure, protection, ownership, registry references, action, status, risk, field guidance, and handoff review. It does not reproduce or claim importability into the restricted PPSM registry. |

## Visual QA findings and corrections

The first PDF pass exposed defects that structural tests did not:

1. Naive seven-column splitting left a hardware sheet containing only the key and Notes columns. Column groups are now balanced and retain the stable key in every view.
2. Long rows were allowed to split between pages. Print QA now keeps each record together and repeats headers when natural pagination requires another page.
3. Workbook print settings now explicitly use landscape Letter, fit each keyed view to one page wide, repeat row 1 on later pages, and add a Control Atlas/page-number footer.
4. The exact STIG Viewer 12-column contract remains a single table rather than being split into a visually cleaner but non-importable layout.
5. Every workbook now includes a compact field dictionary built from the unsplit source schema, so a reviewer can understand fields even when the operational register is divided into keyed print views.
6. The evidence matrix now prints the operational evidence plan separately from its dense CCI/STIG cross-reference index.
7. SSP pipe-delimited prompts now render as field/response tables, and instruction lists use native Word numbering instead of embedded bullet glyphs.
8. Every companion ends with the same review-and-handoff checks for current official-source confirmation, placeholder completion, accountable review, and downstream-system validation.

No remaining PDF page showed clipped fields or an orphan column view. A rasterizer produced false white bands on isolated pages; an independent MuPDF render confirmed the underlying PDFs were intact.

## Provenance and interoperability boundary

- Official resources are presented before Control Atlas companion downloads in the product UI.
- The artifact catalog distinguishes current machine-readable FedRAMP schemas from legacy Office artifacts and transition guidance.
- eMASS-aligned companions are based on MITRE's public eMASS Client OpenAPI v3.22. That public schema is known to lag current eMASS releases, so the outputs do not claim current import compatibility.
- The STIG worksheet has a documented column contract but has not been round-tripped through the user's target STIG Viewer.
- The hardware, software, POA&M, and implementation outputs are preparation aids, not eMASS-generated import files.
- The PPSM worksheet is a local preparation register, not an official PPSM registry export, receipt, or import file.

## Verdict

All twelve companions earn an A for professional utility: each performs its stated job, explains its authority boundary, points to the official source path, supplies field-level guidance and handoff checks, and prints without structural loss. The remaining limits are correctly disclosed interoperability proof and source access—not missing template fields or misleading presentation.
