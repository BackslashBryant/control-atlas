# Full Control Atlas surface, copy, and target-UX audit

Date: 2026-07-28  
Audit lead: Muse  
Mode: live-first, audit-only  
Live product: `https://backslashbryant.github.io/control-atlas/`  
Repository baseline: `6e9952161337b93271352c259abf5f473160adfe`  
Branch: `agent/muse/control-atlas-full-surface-audit`

## Executive verdict

**NO-GO for calling the current product coherent, source-safe, or complete. Correction is required.**

Control Atlas contains a genuinely valuable corpus and several strong building blocks: universal retrieval can return honest zero results; the focused relationship List is accessible and complete; Resources contains 96 useful external items; Sources exposes 46 provenance records; records can show official text, ancestry, mappings, and raw source detail; and the existing MiniSearch and React Flow/ELK stack is sufficient for the target product.

The deployed experience does not yet match the doctrine. The problem is not a missing coat of polish. It is a combination of source identity conflation, false or unfinished affordances, competing destination identities, a default RMF worldview, buried defining capabilities, non-shareable state, repetitive product voice, and layouts that spend too much space before delivering an answer.

Three issues are Critical:

1. **Official CSF text is misattributed to SP 800-53 Rev. 5.** `DE.AE-08` visibly says `Source excerpt from SP 800-53 Rev. 5` while its structural identity is CSF 2.0. The data/build path uses one `nist-oscal` ingestion entry whose display name is SP 800-53 for several different publications.
2. **Build silently defaults an unselected baseline to Moderate and can put it into generated material.** That crosses the explicit no-applicability-determination boundary.
3. **Preview failure and Download readiness are not one state.** Code allows Download to remain available when a preview is unavailable, creating a false and potentially unsafe output affordance.

The seven most important High failures are:

- Search has three identities: Search URL/title, Explore eyebrow, Catalog selected state.
- Start Here asks three questions but returns the same seven sources for every complete answer combination.
- Compare accepts a mode and updates the URL but does not open a workbench or next step.
- Explore has no atlas-level overview; Path is a relationship-stage wizard and Map is available only after selecting a record.
- Catalog is a long publisher wall, truncates detail results at 100, and does not preserve local filter state.
- Learn is a globally exposed empty product with patronizing `Recommended for new users` copy.
- Build and Home bury Resources and universal Search beneath large card funnels.

The owner’s seeded concerns were all reproduced. RMF is over-prominent. Paths stop without outcomes. The Map is buried and is not an atlas overview. Catalog is not shallow-to-deep. Resources is valuable and buried. Record pages can present an identifier without a useful title or correct source identity. The UI contains repeated `choose`, `start`, `understand`, `practical starting point`, `new here`, `new users`, slogans, metaphors, generic marketing, and disclaimer wallpaper. Mobile generally avoids document-level horizontal scroll but compensates with 2,000–5,600px vertical stacks; tablet Explore clips controls.

## Deliverables

- [Surface matrix](../../artifacts/audits/control-atlas-2026-07-28/surface-matrix.csv)
- [Copy register](../../artifacts/audits/control-atlas-2026-07-28/copy-register.csv)
- [Open-source evaluation](../../artifacts/audits/control-atlas-2026-07-28/oss-evaluation.md)
- [Target experience](../design/control-atlas-target-experience-2026-07-28.md)
- [Correction backlog](../planning/control-atlas-ux-correction-backlog-2026-07-28.md)
- [Desktop wireframes](../../artifacts/audits/control-atlas-2026-07-28/wireframes/target-wireframes-desktop.svg)
- [Mobile wireframes](../../artifacts/audits/control-atlas-2026-07-28/wireframes/target-wireframes-mobile.svg)
- [Live baseline](../../artifacts/audits/control-atlas-2026-07-28/evidence/live-baseline.md)
- [Workflow evidence](../../artifacts/audits/control-atlas-2026-07-28/evidence/workflow-evidence.md)
- [Responsive/layout evidence](../../artifacts/audits/control-atlas-2026-07-28/evidence/responsive-layout-evidence.md)
- [Verification results](../../artifacts/audits/control-atlas-2026-07-28/evidence/verification-results.md)

## Evidence and limits

### Live

The deployed GitHub Pages product was the primary source. The audit covered 1440px, 768px, and 375px widths, exact/ambiguous/zero Search, Start Here, Explore Path/Map/List, Catalog and catalog detail, two records, Compare, Learn, Build, Resources, Sources, About, retired recovery, invalid route recovery, history/state behavior, and representative keyboard order.

