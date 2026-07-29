# Control Atlas UX correction backlog

Date: 2026-07-28  
Source audit: [Full surface audit](../audits/control-atlas-full-surface-audit-2026-07-28.md)  
Target: [Target experience](../design/control-atlas-target-experience-2026-07-28.md)  
Status: recommended sequence, not implemented

## Delivery rule

Run this as one correction program in the order below. Do not start visual polish while source attribution or generated-input truth can still fail. Each milestone requires its listed contracts before the next milestone begins. Retire replaced code and tests in the same milestone; do not create parallel permanent surfaces.

Effort bands:

- S: up to 2 focused engineering days.
- M: 3–5 focused engineering days.
- L: 1–2 focused engineering weeks.
- XL: multi-milestone; must be decomposed before implementation.

## Milestone 0 — Stop untruthful output

### CA-P0-001 — Split ingestion provenance from exact publication identity

- Priority/severity: P0 / Critical.
- Evidence: Live CSF route `#/record/csf-2/DE.AE-08` says `Source excerpt from SP 800-53 Rev. 5`. `csf-subcategories.json` and the build script assign CSF to `nist-oscal`; the shared source-registry entry displays `SP 800-53 Rev. 5`.
- Affected: every catalog using `nist-oscal`, record headers, citations, source links, Sources, generated documents.
- Violated principle: source truth and product interpretation must remain separate; misattribution can never happen.
- Root cause: one registry identity represents both an ingestion mechanism and several publications.
- Correction: create exact publication identities per catalog; retain OSCAL as ingestion provenance only; fail closed when a record cannot resolve an exact publication.
- Target reference: `Record → Source identity fail-closed contract`.
- Dependencies: none; blocks all other milestones.
- Acceptance:
  - DE.AE-08 identifies NIST Cybersecurity Framework 2.0, never SP 800-53.
  - SP 800-53, SP 800-171, CSF, SSDF, and every other OSCAL-fed catalog resolve to their exact publication.
  - No `official`, `source excerpt`, publisher, citation, or source link renders from an ingestion-channel label.
  - Missing mappings show `Official source identity unavailable` and hide guessed attribution.
  - Source links target a verified official publication/catalog landing page.
- Regression:
  - Parameterized catalog-to-publication identity contract across the full generated node index.
  - Representative record browser test for every catalog.
  - Negative fixture with missing/mismatched publication that must fail closed.
- Owner persona: Sentinel lead, Forge implementation, Pixel verification.
- Effort: M.

### CA-P0-002 — Remove silent baseline defaults from Build output

- Priority/severity: P0 / Critical.
- Evidence: `TemplatesPage.tsx` defaults an absent baseline to Moderate and passes it into generated material.
- Affected: Build task configuration, previews, DOCX/XLSX output, copied URLs.
- Violated principle: Control Atlas never selects an applicable baseline or determines authorization inputs.
- Root cause: UI convenience default is also treated as substantive document input.
- Correction: represent `not selected` explicitly; require user action where baseline is required; omit the field where optional; never infer Moderate.
- Target reference: `Build → Starter documents`.
- Dependencies: CA-P0-001 for correct citations.
- Acceptance:
  - Fresh Build state contains no selected baseline.
  - A required baseline blocks preview/download with a precise prompt.
  - An optional baseline remains omitted and is recorded as not selected.
  - Refresh/copied URL preserves explicit selection and omission.
  - No generated file names or text imply Control Atlas selected applicability.
- Regression: state-schema unit tests; all template fixtures with omitted/selected/invalid baseline; export content assertions.
- Owner persona: Forge.
- Effort: S.

### CA-P0-003 — Make preview and download share one validity state

- Priority/severity: P0 / Critical.
- Evidence: code allows an unavailable preview while the Download action remains enabled.
- Affected: all starter documents and formats.
- Violated principle: false affordances and unsafe output are prohibited.
- Root cause: preview and export derive readiness separately.
- Correction: one validated generation state controls preview, download, status, and retry.
- Target reference: `Build → Starter documents`.
- Dependencies: CA-P0-002.
- Acceptance:
  - Invalid/missing input disables both preview and download.
  - Generation failure disables download, names the failure, and offers retry/change-format.
  - The bytes downloaded are generated from the same validated input snapshot shown in preview metadata.
