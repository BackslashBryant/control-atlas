# Control Atlas Visual / UX Audit

**Audit date:** August 21, 2026  
**Surface audited:** Deployed GitHub Pages application at `https://rambulls.github.io/control-atlas/`  
**Method:** Live-product inspection only. No repository or source-code inspection. Desktop and 375 × 812 mobile states, keyboard operation, production DOM/computed styles, route and failure-state behavior, every downloadable artifact, and the Orbital guide were inspected. Screen-reader speech was explicitly excluded.

## Epic reconciliation — August 27, 2026

This table is the current disposition of the August 21 observations. The
original evidence below remains intact. `Resolved` means the observed defect is
covered by current implementation and a focused contract. `Superseded` means
the route was deliberately replaced by a different product composition.
`Partial` and `Open` remain backlog for the active Product Trust and Surface
Coherence Epic in `docs/Plan.md`.

| Finding | Status | Current evidence or remaining gap |
|---|---|---|
| P1-01 Compare route corruption | Resolved | Staged runtime loading cancels route work and `tests/e2e/compare-cross-route-corruption.spec.mjs` protects Compare → Templates recovery. |
| P1-02 unbounded full Compare | Resolved | Large matrices use fixed 100-row URL-addressable pages; navigation replaces the current window while counts, CSV, and Excel exports retain the complete filtered result. |
| P1-03 keyboard and focus | Resolved | Shared route orientation and navigation tests protect search activation, focus return, heading focus, and mobile-menu traversal. |
| P1-04 mobile Sources and hidden controls | Resolved | Live 390 px proof has no page overflow or zero-size focusable controls; the desktop table becomes stacked records and the publisher strip is a named horizontal region. |
| P1-05 document preview and oversized starter | Resolved | Preview now reports purpose, section/table/row scope, a complete section outline, and one representative table instead of reproducing every table. The selected control source is named separately from the template's documentary basis. The SSP starter is a compact narrative core with a control-family index and an explicit handoff to the control-by-control Implementation Statement Worksheet; dense STIG/SRG mappings are no longer embedded. |
| P1-06 Library Compare dead end | Resolved | The persistent tray names selections, supports remove/clear, preserves mobile width, and hands off runnable state; covered by `tests/e2e/library-compare-tray.spec.mjs`. |
| P2-01 Guides are explainers | Resolved | All 12 Guides now carry and render a goal, prerequisites, three actionable steps, expected output, validation checks, limitations, official references, and a governed next action; the content contract fails if any procedural field is absent. |
| P2-02 empty root Atlas topology | Superseded | Root Atlas is now a coverage decomposition that says `Not yet modeled` for empty areas and keeps populated areas and authority counts visible. |
| P2-03 long record relationships | Resolved | Record detail groups and samples published relationships, collapses lower-priority groups, and hands the exhaustive set to Atlas. |
| P2-04 repeated resource copy | Resolved | Resource detail suppresses overview and `what it does` text when either duplicates the hero summary. |
| P2-05 missing dense-data contract | Resolved | Shared page contracts and the Guardian matrix govern density and mobile transformation; Compare uses 100-row pages, Resources uses 25-row increments and a labeled 75-item map window, and Library distinguishes visible, loaded, and total scope. |
| P2-06 route orientation primitive | Resolved | `src/ui/lib/routeOrientation.ts` owns focus, scroll, push, and Back/Forward behavior with navigation fidelity coverage. |
| P2-07 template-card distinctions | Resolved | Cards retain format, compatibility basis, and governed tags and now add an evidence-based scan line for required-input setup and editable output format without inventing time estimates. |
| P2-08 single-card grids | Resolved | Single-template groups use the deliberate `intent-grid--solo` composition. |
| P3-01 mobile Home search | Resolved | The current 390 px composition gives search a full-width field and one full-width orange action without page overflow. |
| P2-09 cinematic utility motion | Resolved | Full route feedback remains reserved for meaningful route-scope changes; Library sort stays immediate with no transition event, and the route overlay and mark compute to no animation under reduced motion. |
| P2-10 pending versus retry language | Resolved | Pending has no retry action; slow state says the request is still loading and offers `Try loading again`; failed state names the unavailable data, keeps static routes available, and uses the same recovery action. |
| P3-02 shortcut teaching | Resolved | The Ctrl + Alt lockup remains explicitly a visual signature, not a false shortcut. The real Ctrl+K search shortcut is now taught quietly inside the opened Search surface alongside Escape. |
| P2-11 primitive ownership | Resolved | Shared route/state, keyboard, recovery, breakpoint, copy, dense-workbench, and semantic artifact-preview contracts now own the cross-route behaviors identified by the audit. |

