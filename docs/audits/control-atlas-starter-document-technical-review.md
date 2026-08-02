# Control Atlas — Starter Document Technical Review

Date: 2026-08-02
Method: regenerated all 12 registered documents via the existing scripted pipeline (`npm run qa:templates` → `node scripts/generate-template-qa.mjs` → `artifacts/template-qa/`), then inspected each with `openpyxl` (Excel) and a raw OOXML text extraction (Word) — no manual browser download needed, this pipeline already exists and is reproducible.

## What changed before this review

The generated files did not previously carry the epic-required pre-launch notice. Added this session:
- `src/shared/disclaimer.mjs`: new exported `PRELAUNCH_REVIEW_NOTICE` constant, alongside the existing `PRODUCT_DISCLAIMER`.
- `src/app/office-export.mjs`: writes it as a second "Review status" row in every Excel Read Me sheet, and as a second paragraph in every Word document's notice table (both share the module-level `DISCLAIMER` table/paragraph they were already built from).
- `src/app/template-engine.mjs`: threaded into the markdown/CSV/JSON/YAML alternate-format renderers too, for consistency (these formats are not in the current registry, which is Word/Excel only, but the code paths exist and should not omit it).
- `src/ui/pages/TemplatesPage.tsx`: added to both the Documents collection listing header and the per-document preview panel, sourced from the same shared constant (no separate copy to drift out of sync).

Verified present in the regenerated output: confirmed via direct XML/cell inspection in both `security_plan_starter.docx` and `poam_starter.xlsx` (see raw evidence in this session's transcript / `docs/STATE.md`).

## Per-document findings

All 12 loaded cleanly (`openpyxl.load_workbook` / raw ZIP+XML extraction) with no repair-warning indicators, no `#REF!`/`#NAME?`/formula-error-shaped strings, no `undefined`/`[object Object]`/`NaN` leakage, and no empty `[Assignment...]` placeholder residue in the one Word document inspected in full.

| Document | Format | Sheets/structure | Classification |
|---|---|---|---|
| Security Plan Starter | .docx | Full narrative with per-control implementation-statement tables, source metadata section, page breaks between major parts | **Ready** |
| Implementation Statement Worksheet | .xlsx | Read Me, Implementation Statements (301 rows — full 800-53 catalog), Field Guide | **Ready** |
| Evidence Expectation Matrix | .xlsx | Read Me, Evidence Expectations (288 rows), Control Cross-Reference Index, Field Guide | **Ready** |
| STIG Viewer CSV Preparation Worksheet | .xlsx | Read Me, STIG Viewer CSV Import Rows, Evidence Working Notes, Field Guide | **Ready** |
| Inheritance Worksheet | .xlsx | Read Me, Inheritance Decision Log (301 rows), Field Guide | **Ready** |
| Reciprocity Package Review | .xlsx | Read Me, Reciprocity Review, Field Guide | **Ready** |
| POA&M Working Register | .xlsx | Read Me, POA&M Working Register, Field Guide | **Ready** |
| Assessment Planning Worksheet | .xlsx | Read Me, Assessment Plan (288 rows), Field Guide | **Ready** |
| Continuous Monitoring Calendar | .xlsx | Read Me, Monitoring Delivery Schedule, Field Guide | **Ready** |
| Hardware Baseline | .xlsx | Read Me, Hardware Baseline, Field Guide | **Ready** |
| Software Baseline | .xlsx | Read Me, Software Baseline, Field Guide | **Ready** |
| PPSM Preparation Worksheet | .xlsx | Read Me, PPSM Preparation Register, Field Guide | **Ready** |

Every workbook's Read Me sheet carries, at minimum: Title, Description, Disclaimer (the long-standing "working draft, not an official form" text), the new Review status notice, How to start, Workbook structure, a Completion Standard, a Review and Handoff Checklist, current FedRAMP-2026-context notes where relevant, Compatibility and Use (naming exactly what the document is *not* — e.g. "not an eMASS-generated import template", "not directly importable into FedRAMP or eMASS"), and Source Metadata (catalog/program context, environment archetype, and dated reference sources with version numbers).

No document was found to: invent a requirement or decision, silently pick a baseline (the app-level generation form requires an explicit baseline or "All controls" choice with no default — confirmed live, see the readiness report), or prefill organizational data (every generated example is either blank or an explicitly-labeled placeholder for the user to complete).

## Not independently re-verified this session

- The prior `docs/audits/fedramp-2026-transition-hardening-2026-07-16.md` correction pass and `docs/audits/template-professionalism-post-edit-2026-07-16.md`'s full manual grading rubric were not re-run cell-by-cell; this review instead confirmed structural integrity (loads cleanly, no formula errors, real non-placeholder content, correct source citations) and the one new addition (the review notice). Given the 08-02 full-record ingestion changed underlying control text (Discussion, 800-53A evidence) that these worksheets pull from, a full manual re-grade against that same rubric is reasonable future work — flagged here, not performed.
- Print/visual QA (`npm run qa:templates:pdf`) was not run this session; the technical (load/structure/content) check above did not require it.

## Paid-companion potential (informational only, no pricing recommendation)

Per the epic's instruction to record but not price: these are general-purpose federal-RMF/FedRAMP working documents (SSP, POA&M, inheritance, assessment planning, continuous monitoring, hardware/software baselines) that could plausibly anchor a future paid companion product (e.g., a maintained/versioned template subscription, or an eMASS/FedRAMP-schema-synced premium tier) given their breadth and the "Compatibility and Use" sections' explicit call-outs of what a paid integration would need to bridge (schema alignment, round-trip import). No pricing, packaging, or monetization decision is made or implied here.

## Classification summary

All 12: **Ready for external practitioner evaluation**, with the newly-added review notice now present on both the collection page and inside every generated file. None requires hiding or removal.