- Regression: reducer/logic tests plus one browser flow for success, invalid input, and generation failure.
- Owner persona: Forge.
- Effort: S.

### Milestone 0 gate

No record or generated artifact can display guessed source identity, silent baseline selection, or stale-valid download state. The catalog-wide identity contract and all template omission/failure fixtures pass.

## Milestone 1 — Restore canonical destination and state contracts

### CA-P1-001 — Create one destination identity registry

- Priority/severity: P0 / High.
- Evidence: `/search` is labeled Explore and can select Catalog; Start route/title uses Start versus Start here; Resources lacks a canonical global entrance; raw/internal labels leak.
- Affected: labels, URLs, page titles, selected states, analytics, breadcrumbs/context, recovery.
- Violated principle: one canonical identity per destination.
- Root cause: route, navigation, title, and page copy are owned in separate modules.
- Correction: one typed destination registry for Home, Search, Explore, Catalog, Compare, Learn, Build, Resources, Sources, About.
- Target reference: `Global information architecture`.
- Dependencies: none.
- Acceptance:
  - Matrix test proves visible label, URL, title, selected nav, analytics, and context agree.
  - `/search` never displays Explore or selects Catalog.
  - Internal view/route keys never appear in UI or accessible names.
  - Every generated link is canonical.
- Regression: parameterized identity and round-trip history suite.
- Owner persona: Forge.
- Effort: M.

### CA-P1-002 — Put all meaningful state in validated URLs

- Priority/severity: P0 / High.
- Evidence: Catalog query/family/browse-all, Sources query, Build filters, and Resources show-all are local. Resources parses/serializes parameters it does not apply.
- Affected: Search, Explore, Catalog, Compare, Build, Resources, Sources.
- Violated principle: state must be shareable and recoverable.
- Root cause: component-local state and route schemas evolved independently.
- Correction: define typed per-destination URL schemas; preserve valid values; discard only invalid values with a visible recovery note.
- Target reference: destination sections throughout target UX.
- Dependencies: CA-P1-001.
- Acceptance:
  - Query, filters, selections, task/document configuration, mode, and focus survive refresh, history, and copied links.
  - Ignored parameters are removed from the schema or implemented.
  - Invalid values are minimally discarded and reported.
- Regression: URL property/round-trip tests plus desktop/mobile history flows.
- Owner persona: Forge.
- Effort: L.

### CA-P1-003 — Replace Start Here questionnaire with an honest source navigator

- Priority/severity: P0 / High.
- Evidence: every complete answer combination returns the same seven-source array while the page says results are based on answers.
- Affected: Home Start Here card, `/start`, result copy and analytics.
- Violated principle: do not invent applicability or recommendations; controls must change outcomes or not be controls.
- Root cause: superseded PRD flow survived as a questionnaire shell around a fixed list.
- Correction: delete unused questions and expose browsable source starting points with explicit inclusion rules; if no differentiated source rules exist, retire the surface and route to Sources/Search.
- Target reference: `Home` and `Start Here` decision.
- Dependencies: CA-P0-001 and CA-P1-001.
- Acceptance:
  - No question is asked unless it changes eligible results under a documented rule.
  - No `based on`, personalized, recommended, applicable, or baseline-selection claim appears.
  - Every source states why it is listed and that governing judgment remains external.
- Regression: all source-navigation paths assert rule/result correspondence; retired route behavior tested if deleted.
- Owner persona: Muse product/copy, Forge implementation.
- Effort: M.

### CA-P1-004 — Replace stale route tests with canonical workflow coverage

- Priority/severity: P0 / High.
- Evidence: responsive/visual/a11y suites still target `/menu`, `/library`, `/playbooks`, and `/templates`, allowing green checks against recovery pages.
- Affected: regression confidence and release gates.
- Violated principle: tests must prove current product behavior.
- Root cause: route migrations did not retire test inventory.
- Correction: generate route cases from the destination registry; fail tests when a named canonical surface resolves to recovery/not-found.
- Target reference: `Target acceptance`.
- Dependencies: CA-P1-001.
- Acceptance:
  - No active suite navigates a retired route except explicit recovery tests.
  - Each canonical route asserts destination identity and at least one defining function.
  - Release smoke proves Search, Explore, Catalog, Record, Compare, Learn, Build, Resources, and Sources.