Phase 2 also reconciled a live source-trust inconsistency that was not isolated
as its own August 21 finding: Sources, Catalog, and record detail mixed short
aliases with official publication names, treated retrieval dates like completed
checks, hid absent values, and duplicated selected/empty recovery controls.
Those surfaces now share an evidence-backed identity and freshness presentation,
with focused register, record, mobile, and WCAG contracts.

## Executive Assessment

**Verdict: useful and visually distinctive, but not yet flagship-ready.** Control Atlas already succeeds as a credible public research product and is recognizably Orbital. Its entry, home, Start workflow, publication browsing, record detail, focused Atlas experience, source register, and downloaded workbook system show unusually coherent product thinking for a first public release.

It does not yet meet the stated flagship or award-submission bar because the deepest product states are less dependable than the first impression. A large Compare result can destabilize later routes; full comparisons render thousands of links in a document hundreds of thousands of pixels tall; core keyboard contracts fail; one mobile register is clipped; the browser previews for the flagship document feature are materially less usable than the downloaded files; and the generated security-plan “starter” is a 145-page document dominated by machine-scale mapping data.

| Lens | Assessment | Evidence-led judgment |
|---|---:|---|
| Product usefulness | **Strong foundation** | Start, Publications, records, focused Atlas, Resources, Sources, and About answer real research questions with traceable context. |
| Visual design | **Strong** | Distinctive identity, disciplined hierarchy, restrained orange, appropriate teal, coherent typography, and strong editorial surfaces. |
| Information architecture | **Good, uneven at depth** | Primary routes are understandable; Guides, Library Compare, root Atlas, and large relationship states need clearer completion paths. |
| Interaction reliability | **Not ready** | Search activation, route orientation, Library Compare, and post-heavy-Compare state continuity fail in repeatable live states. |
| Responsive behavior | **Mixed** | Most surfaces reflow well, including focused Atlas; Sources and wide preview tables break the mobile contract. |
| Accessibility | **Material gaps** | Good base semantics on sampled pages, but keyboard failures, invisible focus stops, clipped content, and 1.33:1 preview-table text block equal access. |
| Downloaded artifacts | **Mixed** | Workbook system is coherent and professional; the security-plan document and dense cross-reference sheets need stronger editorial bounds. |
| Orbital flagship fidelity | **Visually convincing, operationally incomplete** | Signal and Mission states are strong. Systems-depth states do not yet consistently preserve restraint, orientation, or bounded complexity. |

There are no confirmed P0 findings. The P1 findings below are release blockers for a flagship-quality claim.

## What Is Already Working

Preserve these decisions:

- **Entry and home composition.** The initial desktop dialog is cinematic without becoming a splash screen. The home route becomes calm and operational after entry, with one clear orange primary action.
- **Start workflow.** Goal → context → plan is understandable, the context rail stays visible, and the result is brought into view at the appropriate point.
- **Publication and record trust.** The sampled NIST publication exposes 1,196 controls, clear family filtering, search, pagination state, official-source access, and a well-composed AC-2 record with statement and metadata.
- **Focused Atlas is now a real research surface.** AC-2 shows 143 published connections across seven categories, provides bounded category counts, supports hierarchy/filter actions, and previews requirement, rationale, evidence, and source context. It also reflows cleanly at 375 × 812. This supersedes the previous finding that Atlas stopped at taxonomy and counts.
- **Specific-item Compare.** SP 800-53 AC-2 → DISA CCI presents 47 mappings, clearly states that a mapping is not equivalence, and offers CSV and Excel export.
- **Source transparency.** Resources and Sources expose publisher, version, access, cost, status, last checked, and limitations. About is direct about browser-only document generation and the product not being a decision system.
- **Actual workbook system.** All 11 workbooks use a consistent navy header, pale-blue input treatment, visible data-validation affordances, and file-specific Read Me and Field Guide sheets. The downloaded workbooks are substantially better than their browser previews.
- **System discipline visible in production.** The inspected CSS exposed 376 custom properties. All 57 observed hexadecimal color values were held in token definitions; no direct hexadecimal bypasses were found outside variables.
- **Baseline semantics on the sampled template page.** It had one `main`, one `h1`, no duplicate IDs, no unnamed controls, no missing image alternatives, and no heading-level skips.

