# Live-Site Polish Backlog

Source: live-site walkthrough + template-output audit, 2026-07-10 (post SPR-remediation ship `0a29f49`).
Shipped the same day, so NOT in this backlog: search provenance fix, 705 blocked-relationship repair, office export layout, coverage badges + supported-catalog contract, orbital landing, nav disclosure, frame-bust, template content overhaul, Explore "No connections yet" false-negative fix.

## P1 — trust & first-use

- [ ] **Relationship group labeling**: AC-2 detail shows "27 other public mappings" — now that OLIR CSF 2.0 / SP 800-171 mappings are ingested, label them as named crosswalk groups ("CSF 2.0 crosswalks", "SP 800-171 mappings") instead of "other". Grouping logic feeds the record-detail Connections panel.
- [ ] **Visual-density screenshot pass**: browser-pane screenshots timed out during this walk, so density judgments (orbit row at 720–1100px widths, focus rings, glow on low-DPI) are unverified. Re-run with working screenshots at mobile/tablet/desktop and both reduced/normal motion. (Owner rule: never rationalize crowding away without pixels.)
- [ ] **`isLowCatalogCoverage` boundary**: threshold is `pct < 75`, so SP 800-171 Rev. 3 at exactly 75% skates past the Preview badge. Decide inclusive (`<= 75`) or a stated cutoff; adjust `src/ui/lib/catalogCoverage.ts` + a11y-contract assertion together.
- [ ] **Known-gaps note for residual blocked relationships**: 11 remain in graph-health (9 OLIR rows with bare family/category endpoints e.g. "CP" → "PR.IR-03"; 2 stale DoD ZT refs to EC-1/SAC-16). Surface a short "known upstream gaps" line on the Sources page so the number is explained, not discovered.

## P2 — template value adds (post content-overhaul)

- [ ] **Archetype-aware inheritance pre-fill**: for Cloud SaaS / CSP archetypes, pre-mark commonly provider-inherited families (PE, MP, parts of CP/SC) in the Inheritance Worksheet with "typically inherited — verify with your provider's CRM/SSP" rows. This is the product's birds-per-stone thesis applied to templates. Needs a small curated archetype→family table in `src/app/template-engine.mjs`.
- [ ] **Evidence-type-by-family suggestions**: Evidence Expectation Matrix can suggest artifact types from the control family (AU → log samples/retention config; CM → config exports/change records; AT → training records; RA → scan reports). Curated map, ~20 lines, replaces the generic evidence menu bullet.
- [ ] **Template card copy sync**: POA&M card promises "eMASS/FedRAMP columns" — sync `TemplatesPage.tsx` descriptions with the redesigned outputs (field guide + core tracker).
- [ ] **Enhancement-include toggle in UI**: engine option `includeEnhancements` exists; expose a checkbox on TemplatesPage for all-controls mode.
- [ ] **XLSX data-validation dropdowns** for Status/Severity columns (OOXML dataValidation elements; hand-rolled writer already emits styles).
- [ ] **DOCX visual styling pass**: heading styles, cover page, brand-neutral fonts; add LibreOffice raster QA gate in CI (blocked locally — no LibreOffice on this machine).

## P3 — coverage & data

- [ ] **0% catalogs**: MITRE ATT&CK ICS, AI RMF, SSDF, DoD RAI have zero connected nodes; SP 800-172 is 1%. Either ingest crosswalk sources for them or curate their search exposure beyond the Preview badge (e.g. suppress from default search ranking).
- [ ] **Upstream OLIR gaps**: report/patch the 9 bare-identifier rows upstream, or add a curated local completion for the obvious ones (CP-4 → RC.RP-03 style) with `inferred` provenance class.

## P4 — hygiene

- [ ] **navigation-fidelity focus flake**: `#library-results` toBeFocused race under parallel e2e load (passes 5/5 isolated). Find the focus-after-load path and make it deterministic or wait on a stable signal.
- [ ] **Bundle size**: build warns >500 kB chunk; consider code-splitting the graph stack (React Flow + ELK) behind the atlas route.
- [ ] **Live-smoke spec**: currently skipped off-live; consider a scheduled Pages-live-smoke run against production after each deploy (workflow `pages-live-smoke.yml` exists — verify it's wired to the deploy event).