- Regression: meta-test compares route registry with E2E inventory.
- Owner persona: Pixel.
- Effort: M.

### Milestone 1 gate

Every canonical route and state round-trips; retired paths are only in recovery tests; Start Here is honest or absent.

## Milestone 2 — Rebuild first-screen architecture

### CA-P2-001 — Make Search the Home signal action

- Priority/severity: P1 / High.
- Evidence: three equal cards and RMF appear before Search; mobile Search is below the first screen.
- Affected: Home desktop/mobile and global Search entry.
- Violated principle: Home offers one primary action and exposes Search immediately.
- Root cause: entry personas were treated as equal hero actions.
- Correction: target Home wireframe—Search first; Open the Atlas, Browse Catalog, Find Tools & Resources as compact secondary entrances.
- Target reference: `Home`.
- Dependencies: CA-P1-001.
- Acceptance:
  - Search field and button are visible at 375×812 without scrolling.
  - Only one primary visual action exists.
  - RMF is absent from Home and available as an optional Explore lens.
  - Home has no rotating slogan or repeated section scaffold.
- Regression: screenshot/layout bounds at 375, 768, 1440 and semantic heading/action assertions.
- Owner persona: Muse lead, Forge implementation.
- Effort: M.

### CA-P2-002 — Expose Build’s three equal lanes and promote Resources

- Priority/severity: P1 / High.
- Evidence: ten task cards and “Choose the work / Start with a task” bury starter documents and the 96-item Resources directory.
- Affected: Home, Build, Resources, contextual links.
- Violated principle: Resources belongs under Build but must remain discoverable; progressive disclosure.
- Root cause: task funnel became the only Build landing architecture.
- Correction: Build opens with Tasks, Starter documents, Resources; Resources also receives a Home secondary entrance.
- Target reference: `Build and Resources`.
- Dependencies: CA-P1-001 and CA-P1-002.
- Acceptance:
  - All three lanes are visible in the first desktop and mobile viewport.
  - Resources stays canonically under `/build/resources`.
  - Users can reach any lane without selecting a task.
  - Sources remains provenance-only.
- Regression: route-entry tests from Home, Build, Record context, and mobile menu.
- Owner persona: Muse/Forge.
- Effort: M.

### CA-P2-003 — Turn Sources into a compact trust register

- Priority/severity: P1 / Medium.
- Evidence: 46 sources sit behind promotional copy, accordions, filters, and excessive whitespace.
- Affected: Sources list/detail and Resources boundary.
- Violated principle: first screen should answer what this is and expose the core work.
- Root cause: marketing/education framing precedes the inventory.
- Correction: compact searchable list with publisher, publication, coverage, version/date, and status; one sentence links to Resources.
- Target reference: `Sources`.
- Dependencies: CA-P0-001 and CA-P1-002.
- Acceptance:
  - First screen contains search, total, filters, and at least several source rows.
  - Search/filter state is shareable.
  - Exact publication identities reconcile with record attribution.
- Regression: source count and record-source cross-reference contract; responsive list.
- Owner persona: Muse/Forge.
- Effort: M.

### Milestone 2 gate

At all target widths, Home Search and all three Build lanes are immediately visible; Sources leads with trust data; no RMF default remains.

## Milestone 3 — Finish Explore, Catalog, Compare, and Learn

### CA-P3-001 — Rebuild Explore around one scope with Path, Map, and List