## Highest-Priority Findings

### P1-01 — A heavy Compare result can destabilize unrelated routes

**Where:** Full framework Compare → Templates and Tasks  
**Observed:** SP 800-53 → DISA CCI produced 5,344 mappings for 1,164 source records. After navigating from that result, Templates showed headings but no 12 template cards after 6.5 seconds. Tasks showed “Workflow guidance is temporarily unavailable…” and no related resources. Reloading restored both routes.  
**Why it matters:** A user cannot trust that route changes preserve application availability. The defect also makes a flagship demo path fragile.  
**Recommendation:** Isolate route data lifecycles, cancel or dispose heavy Compare work on exit, make cached resources immutable across consumers, and show a recoverable error with retry only when a real request fails. Add an integration test for Compare → Templates → Tasks → reload-equivalent state.

### P1-02 — Full Compare is an unbounded document, not a usable systems workspace

**Where:** Compare, SP 800-53 → DISA CCI  
**Observed:** 5,344 mappings, 1,164 source rows, 1,164 rendered table rows, and 6,508 table links. The desktop document was approximately 436,515 px tall; the previously sampled mobile state was approximately 726,945 px. No virtualized-region or comparable bounded-rendering semantics were observed.  
**Why it matters:** This is the exact Systems-depth state where Orbital must demonstrate precision and restraint. Instead, quantity becomes the interface. It is difficult to scan, expensive to render, and impractical for keyboard and mobile use.  
**Recommendation:** Convert the result into a queryable explorer: summary first, grouped/collapsible results, sticky filters, URL-addressable state, bounded page or window size, and virtualization where appropriate. Preserve exports for exhaustive consumption.

### P1-03 — Core keyboard and focus contracts fail — **RESOLVED**

**Where:** Global search, route navigation, mobile navigation  
**Observed:** In global search, Arrow Down correctly set `aria-activedescendant=”search-suggestion-0”`, but Enter did not open the highlighted AC-2 result and the dialog remained open. Escape closed the dialog but returned focus to `body`, not the Search trigger. Route changes also left focus on `body` instead of the new heading. In the opened mobile menu, repeated Tab remained on “Start here” rather than progressing through items; Escape did close the menu and restore the trigger.  
**Why it matters:** Search and navigation are product-wide controls. These failures block keyboard users and destroy orientation in a hash-routed single-page application.  
**Recommendation:** Implement and test the complete combobox/listbox keyboard contract, restore focus to the invoker on close, move focus to the route heading after push navigation while preserving Back/Forward restoration, and repair the mobile-menu focus loop.  
**Resolution (August 21, 2026):** All four sub-items fixed: (1) Enter activation via explicit `onKeyDown` handler calling `form.requestSubmit()`; (2) search close now restores focus to `.header-search-trigger`; (3) push navigation moves focus to the route heading via `pushNavigationRef` + `requestAnimationFrame`; (4) mobile menu Tab/Shift+Tab focus trap implemented with Escape restoring the toggle button.

### P1-04 — Mobile Sources and hidden controls violate the small-screen contract

**Where:** Sources and sampled mobile routes at 375 × 812  
**Observed:** The Sources document width was 360 px, but publisher filters extended to approximately x=880 and the retained source table was 620 px wide, ending around x=691. Content was clipped rather than becoming a purposeful mobile register. About exposed five zero-size focusable “Jump to…” buttons. Root Atlas exposed zero-size Across/Down controls plus a 1 × 1 Search button.  
**Why it matters:** Orbital explicitly requires visible labels and deliberate deferral of raw detail on small screens. Invisible focus stops and clipped controls make the interface feel unfinished and create accessibility barriers.  
**Recommendation:** Use stacked source rows/cards with visible publisher, version, status, and access metadata; make filter groups horizontally scrollable with an accessible label only if scrolling is intentional; remove hidden controls from the focus order; and add a 375 px keyboard/overflow regression gate.