Deployment markers:

- JavaScript: `assets/index-ZAueaq6E.js`
- CSS: `assets/index-Cm75bU8e.css`
- Title: `Control Atlas — Public reference for federal cyber requirements`
- Application name: `Control Atlas | Ctrl+Alt+Comply`

### Code-derived

The matching repository was inspected only to:

- identify the exact source-misattribution cause;
- prove Start Here’s result is invariant;
- prove ignored/local URL state;
- inspect unsafe starter-document defaults/readiness;
- inventory copy outside visible happy paths;
- map duplicate search/index ownership;
- determine whether public empty/dead surfaces were real features or transient load states;
- inspect regression-route drift.

### Automated

Relevant project checks are recorded in the evidence folder after audit-artifact validation. A passing existing test is not treated as product proof where its route inventory points at retired surfaces.

### Not performed

- Human NVDA, VoiceOver, or TalkBack testing.
- Physical phone/tablet testing.
- Reliable actual 200% browser zoom. Effective-width proxies were used and found a real 768px Explore overflow.
- Production writes, deploys, or route/copy/style changes.

## Principle scorecard

Score: 0 absent/contradicted, 1 material failures, 2 partial, 3 conforms.

| Principle | Score | Evidence |
|---|---:|---|
| Canonical identity per destination | 0 | Search/Explore/Catalog identity collision; Start/Start here drift; Resources has no direct global identity |
| Navigation follows practitioner intent | 1 | Useful top-level nouns exist, but RMF, publisher walls, task cards, and empty Learn dominate intent |
| State is shareable/recoverable | 1 | Explore and configured Compare serialize some state; Catalog, Sources, Build, and Resources retain local/ignored state |
| No parallel/liminal surfaces | 1 | Retired recovery exists, but stale menu/library/playbook/template concepts remain in tests and loading copy |
| Explore/Search/Catalog/Compare/Learn/Build/Sources remain distinct | 1 | Destination names exist; behavior and copy still overlap or contradict them |
| Resources belongs under Build and is findable | 1 | Canonical location is correct; defining 96-item directory is buried |
| Progressive disclosure | 1 | Advanced details/accordions exist, but first screens are card walls and repeated scaffolds |
| Home has one primary action and immediate Search | 0 | Three equal cards and RMF precede Search; mobile Search is below the first viewport |
| Structural truth: trees versus graphs | 1 | Source ancestry rail improved, but Explore Path mixes relationship purposes and the product metaphor still makes RMF the trunk |
| Applicability is not parentage | 2 | Live record rail separates some states; Home/About and relationship-stage UI still make RMF/applicability structurally central |
| One data model, multiple lenses | 1 | Canonical graph exists, but separate search indexes and page taxonomies diverge |
| Catalog exhaustive; Explore guided | 1 | Catalog corpus is broad, but landing is a publisher wall and detail truncates; Explore requires a selected record |
| Search eligibility before ranking | 2 | Universal zero results are honest; overlay/Resources/Catalog use separate contracts |
| Exact ID/ambiguous/invalid behavior | 2 | Search exact IDs work as results and invalid routes recover; direct exact transition and parameter explanations are inconsistent |
| Responsive meaning and parity | 1 | Main content persists; tablet filters clip and mobile outcomes are buried in very long stacks |
| Plain operational language first | 1 | Many labels are clear; major surfaces still use slogans, metaphors, abstract openings, jargon, and repeated scaffolds |
| What/why/do on every surface | 1 | Records and Resources sometimes succeed; Compare, empty Learn, Start Here, and Catalog fail the action/outcome test |
| Source truth separate from product interpretation | 0 | CSF text is misattributed; `When to use it` is unlabelled product guidance |
| Relationship authority is explicit | 2 | Published/navigation/no-rationale concepts exist; they are repetitive, generic, and can overstate confidence |
| No manufactured summaries/rationales/recommendations | 1 | Source-first record text exists; Start Here and resource/recommendation language still overclaim |
| Resolve slugs/enums to human labels | 1 | Many are resolved; overlay and context surfaces can leak raw states |
| Concrete verbs and next steps | 1 | Search/Open/Compare actions exist; repeated Choose/Start/Understand and dead Compare mode remain |
| No compliance or authorization determination | 1 | Boundaries are stated; Ctrl+Alt+Comply, default Moderate, authorization-research guidance, and recommendation language undermine them |
| Recommendation/mapping disclosure | 1 | Provenance/confidence fields exist; rationale/method/limitations are often generic or duplicated |
| Text accompanies color/icons/badges | 2 | Most statuses are textual; long badge prose harms comprehension |
| Constrained-team clarity without condescension | 0 | `Recommended for new users`, `New here?`, and “you do not need to know the document name” are patronizing |
| Buttons/fields/feedback are perceivable | 1 | Search feedback is sound; Compare selection and Build readiness create false affordances |