- Priority/severity: P1 / High.
- Evidence: modes appear only after record selection; Path is a seven-stage relationship wizard; Map is neighborhood-only.
- Affected: Explore landing, focused Explore, relationship model, URLs.
- Violated principle: Catalog exhaustive/Explore guided; Path/Map/List same declared scope; structural truth.
- Root cause: record relationship navigation was renamed Explore without an atlas-level scope model.
- Correction: implement shared scope; accessible Path/List primary; bounded overview Map and record-neighborhood Map; RMF optional.
- Target reference: `Explore`.
- Dependencies: CA-P0-001, CA-P1-002.
- Acceptance:
  - Explore opens with supported scope selection and visible Path/Map/List.
  - All three modes report the same scope and reconcile counts.
  - Path contains publisher-declared hierarchy only.
  - Unknown/multiple ancestry follows an explicit rule or honest absence.
  - Overview and neighborhood map workloads are bounded.
- Regression: graph fixtures, count parity, URL round trips, one framework workflow per structural shape.
- Owner persona: Forge lead, Muse semantic review.
- Effort: L.

### CA-P3-002 — Repair Explore tablet and zoom layouts

- Priority/severity: P1 / High.
- Evidence: at 768px, map filter controls extend to roughly x=980 on a 753px client width.
- Affected: Explore filters, map, List switch, 200% zoom.
- Violated principle: responsive presentation may change, meaning and controls may not.
- Root cause: fixed grid/min-width assumptions.
- Correction: single-column control stack below breakpoint; named filter drawer where needed; Map bounded to container; Path/List always available.
- Target reference: `Responsive behavior`.
- Dependencies: CA-P3-001.
- Acceptance:
  - No page-level or hidden control overflow at 320, 375, 640 effective, 768, or 1440 CSS pixels.
  - 200% zoom preserves every filter, mode, warning, and result.
  - Mobile List covers the same scope as Map.
- Regression: Playwright bounding-box and horizontal-overflow assertions plus manual 200% checklist.
- Owner persona: Forge/Pixel.
- Effort: M.

### CA-P3-003 — Replace publisher-wall Catalog with exhaustive grouped inventory

- Priority/severity: P1 / High.
- Evidence: Catalog is 2,545px desktop and roughly 5,654px mobile; no first-screen search; catalog detail truncates at 100 and local filters are not shareable.
- Affected: Catalog landing/detail.
- Violated principle: Catalog exhaustive and shallow-to-deep; publisher is a lens.
- Root cause: publisher groups became the only taxonomy and detail rendering uses a hard cap.
- Correction: type-grouped default, Search and facets first, publisher alternate view, explicit pagination/virtualization, URL state.
- Target reference: `Catalog`.
- Dependencies: CA-P1-002 and canonical Search index.
- Acceptance:
  - Counts reconcile to the full corpus.
  - No silent 100-row ceiling.
  - Search, type, publisher, lifecycle, grouping, and page state round-trip.
  - Mobile does not require a 5,000px unfiltered publisher wall.
- Regression: total/count contracts and representative desktop/mobile browse flows.
- Owner persona: Forge/Muse.
- Effort: L.

### CA-P3-004 — Make Compare mode selection advance immediately

- Priority/severity: P1 / High.
- Evidence: Framework to framework updates URL but leaves the same five-card chooser.
- Affected: Compare entry, every mode, configured workbench, mobile.
- Violated principle: controls must lead to a useful outcome and provide perceivable feedback.
- Root cause: mode cards update intent without exposing the next state.
- Correction: compact modes reveal required fields inline; valid configuration opens results; invalid/incomplete state names the next input.
- Target reference: `Compare`.
- Dependencies: CA-P1-002.
- Acceptance:
  - Each mode reveals distinct required inputs after one activation.
  - Framework-to-framework reaches a cited mapping result or honest no-mapping state.
  - Back/refresh/share preserve mode and inputs.
  - Mobile results preserve provenance without relying on hidden columns.
- Regression: one end-to-end job per mode and zero/error fixtures.
- Owner persona: Forge.
- Effort: M.

### CA-P3-005 — Populate a minimum honest Learn or remove it from navigation