### P1-05 — The flagship document experience is less polished in-browser than after download

**Where:** All 11 spreadsheet previews and the generated security-plan document  
**Observed:** Every workbook preview reproduces a literal miniature table. The POA&M preview places a 917 px table inside a 228 px scrolling region with no keyboard focus, role, or accessible label. Sampled body cells computed to `rgb(32,36,44)` text on `rgb(45,58,66)` background—approximately **1.33:1** contrast. A 15 px teal subheading measured approximately 4.03:1. The generated DOCX is visually intact but 145 pages long; roughly 50 pages are dense STIG/SRG identifier mappings, and the table of contents has no visible page numbers.  
**Why it matters:** Documents are a principal product promise. The browser preview must help users choose and understand a template, while the starter document must feel curated and editable. Both currently expose system-scale data before human-scale usefulness.  
**Recommendation:** Replace miniature spreadsheet facsimiles with a semantic preview contract—purpose, decisions supported, key sections, required inputs, output example, and a small representative table. Correct contrast and make any scroll region focusable and labeled. Split the security-plan deliverable into a compact editable core plus a clearly labeled mapping appendix or separate machine-readable attachment.

### P1-06 — Library Compare selection reaches a dead end

**Where:** Library search for AC-2, Compare mode  
**Observed:** Two visible AC-2 results could be selected, but no comparison tray, status, next action, or transfer into the global Compare surface appeared. Opening global Compare remained blank.  
**Why it matters:** The interface advertises a research action and accepts selection without completing it. This is a broken product contract, not a polish issue.  
**Recommendation:** Add a persistent comparison tray with count, selected titles, clear/remove, and an explicit Compare action; preserve the selection in the URL or shared state; and cover selection-to-result with keyboard and route-integration tests.

## Product & Information Architecture

### P2-01 — Guides promise procedures but deliver short explainers

The Guides index promises step-by-step guidance. Sampled Guide 01 and Guide 04 provide concise context but not a sequence of actions, inputs, deliverables, decision criteria, worked examples, or meaningful next/previous continuity. Either rename them as explainers or adopt a guide contract: goal, prerequisites, steps, output, validation, and next action.

### P2-02 — Root Atlas over-emphasizes empty topology

The root Atlas reports 30,786 records and 12 areas, yet Knowledge and Operations show “Nothing yet.” The focused-record Atlas is much stronger. Reframe the root as a coverage map with an explicit “not yet modeled” disclosure, or prioritize populated areas and move empty areas behind a coverage-details control.

### P2-03 — Relationship-heavy record pages still become long mobile documents

The sampled AC-2 record exposes many relationships directly. Focused Atlas now provides the stronger relationship interaction; record detail should summarize by publication and relationship type, show representative examples, and link to Atlas for complete exploration.

### P2-04 — Resource detail repeats editorial copy

“FedRAMP package access and reuse” repeats the same summary in the hero and twice in “What it is.” Keep one orientation sentence, then use the available space for access steps, limitations, expected artifacts, or reuse decisions.

## Orbital Flagship Fidelity

Orbital’s strongest production proof is its range:

| Complexity level | Strong live examples | Gap exposed by the product |
|---|---|---|
| Signal | Entry, home, section titles, one orange action | Preserve; do not add more ceremony. |
| Mission | Start workflow, publications, Resources, document Read Me sheets | Guides and browser previews need stronger task contracts. |
| Systems | Focused Atlas, specific-item Compare, Sources | Full Compare, root Atlas, and dense mapping artifacts do not yet bound complexity. |

The visual language is already recognizable. The flagship gap is behavioral: “calm in operation” must remain true when the dataset is largest, the viewport is smallest, or the input method is keyboard-only.

### P2-05 — The design system lacks a governed dense-data composition contract

Compare, Sources, record relationships, workbook previews, and mapping appendices each solve density differently. Orbital should govern summary-before-detail, disclosure thresholds, group limits, sticky controls, pagination/windowing, mobile transformation, export handoff, and the point at which a table becomes a query surface.

### P2-06 — Route orientation is not yet an Orbital system primitive