Overall: **26/81 (32%)**. This is a conformance score for the current target doctrine, not a measure of dataset value or engineering effort.

## Route coverage and disposition

The detailed matrix contains 56 rows. Every row is Pass, Fail, Blocked, or Skipped with reason; none remains Not tested.

| Destination | Status | Severity | Disposition |
|---|---|---|---|
| Home | Fail | High | Replace first-screen hierarchy |
| Start Here | Fail | High | Replace with source navigator or delete |
| Search | Fail | High | Keep engine; consolidate identity and result contract |
| Global Search overlay | Fail | High | Consolidate into canonical Search |
| Explore landing | Fail | High | Replace |
| Explore Path | Fail | High | Replace with publisher-declared hierarchy |
| Explore Map | Fail | High | Finish as bounded overview plus neighborhood |
| Explore List | Pass with density defects | Medium | Keep and compact |
| Catalog | Fail | High | Replace landing architecture |
| Catalog detail | Fail | High | Finish exhaustive/shareable behavior |
| Record AC-2 | Pass with density/copy defects | Medium | Keep and reorder |
| Record DE.AE-08 | Fail | Critical | Replace source identity; finish title handling |
| Compare | Fail | High | Finish |
| Learn | Fail | High | Populate minimum content or remove from nav |
| Build tasks | Fail | High | Consolidate into one of three lanes |
| Starter documents | Fail | Critical | Fail closed and unify readiness |
| Resources | Pass with discoverability/state defects | High | Keep and promote |
| Sources | Fail | Medium | Consolidate into trust register |
| About | Fail | High | Replace metaphor/claims |
| Retired route recovery | Pass with explanation defect | Medium | Consolidate |
| Unknown route | Pass | None | Keep |
| Footer | Fail | Medium | Compact |
| Mobile shell | Pass with long-stack defects | High | Finish |
| Tablet Explore | Fail | High | Finish |

## Findings by severity

### Critical

#### CA-SRC-001 — CSF official text is attributed to SP 800-53

Evidence and cause are documented in [workflow evidence](../../artifacts/audits/control-atlas-2026-07-28/evidence/workflow-evidence.md). This is not a cosmetic label bug. It breaks citation, source trust, and every claim that Control Atlas keeps source truth visible.

Required correction: publication identity per catalog; ingestion provenance separate; fail closed.

#### CA-BLD-002 — Moderate is selected without the user

An absent baseline becomes Moderate in Build’s generation path. A starter document may therefore contain a substantive value the user did not select.

Required correction: explicit not-selected state; required input blocks generation; optional input is omitted.

#### CA-BLD-003 — Download can outlive preview validity

Preview and Download do not share one validated readiness state.

Required correction: one input snapshot and validity state controls preview, status, and download.

### High

#### CA-IA-004 — Search has conflicting destination identities

`/search` renders an Explore eyebrow while navigation code can select Catalog. Search is not a stable product destination.

#### CA-IA-005 — Home has no Signal-layer action

Three equal cards, including RMF and a non-functional situation questionnaire, appear before Search.

#### CA-IA-006 — Resources is canonically correct but practically hidden

Build → Resources is structurally correct. Discoverability is not. Ten Build tasks and Home’s framework/RMF/questionnaire cards bury the strongest unique ecosystem feature.

#### CA-START-007 — Start Here is a questionnaire-shaped false affordance

The answers serialize, but every complete answer set returns the same seven sources. `Based on` is untrue.

#### CA-EXP-008 — Explore is a focused record navigator, not an Atlas

Path/Map/List do not appear until record selection. Path represents relationship purposes rather than source hierarchy. Map is useful but neighborhood-only.

#### CA-CAT-009 — Catalog is not shallow-to-deep

The landing is a publisher wall. The detail surface truncates at 100, and query/family/browse state is local.

#### CA-CMP-010 — Compare mode selection does not progress