- Priority/severity: P1 / High.
- Evidence: Learn shows 0 playbooks in 0 categories, `Recommended for new users`, and a 2,104px mobile empty surface.
- Affected: Learn navigation, loading fallback, old playbook code/routes/tests.
- Violated principle: no parallel/half-baked surfaces; no patronizing expertise labels.
- Root cause: empty content product remained globally exposed after correction work.
- Correction: publish the six target explanation topics with explicit Control Atlas authorship; until complete, remove Learn from primary navigation and route users to useful existing material.
- Target reference: `Learn`.
- Dependencies: CA-P1-001 and copy system.
- Acceptance:
  - Learn has no novice/new-user/beginner labels.
  - Every article identifies product authorship, citations, limitations, and next action.
  - No empty global destination remains.
  - Playbook route/component vocabulary is retired or intentionally migrated.
- Regression: content-manifest minimum and route identity tests.
- Owner persona: Muse.
- Effort: M.

### Milestone 3 gate

The twelve practitioner jobs pass across desktop and mobile, with actual 200% zoom manually verified. Explore modes reconcile; Catalog is exhaustive; Compare advances; Learn is useful or absent.

## Milestone 4 — Consolidate copy, search, and presentation ownership

### CA-P4-001 — Establish a speaker-aware copy manifest and complete audit gate

- Priority/severity: P1 / High.
- Evidence: current extractor scans TSX only and misses MJS, JSON, generated output, interpolation, and accessibility strings; cringe/repetitive copy remains despite green Vale checks.
- Affected: all user-facing copy and generated artifacts.
- Violated principle: source/product separation and extensive copy conformance.
- Root cause: literal extraction is treated as comprehensive.
- Correction: inventory user-facing strings from TS/TSX/MJS/JSON/data templates; tag speaker/authority class; document official-text exemptions; add deterministic repetition and banned-claim gates with human review.
- Target reference: `Copy system`; [copy register](../../artifacts/audits/control-atlas-2026-07-28/copy-register.csv).
- Dependencies: CA-P0-001.
- Acceptance:
  - Every string class is inventoried or explicitly exempt.
  - The gate detects repeated four-word phrases across three surfaces, repeated openings, heading/lede/card duplication, disclaimer duplication, and banned determination copy.
  - Official source text is checked for attribution/separation, not rewritten.
  - Human editorial sign-off is required for major surfaces.
- Regression: bad/good fixtures plus coverage manifest comparison.
- Owner persona: Muse lead, Forge tooling.
- Effort: M.

### CA-P4-002 — Replace repetitive and patronizing product copy

- Priority/severity: P1 / High.
- Evidence: `Choose the work`, `Start with a task`, `practical starting point`, `Recommended for new users`, `New here?`, `plain English`, tree metaphors, slogans, repeated disclaimers.
- Affected: Home, Search, Record, Compare, Learn, Build, Resources, Sources, About, footer, loading.
- Violated principle: plain operational language, concrete action, no patronizing labels or platitudes.
- Root cause: repeated page scaffolds and product-marketing voice.
- Correction: apply exact replacements/dispositions in the copy register; reduce each first screen to identity, consequence, action.
- Target reference: all wireframes.
- Dependencies: CA-P4-001 and destination restructures.
- Acceptance:
  - No banned audience label, rotating slogan, empty choose/start/understand opening, or ungrounded recommendation remains.
  - No repeated non-global four-word phrase appears across three major surfaces without a documented functional reason.
  - Disclaimers appear once per risk boundary.
- Regression: copy gate plus human surface review.
- Owner persona: Muse.
- Effort: M.

### CA-P4-003 — Consolidate search on the existing MiniSearch package

- Priority/severity: P1 / High.
- Evidence: at least five search implementations; a vendored MiniSearch file is byte-identical to npm 7.2.0; overlay and Resources diverge.
- Affected: Search, overlay, Catalog, Resources, glossary/benchmarks.
- Violated principle: one canonical data model and lifecycle-sustainable ownership.
- Root cause: each surface built its own matching/ranking pipeline.
- Correction: npm MiniSearch as single implementation; one typed eligibility/result contract; surface-specific facets only; delete unused/duplicate indexes.
- Target reference: [OSS evaluation](../../artifacts/audits/control-atlas-2026-07-28/oss-evaluation.md).
- Dependencies: CA-P1-001, CA-P1-002.
- Acceptance:
  - Exact ID, ambiguous text, typo, filter, and honest zero-result benchmarks pass.
  - Overlay, Search, Catalog, and Resources agree on destination identity and eligibility.
  - Duplicate vendored ownership and unused generated index are removed or generated/hash-checked with ownership recorded.
  - No Orama/Pagefind adoption without a failed measured benchmark and approved migration/removal plan.