The current shell has strong visual continuity but inconsistent operational continuity. Scroll restoration, title change, heading focus, back-navigation restoration, and invoker focus should be one reusable route-transition contract.

## Visual Design & Art Direction

The art direction is a strength. Navy fields, quiet lines, restrained gradients, precise type hierarchy, teal informational actions, and limited orange produce a coherent and memorable atmosphere. The product generally avoids decorative glass, unnecessary cards, and generic dashboard aesthetics.

### P2-07 — Template cards do not expose the distinctions users scan for

Cards prioritize names and descriptions but make format, source/basis, scope, expected completion effort, and output structure harder to compare. These should be compact card metadata, not buried after selection.

### P2-08 — Single-card categories read as incomplete grids

Categories containing one item leave large empty row space. Use a full-width editorial/list variant for a single template or combine related low-volume categories under a meaningful grouping.

### P3-01 — Mobile home search composition is functional but visually unresolved

The mobile search/action cluster feels like a compressed desktop composition. Give the primary search action a clean full-width small-screen treatment and preserve orange for the single next action.

## Interaction Design & Delight

The product’s best delight comes from clarity: the entry sequence, Start’s progressive disclosure, and focused Atlas previews. These feel intentional without slowing the user.

### P2-09 — Utility interactions should not borrow cinematic transition weight

Reserve full-screen transition treatment for meaningful context changes. Menu opening, filtering, and in-place state changes should remain immediate. Orbital will feel more premium when motion communicates spatial change instead of being applied uniformly.

### P2-10 — Loading and retry language should represent actual state

Do not surface retry-oriented language while work is merely pending. Govern distinct pending, slow, failed, recovered, and empty states with stable layouts and honest actions.

### P3-02 — The Ctrl + Alt brand interaction needs one moment of teaching

It is memorable but not fully discoverable. Reveal the shortcut once after a successful related action or through a conventional help/shortcut surface, then stay quiet.

## Design Tokens & Systemization

### Observed production evidence

- 376 CSS custom properties were exposed in the inspected production styles.
- 57 hexadecimal values were found in token definitions and none as direct hexadecimal values outside variables.
- Color roles were generally coherent: orange for the primary/editorial signal; teal for active, focus, link, and informational states.
- The workbook family extends the product visually with consistent headers, inputs, and guidance sheets.

This is credible evidence that Orbital is more than a skin. The remaining work is to govern behavior at scale as rigorously as color and typography.

### P2-11 — Dense-data, route-state, and artifact-preview primitives need explicit ownership

Add reusable system contracts for bounded result groups, mobile register transformation, keyboard-operable horizontal regions, route focus/scroll, semantic document previews, printable appendix separation, and error/recovery states. Product-specific content should configure these primitives rather than re-invent them route by route.

## Components & States

| Component / state | Live result | Priority |
|---|---|---:|
| Entry dialog and primary CTA | Clear hierarchy and purposeful single action | Preserve |
| Publication filter/search/pagination | Understandable and explicit | Preserve |
| Focused Atlas category/preview state | Bounded, informative, mobile-safe | Preserve |
| Global search keyboard activation | Highlight state exists; Enter fails | P1 |
| Library Compare selection | Selection accepted; completion path absent | P1 |
| Mobile navigation | Escape/restoration works; Tab progression fails | P1 |
| Wide preview table | Low contrast and inaccessible scroll region | P1 |
| Route transition | Scroll and focus orientation unreliable | P1 |
| Closed overflow/menu trigger | Sampled trigger referenced absent `aria-controls="overflow-nav-menu"` node | P2 |
| Empty Atlas areas | Accurate but over-prominent | P2 |
| Loading/retry state | State meanings are insufficiently separated | P2 |

## Responsive / Mobile

**Confirmed strengths:** Focused Atlas, home, Start, Library results, and most editorial pages reflow without page-level horizontal overflow. Primary controls generally meet the intended approximate 44–46 px target scale.

**Confirmed defects:**

- Sources retains a desktop-width filter/table composition and clips content.
- Workbook previews reduce literal wide tables into narrow horizontal windows without making the region a named keyboard destination.
- POA&M selection auto-scrolled to approximately y=8,215, making the change feel like a jump into a long document rather than a controlled preview.
- Zero-size focusable controls exist on About and root Atlas.
- Record relationship depth is technically responsive but too long to remain usable.