The URL changes, but the chooser remains and no input, result, error, or recovery appears.

#### CA-LRN-011 — Learn is an exposed empty product

Zero content, zero categories, patronizing recommendation heading, and a large mobile page.

#### CA-CPY-012 — Product voice is repetitive, patronizing, and over-produced

The exact register documents 84 entries/rules. Major patterns:

- rotating Ctrl+Alt slogans;
- `Choose the work`, `Start with a task`, `Choose a starting point`;
- `practical starting point`;
- `New here?` and `Recommended for new users`;
- `plain English`;
- `RMF is the trunk` and eight-part tree metaphor;
- `Official-Plus-Practical Pairing`;
- generic `Why it is useful`;
- repeated disclaimers and provenance/confidence paragraphs.

#### CA-STA-013 — Meaningful state is local or ignored

Catalog, Sources, Build, and Resources lose or ignore meaningful filters/selections. Refresh, history, and copied links are not a dependable workbench contract.

#### CA-RWD-014 — Responsive layout preserves content but not usable sequence

Mobile pages range roughly from 1,255 to 5,654px; record actions displace source truth; a cold record inserts content above the footer; tablet Explore clips controls.

#### CA-TST-015 — Green tests can exercise retired routes

Visual/responsive/accessibility suites retain `/menu`, `/library`, `/playbooks`, and `/templates`. A recovery page can satisfy generic page assertions without testing the named product.

#### CA-COPY-016 — Current copy extraction is not comprehensive

The extractor covers TSX literals, not the complete MJS/JSON/generated/dynamic/accessibility surface. Passing Vale is not evidence that all product copy is acceptable.

#### CA-SRCH-017 — Search ownership is duplicated

MiniSearch record search, Resources scoring, universal resource search, overlay indexing, glossary search, Catalog filtering, and benchmark code do not share eligibility or identity.

#### CA-LYT-018 — Surface CSS and page framing encode wasted space

Large surface CSS files, parallel style layers, hard-coded mobile minimum height, repeated panels, and oversized footer/headers make dead space recur.

## Copy audit

The [copy register](../../artifacts/audits/control-atlas-2026-07-28/copy-register.csv) includes:

- exact observed or code-derived product text;
- route/surface/state;
- speaker and authority class;
- anti-pattern;
- severity and disposition;
- exact replacement where correction is warranted;
- acceptance test;
- evidence status;
- explicit exemptions for official source text, external attributed text, identifiers/formal terms, dynamic count templates, accessible names, and system feedback.

### Coverage contract

Official corpora are not duplicated row-by-row because they are exempt from Control Atlas voice scoring. They remain subject to title, publisher, publication, citation, source-link, truncation, and source/product-separation tests.

Dynamic numeric instances are represented as grammar/state templates. Global canonical labels are represented once and must be generated from the destination registry. Everything else—TS/TSX/MJS literals, JSON-authored product notes, loading/error/empty strings, toasts, tooltips, accessible names, generated document copy, and fallback interpolation—must enter a speaker-aware manifest.

### Representative before and after

| Current | Problem | Target |
|---|---|---|
| Choose the work / Start with a task | Repetitive platitude | Build |
| Pick the outcome… you do not need to know the document name | Patronizing and presumptive | Open a task, configure a starter document, or find an external resource. |
| Start with my situation | False personalization | Browse source starting points |
| Based on [three answers] | Answers do not affect result | Source starting points |
| Follow the RMF process | Default worldview | Browse by RMF step, inside optional Explore lens |
| Recommended for new users | Patronizing and empty | Remove; publish real explanation topics |
| New here? Start with baselines… authorization research | Expertise label and substantive steering | Filter the published connections by relationship type or source. |
| When to use it | Unlabelled product applicability guidance | Control Atlas navigation note |
| Source excerpt from SP 800-53 Rev. 5, on a CSF record | Critical misattribution | Exact CSF 2.0 identity; fail closed if unresolved |
| Why it is useful | Generic promotional heading | Why it is included |
| Official-Plus-Practical Pairing | Canned branded phrase | Official source with implementation resources |
| RMF is the trunk | False structural metaphor | RMF is an optional lifecycle lens over the same records. |
| Ctrl+Alt+Comply | Compliance theater | Control Atlas |

## Layout and wasted real estate

This audit treats wasted space as lost practitioner time, not merely aesthetic preference.

### Home

Three large equal cards and rotating copy consume the Signal layer. The target fits Search and three compact secondary entrances in the first desktop and mobile viewport.