- Regression: shared corpus benchmark and index-manifest/hash tests.
- Owner persona: Forge.
- Effort: L.

### CA-P4-004 — Reduce chrome, dead space, and brittle CSS

- Priority/severity: P1 / High.
- Evidence: large first-screen panels, repeated headings, 2,000–5,600px mobile stacks, oversized footer, 130KB surface CSS, hard-coded `min-height:132rem`, competing style layers.
- Affected: shell and every major destination.
- Violated principle: progressive disclosure, constrained-team usability, Orbital Signal/Mission depth.
- Root cause: page-specific framed-panel accretion and fixed-height responsive patches.
- Correction: adopt target density/spacing/container rules; remove hard-coded page heights; consolidate shared surface primitives incrementally; delete superseded selectors per migrated surface.
- Target reference: `Layout and density rules` and wireframes.
- Dependencies: Milestones 2–3 layout.
- Acceptance:
  - Home/Search action fits first mobile viewport.
  - Catalog/Build/Resources first useful results appear without traversing introductory card walls.
  - No route uses content-agnostic multi-rem min-height to simulate completeness.
  - Footer is compact and boundaries are not duplicated.
  - Per-surface CSS removal is recorded; no second permanent design system is added.
- Regression: layout bounds, visual snapshots, computed overflow, and CSS ownership checks.
- Owner persona: Muse/Forge.
- Effort: L.

### Milestone 4 gate

The copy manifest and repetition gate cover all user-facing classes; one search implementation owns eligibility; each migrated surface deletes superseded copy/styles/index code; density targets pass at all viewports.

## Milestone 5 — Independent proof and release decision

### CA-P5-001 — Run full live workflow, accessibility, and source-truth proof

- Priority/severity: P0 release gate / High.
- Evidence: current suite can pass retired routes; actual 200% zoom and human assistive technology remain unverified.
- Affected: product-wide release claim.
- Violated principle: claims must match evidence.
- Root cause: local automated proof has been allowed to stand in for deployed and human proof.
- Correction: run canonical route matrix on the deployed candidate; perform actual 200% zoom, keyboard, reduced motion, NVDA, VoiceOver, TalkBack, and physical phone/tablet checks where available; record blocked items honestly.
- Target reference: `Target acceptance`.
- Dependencies: all preceding milestones.
- Acceptance:
  - All surface-matrix rows are Pass or explicitly Blocked/Skipped with owner and reason.
  - All 12 practitioner workflows pass at desktop and mobile.
  - Catalog-wide publication identity audit reports zero mismatch.
  - No Critical/High finding remains.
  - Live asset/build markers and commit are recorded.
- Regression: release evidence artifact, deployed smoke, human checklist.
- Owner persona: Pixel lead, Sentinel source-truth review.
- Effort: M plus human/device availability.

## Final disposition summary

| Feature | Disposition |
|---|---|
| Home | Replace first-screen hierarchy |
| Start Here questionnaire | Replace with honest source navigator or delete |
| Universal Search | Keep; consolidate identity and indexes |
| Global search overlay | Consolidate into Search result contract |
| Explore Path | Replace relationship-stage wizard with structural path |
| Explore Map | Finish using React Flow + ELK |
| Explore List | Keep; compact and align scope |
| Catalog | Replace landing architecture; finish exhaustive detail |
| Records | Keep; replace source attribution model and reorder |
| Compare | Finish |
| Learn | Finish to minimum content or delete from navigation |
| Build tasks | Consolidate |
| Starter documents | Keep; fail closed |
| Resources | Keep; promote as equal Build lane |
| Sources | Consolidate into trust register |
| About | Replace metaphors/claims with direct methods and boundaries |
| Retired routes | Keep only explicit recovery |
| Duplicate search/index ownership | Delete after consolidation |
| Vendored MiniSearch copy | Delete or generated/hash-check |
| React Flow + ELK | Keep |