The correct mobile pattern is not universal cardification. Preserve real tables where row/column comparison is essential, but provide a named scroll region, sticky identifiers, visible affordance, and bounded rows. Transform source registers and summary lists where sequential reading is the actual task.

## Accessibility

**Scope:** Keyboard, focus, target visibility, semantic names, heading structure, DOM relationships, contrast, and small-screen overflow were inspected. Screen-reader speech was excluded by request.

### Confirmed strengths

- Sampled template page: one `main`, one `h1`, no duplicate IDs, no unnamed controls, no missing image alternatives, and no heading-level skips.
- Global search exposes an active-descendant model rather than relying only on visual highlight.
- Mobile-menu Escape closes the surface and restores the trigger.
- Focused Atlas keeps its controls visible and reflows without zero-size interactive elements in the sampled state.

### Confirmed defects

- Enter does not activate the active global-search suggestion.
- Search close and route changes do not consistently put focus on a meaningful destination.
- Mobile-menu Tab progression does not advance from the first item.
- Hidden zero-size controls remain keyboard focusable on sampled routes.
- Sources content is clipped on mobile.
- POA&M preview body text measures approximately 1.33:1; the sampled teal 15 px subheading is approximately 4.03:1.
- The closed overflow trigger references an absent controlled node in the sampled DOM.

### Not fully verifiable

Screen-reader announcements/speech, forced-colors behavior, OS high-contrast behavior, 200% browser-zoom reflow, reduced-motion emulation, and complete Firefox/Safari parity were not verified in the available live environment.

## Downloaded Artifact Audit

All 12 live artifacts downloaded successfully through the user’s Chrome session. Every DOCX page and every workbook sheet was rendered and visually inspected. The table below distinguishes file quality from the weaker browser preview.

| Artifact | Actual structure inspected | Assessment |
|---|---|---|
| Security Plan Starter — FedRAMP Rev. 5 / Moderate / Hybrid (DOCX, 98,788 bytes) | 145 letter pages; control baseline, operating detail, roughly 50 pages of dense STIG/SRG IDs, revision/context pages | **Needs redesign.** Visually consistent and unclipped, but far too long for a starter; weak TOC navigation, `Page1` footer spacing, abrupt section transitions, and mapping data dominates the editable plan. |
| Hardware Inventory (XLSX, 8,815 bytes) | Read Me; 23-column register with 20 prepared blank rows; 24-row Field Guide | **Good.** Wide but coherent; use grouping/freeze guidance for real use. |
| Software Inventory (XLSX, 9,059 bytes) | Read Me; 25-column register with 20 prepared blank rows; 26-row Field Guide | **Good.** Consistent operational starter; very wide. |
| Ports, Protocols, and Services (XLSX, 8,819 bytes) | Read Me; 22-column register with 20 prepared blank rows; 23-row Field Guide | **Good.** Clear file-specific guidance and input treatment. |
| Control Implementation Matrix (XLSX, 25,746 bytes) | Read Me; 301 × 14 implementation sheet; 15-row Field Guide | **Good, dense.** Prefilled control context is useful; progressive filtering/freeze instructions matter. |
| Control Inheritance Matrix (XLSX, 26,591 bytes) | Read Me; 301 × 15 inheritance sheet; 16-row Field Guide | **Good, dense.** Strong handoff structure. |
| Reciprocity Checklist (XLSX, 7,759 bytes) | Read Me; 13 × 12 checklist; 13-row Field Guide | **Good.** Appropriately bounded and easy to understand. |
| Evidence Matrix (XLSX, 92,656 bytes) | Read Me; 288 × 12 expectations; 288 × 4 cross-reference; 17-row Field Guide | **Mixed.** Core matrix is strong; cross-reference cells contain extremely dense CCI/STIG text and need a bounded lookup or separate machine-scale appendix. |
| STIG/SRG Tracking (XLSX, 8,959 bytes) | Read Me; import and notes sheets are header-only; Field Guide | **Needs starter-state consistency.** The guidance is good, but core operational sheets do not include prepared blank rows like comparable registers. |
| Assessment Findings (XLSX, 26,332 bytes) | Read Me; 288 × 15 findings sheet; 16-row Field Guide | **Good, dense.** Clear structure and visual hierarchy. |
| POA&M (XLSX, 9,785 bytes) | Read Me; 27-column header-only POA&M; 28-row Field Guide | **Needs refinement.** Add a few prepared rows and column grouping/freeze guidance; the width is substantial even before data. |
| Continuous Monitoring Calendar (XLSX, 8,139 bytes) | Read Me; 10 prefilled activities across 14 columns; 15-row Field Guide | **Good.** Useful starting content and a clear operational frame. |