### Catalog

Publisher grouping produces a 2,545px desktop wall and roughly 5,654px mobile page. The target starts with search/facets and groups by useful record/catalog type; publisher remains a filter or alternate view.

### Record

The current mobile record can spend nearly a screen on identifier/actions before official text. The target places exact publisher/publication and official text before back-workflow actions, relationship prose, contextual Resources, or raw metadata.

### Compare

Five large mode cards take space without moving the workflow. The target uses compact modes and reveals required inputs immediately.

### Build/Resources

Ten task cards are not a useful universal Build front door. The target gives Tasks, Starter documents, and Resources equal lanes, then renders a dense searchable Resources directory.

### Sources

Promotional explanation and accordions precede compact trust scanning. The target leads with search, 46-source count, publisher/publication, coverage, dates, and status.

### Orbital Archive

Keep the architectural line work, restrained palette, and depth cues. Remove rotating slogans, decorative geometry in reading corridors, repeated framed panels, all-caps microcopy density, and fixed-height patches. Identity should come from structure and rhythm, not decoration.

## Target architecture and wireframes

The [target experience](../design/control-atlas-target-experience-2026-07-28.md) is the normative recommendation. The two wireframe boards show all nine requested surfaces at desktop and mobile:

1. Home.
2. Search.
3. Explore.
4. Catalog.
5. Record.
6. Compare.
7. Build/Resources.
8. Learn.
9. Sources.

The architecture is decisive:

- Home: Search first.
- Search: typed universal retrieval.
- Explore: Path/Map/List over shared scope; RMF optional.
- Catalog: exhaustive searchable inventory.
- Record: official identity/text first.
- Compare: workbench, not mode gallery.
- Build: three equal lanes.
- Resources: prominent under Build and from Home.
- Learn: real explanations or no public destination.
- Sources: compact trust register.

## Open-source decision

The [open-source evaluation](../../artifacts/audits/control-atlas-2026-07-28/oss-evaluation.md) recommends:

- **Keep MiniSearch.** Consolidate five competing search/index paths; eliminate or generated-hash-check the byte-identical vendored copy.
- **Keep React Flow plus ELK.** Finish bounded framework/topic overview and record-neighborhood workloads with Path/List parity.
- **Do not adopt Orama, Pagefind, Cytoscape, Sigma/Graphology, D3 hierarchy, or Gramps Web code now.** None solves the current doctrine/IA failures better than configuring existing dependencies.
- **Adapt patterns from MDN, Diátaxis, ATT&CK Navigator, USWDS, GOV.UK, Docusaurus, and genealogy tools.** Do not imitate their visual brand or migrate application frameworks.

No dependency recommendation is based on popularity. Each future adoption needs a measured workload, benchmark, accessibility/static-host budget, migration owner, superseded-code removal, and rollback.

## Correction program

The [correction backlog](../planning/control-atlas-ux-correction-backlog-2026-07-28.md) is one sequence:

1. Stop untruthful output: exact publication identity, no silent baseline, unified preview/download validity.
2. Restore canonical destination and URL contracts; replace false Start Here; fix route-test inventory.
3. Rebuild first screens: Search-first Home, three-lane Build, compact Sources.
4. Finish core products: shared-scope Explore, exhaustive Catalog, advancing Compare, useful-or-absent Learn.
5. Consolidate copy/search/layout ownership and delete superseded code.
6. Run deployed workflow, actual zoom, human assistive-technology, and physical-device proof.

This order prevents cosmetic work from obscuring truth and workflow defects.

## Residual risks

Even after implementation:

- Publisher source data can change or omit titles/rationales; the product must keep honest absence states.
- Multiple-parent hierarchy rules vary by publisher; no generic graph heuristic should decide them.
- Crosswalks can be official without proving equivalence, coverage, applicability, or inherited implementation.
- External Resources change independently; freshness, ownership, link health, and inclusion rationale need maintenance.
- Browser automation cannot replace practitioner comprehension studies or human assistive-technology testing.
- A public no-account workbench cannot preserve state beyond URLs/local files; this is acceptable if every meaningful configuration is serializable/exportable.
- More data can recreate density. Scope/count budgets and progressive disclosure need regression tests, not only visual review.

## Completion decision

The audit deliverables are complete when their artifact validation and relevant checks pass. The product itself is not corrected by this audit. No product code, route, runtime copy, style, test, deployment, or production state was changed.