No workbook formula cells were present in the inspected used ranges. This is not inherently a defect—these are controlled input artifacts—but the product should state where calculations are intentionally absent and which fields users or downstream systems must maintain. Native Excel print fidelity and downstream FedRAMP/eMASS import behavior were not verified.

## Performance & Perceived Performance

### Directly observed

- The full Compare DOM is intrinsically unbounded: 1,164 rows and 6,508 table links in the sampled state.
- Across the full traversal, the browser observed 239 loaded assets: 47 scripts, 6 stylesheets, 184 data/other assets, and 2 images, plus 12 inline SVGs. This is a traversal inventory, not a cold-load transfer total.
- `atlas-network.json.gz` reported a 2,747,467-byte content length. `library-search.json.gz` was 6,450 bytes. The sampled GitHub Pages HTML, JS, CSS, and data responses used a ten-minute `max-age=600` cache policy.
- Heavy Compare produced a later-route reliability failure, which is more important than an isolated lab score.

### Required next proof

Run a real cold-load performance trace on representative home, Publications, focused Atlas, and full Compare states. Record FCP, LCP, CLS, TBT/INP proxy, Speed Index, transferred bytes, long tasks, and accessibility results against an explicit budget. The Chrome DevTools trace service required by the performance-audit workflow was unavailable in this environment, so no Lighthouse/Core Web Vitals values are claimed here.

## Modern Web Opportunities

These are opportunities after correctness, not substitutes for it:

1. **Virtualized or windowed systems results.** Use a maintained table/windowing solution or bounded pagination for full Compare after establishing URL and accessibility contracts.
2. **`content-visibility: auto` for bounded offscreen groups.** Apply only after results are grouped and test find-in-page, focus, printing, and intrinsic-size behavior.
3. **Native Popover for lightweight non-modal utility surfaces.** A good fit for small overflow/filter panels if focus and fallback behavior are proven; not for the global search dialog.
4. **Same-document View Transitions as progressive enhancement.** Add only after route scroll/focus correctness, and respect reduced motion. The inspected in-app browser did not expose support, so this cannot be a dependency.
5. **URL-addressable view state.** Filters, selected comparison items, open categories, and result pages should survive reload/share/back navigation.

## Orbital System Gaps Revealed by Control Atlas

The reusable system—not only this product—needs:

- a **route-orientation contract** covering scroll, heading focus, title, Back/Forward, and invoker restoration;
- a **dense-data ladder** defining when to summarize, group, paginate, window, transform, or export;
- a **mobile register primitive** distinct from both a desktop table and a generic card grid;
- an **accessible horizontal-region primitive** with visible affordance, focusability, label, and sticky identity;
- a **semantic artifact-preview primitive** that previews decisions and structure rather than shrinking the file;
- a **long-document contract** separating editable core content from reference appendices and machine-scale mappings;
- a **loading/error/recovery state model** that prevents pending, empty, failed, and unavailable states from becoming visually interchangeable;
- a **comparison-selection primitive** with persistent tray, count, clear/remove, and explicit execution;
- responsive and contrast acceptance tests for every new system component.

## Implementation Backlog

| Priority | Affected area | Recommended change | Expected benefit |
|---:|---|---|---|
| P1 | Shared data lifecycle | Isolate and dispose heavy Compare work; add Compare → Templates → Tasks integration coverage | Prevents route-wide state loss |
| P1 | Full Compare | Group and bound results; paginate/window rows; keep summary, filters, and exports | Makes systems-depth research usable and performant |
| P1 | Global shell/search | Repair Enter activation, route heading focus, scroll restoration, close restoration, and mobile-menu Tab flow | Restores product-wide keyboard orientation |
| P1 | Mobile Sources | Replace clipped table/filter row with a responsive source-register pattern | Preserves trust metadata on small screens |
| P1 | Template preview | Replace miniature tables with semantic previews; fix contrast and scroll-region accessibility | Makes the document product understandable before download |
| P1 | Security-plan artifact | Split the 145-page output into a compact editable plan and explicit mapping appendix/attachment | Produces a credible starter document |
| P1 | Library Compare | Add persistent selected-item tray, URL/shared state, and explicit Compare action | Completes the advertised workflow |
| P2 | Guides | Adopt goal/prerequisite/steps/output/validation/next contract | Turns explainers into usable procedures |
| P2 | Root Atlas | Prioritize populated areas; disclose modeling gaps separately | Makes the landscape actionable |
| P2 | Record detail | Summarize large relationship sets and hand complete exploration to focused Atlas | Reduces mobile length without hiding rigor |
| P2 | Resource detail | Remove repeated summary and add operational access/reuse detail | Improves editorial precision |
| P2 | Workbook family | Add consistent starter rows and grouping/freeze guidance to STIG and POA&M | Improves immediate usability |
| P2 | Evidence workbook | Replace dense cross-reference cells with lookup/filter or a separate appendix | Keeps the workbook human-operable |
| P2 | Orbital system | Govern dense data, route orientation, preview, and state-recovery primitives | Prevents route-specific rework |
| P2 | Loading states | Separate pending, slow, failed, empty, and recovered presentations | Makes system status honest |
| P3 | Motion | Reserve cinematic transitions for meaningful context changes | Improves perceived speed and restraint |
| P3 | Mobile home | Give search one clean full-width mobile composition | Improves first-task polish |
| P3 | Shortcut discovery | Teach the Ctrl + Alt action once in context | Adds delight without onboarding noise |
| P3 | Modern enhancement | Add feature-detected view transitions/popovers after core fixes | Adds polish without weakening resilience |

## Flagship Bar

**What would prevent Control Atlas from making an award shortlist:** not its visual identity, but the gap between the polished first impression and the unreliable or unbounded states encountered during serious work—especially full Compare, keyboard navigation, small-screen data, document previews, and the 145-page starter artifact.

The largest jump to a genuinely flagship-quality release comes from these changes, in order:

1. Make full Compare a bounded explorer and prove that leaving it cannot destabilize another route.
2. Repair the global route/search/mobile-navigation keyboard and orientation contract.
3. Replace all miniature workbook previews with accessible, semantic previews that explain the artifact before download.
4. Redesign the 145-page security-plan starter as a compact editable core plus explicit mapping appendix.
5. Recompose Sources as a true mobile register and eliminate every invisible focus stop.
6. Complete Library Compare with a persistent, shareable selection-to-result path.
7. Turn Guides into actual procedures with inputs, steps, outputs, validation, and continuity.
8. Add Orbital system primitives for dense data, long documents, route orientation, and honest recovery states.
9. Run and publish a representative cold-load/accessibility performance budget after the structural fixes.

Until the first six are complete, **Control Atlas should not be submitted or described as the finished flagship implementation.** The visual identity is already strong enough; the next quality jump comes from dependable behavior, bounded complexity, inclusive interaction, and artifact editorial discipline.

## Verification Boundary

Verified from the deployed product:

- all major public route families and the principal Start, Library, Compare, Atlas, search, publication, record, resource, source, guide, task, and document flows;
- desktop and 375 × 812 mobile rendered behavior on representative states;
- keyboard behavior for search and mobile navigation;
- sampled DOM semantics, focusability, target geometry, computed colors, and overflow;
- all 12 live downloads through Chrome;
- all 145 DOCX pages and all sheets in all 11 XLSX files through rendered visual inspection;
- production-observable CSS token usage and resource/DOM scale.

Not verified:

- screen-reader speech/announcement quality, by explicit scope choice;
- forced-colors, OS high contrast, reduced-motion emulation, 200% browser zoom, or exhaustive Safari/Firefox parity;
- native Excel print areas/page breaks, formula recalculation behavior, or downstream FedRAMP/eMASS import acceptance;
- cold-load Lighthouse/Core Web Vitals, because the required Chrome DevTools tracing service was unavailable;
- repository implementation details, build configuration, component source ownership, or test coverage, because source inspection was explicitly out of scope.
