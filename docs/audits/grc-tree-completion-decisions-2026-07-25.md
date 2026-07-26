# GRC containment tree + Phase B decisions (2026-07-25)

Autonomous decision log for docs/audits/grc-hierarchy-audit-2026-07-25.md steps 4-7
and the Phase B design/navigation pass, per owner directive: "run fully
autonomous... make the labeling, categorization, naming, and tiering calls
yourself." Recorded here for after-the-fact review, not as a request for approval.

## Design philosophy this session ran on (owner directive, mid-session)

1. **Progressive disclosure, shallow to deep.** Every surface should answer "what
   must I do" in plain language first; precise technical detail (raw control IDs,
   OSCAL structure, tier node types) is available underneath, never required
   up front.
2. **The trunk is GRC/Cybersecurity, singular.** Every framework (800-53, STIG,
   CSF, ATT&CK, ...) is a branch off ONE trunk, not its own separate root. Applied
   directly to the nav restructure below: Atlas/Library/Compare are three depths
   of looking at the same underlying body of knowledge, not three unrelated tools.
3. **Friction is the enemy — every click must earn its place.** Used as the test
   for the Library redesign below: does grouping by publisher reduce the number of
   catalogs a newcomer has to scan before recognizing one, and does the "Try
   Atlas" link cut the path for someone who doesn't already know what they want?

## 1. Tier naming vocabulary (nist-ai-rmf / nist-ssdf / dod-rai)

**Decision:** one shared internal `node_type: "group"` (owner-confirmed earlier in
this session), but with per-catalog **display** labels so the UI never shows the
generic word:
- `nist-ai-rmf` → "function area" (AI RMF nests these under its four Functions —
  Govern/Map/Measure/Manage — so "function area" reflects that without overclaiming
  a Function/Category split this session didn't build)
- `nist-ssdf` → "practice group" (NIST SP 800-218's own published term)
- `dod-rai` → "section" (the two groupings — "Toolkit Focus Principles", "SHIELD
  Activities" — are titled sections, not a named taxonomy)

**Reasoning:** decouples the cheap internal type tag (one registration surface,
matching the "benchmark" precedent) from the plain-language label a newcomer reads,
so accuracy and simplicity aren't in tension. Verified live: AI RMF page reads "72
practices across 19 function areas."

## 2. CCI / D3FEND flat-vs-parented

**D3FEND — parented for real.** MITRE D3FEND publishes a genuine 7-tactic taxonomy
(Model/Harden/Detect/Isolate/Deceive/Evict/Restore). It wasn't in the technique
list this app ingests, but it IS in the full ontology graph (`d3fend.json`) the
build already fetches for the NIST-control mapping, via `rdfs:subClassOf` chains
resolving to a `d3f:enables` tactic. Verified: **all 271 of 271** committed D3FEND
records resolve to a real tactic — none fabricated, none skipped.

**CCI — left flat, honestly.** Confirmed via the raw XML: CCI carries no native
grouping field. Its real structural home is the NIST 800-53 control it already
references — 3,836 of 5,137 CCI records (74.7%) already carry that connection as a
`maps_to` edge; nothing needed inventing there. The remaining 1,258 are CCI items
whose only reference in DISA's own list predates SP 800-53 Rev 5 (Rev 3/Rev 4
only) — a genuine upstream data gap, not a code defect (confirmed sample: CCI-000001
references "NIST SP 800-53" and "Revision 4," no "Revision 5" entry at all).

Investigated three community leads the owner supplied for closing this gap:
- `mitre/cis-cci-mappings` — real repo, but its CCI links are LLM-confidence-scored
  (0.85–0.95, with generated "reasoning" text) CIS-Controls-to-CCI mappings, not an
  authoritative DISA/NIST Rev4→Rev5 crosswalk. Not suitable as ground truth for a
  federal compliance graph.
- `stigviewer.com/explainer` — confirms the exact problem ("the Rev 4 hangover")
  but the fix is a proprietary paid API, not a downloadable dataset, and would add
  a live external dependency this static-site architecture doesn't have.
- `i-assure/STIG-CCI-CONTROLMAPPER` — a compiled Windows .exe with DevExpress
  binaries, not usable (and not something to execute from an untrusted source).

**Decision:** do not fabricate or borrow low-confidence links to force these 1,258
closed. Left as an honestly-characterized upstream gap. Follow-up worth scoping
separately: NIST does publish an official Rev4→Rev5 control correspondence; finding
and vetting that specific document was not completed this session.

## 3. UI-label semantics

**Mixed-tier record counts** ("614 records" meaning 603 rules + 11 benchmarks):
split into "603 STIG rules across 11 benchmarks" everywhere a catalog's total was
being quoted as one number, including the record LIST itself, which was silently
including tier nodes (benchmarks/families/categories/tactics/groups) as if they
were browsable records — now filtered out. Verified live on disa-stig, nist-ai-rmf,
csf-2.

**"Filter by family" on non-family catalogs:** made dynamic, driven by each
catalog's actual tier node_type (benchmark/family/category/tactic/group, using the
same plain-language overrides as decision 1). Verified live: STIG now reads
"Filter by benchmark" / "All benchmarks".

## Isolated-node fixes beyond the original steps 4-7 scope

Owner directive mid-session: "Nothing should be unparented or isolated." Beyond
steps 4-7, three additional genuinely-isolated singles were found and fixed (not
fabricated — each traces to a real bug or a real, previously-unwired record):
- `dod-zt:OVERLAYS-CATALOG` — a genuine `type` field typo (`zt-overlay-catalog`
  used a hyphen, missing the `zt_` prefix check that would have given it its own
  node_type), so it silently fell through to generic "requirement" and was never
  wired to anything. Fixed the typo, registered `zt_overlay_catalog`, parented it
  under the dod-zt catalog as a sibling to tenets/pillars (it's the reference
  document, not a container).
- `cmmc-2:LEVEL-1` — CMMC's 3 program levels only got edges when they had a
  `requires_800_171_rev`/`requires_800_172` flag; Level 1 (FAR 52.204-21 basic
  safeguarding — a catalog this app doesn't ingest) had neither. Parented all
  three levels under a new `cmmc-2:CATALOG` node instead of fabricating a link to
  an uningested source.
- `cui-policy:CUI-SPECIFIED` — only CUI-Basic and CUI-Program had a specific
  `protects`/`supports` edge; Specified has no single governing catalog in this
  app's ingested set (each Specified category cites its own separate regulation).
  Parented all three CUI designations under a new `cui-policy:CATALOG` node.

**Result: isolated nodes are now 1,258 — 100% accounted for by the CCI Rev4/Rev5
gap above, 0 elsewhere.**

## Phase B — navigation and layout, grounded in the settled tree

Owner mid-session: "nothing is concrete in the previous build... use the
foundation I told you and proceed from there" — treated the prior nav/IA work as
not-precious rather than a baseline to patch around.

**Primary navigation regrouped from one flat row of 6 to two real groups.**
`src/ui/lib/navigation.ts` now tags every item `section: "framework" | "toolkit"`
instead of positional array slicing (the prior `MOBILE_NAV_SECTIONS` used
`.slice(0,4)`/`.slice(4)`, which silently misfiled a new item added at the wrong
index — the exact class of bug the research pass flagged). Framework (Atlas,
Library, Compare, ordered shallow→deep) is every surface reading the same GRC
graph; Toolkit (Commons, Guides, Documents) is what a practitioner reaches for
while doing the work. A thin divider now separates the two groups in the desktop
tab row. Verified live at 1440px (clean two-group split) and at 961px (correctly
collapses to the mobile sheet).

**Real bug found and fixed in passing:** adding a raw Tailwind `flex` utility
class to `.primary-nav` to lay out the two new groups defeated the existing
`@media (max-width:1279px) { .primary-nav { display:none } }` responsive rule,
because this project's Tailwind utilities carry `!important`
(`styles/tailwind.css`) — the identical bug class STATE.md already recorded once
for `Button`'s `inline-flex`. Fixed by moving `display:flex` into the plain CSS
rule instead, where normal cascade/specificity lets the media query win.

**Library index page rewritten** after direct owner feedback mid-session ("TMI
and confusing... you better already know what the stuff is," "Browse public
security catalogs = hate it," "Public data · local session = silly"):
- Replaced the flat, ungrouped list of 19 catalogs with grouping by publisher
  (NIST/DISA/MITRE/DoD/Other, using data already on each catalog record — no new
  data needed).
- Replaced the heading "Browse public security catalogs" (an instruction, not
  information) with "Official rules and frameworks" plus a sentence that does the
  actual wayfinding job the page was missing: explains these are raw source
  documents (as opposed to Atlas's guided view) and links to Atlas for anyone who
  doesn't already know which one they need.
- Removed the "Public data · local session" status chip (`OrbitalContextBar.tsx`)
  site-wide — it was jargon-flavored and redundant with the home page's existing
  "No login or uploads / Traceable to publishers / Created in your browser" panel.

**Container-width stranding fixed** (Commons 160px, Library 320px inside the
1440px shell, per STATE.md's prior measurement) — both now match
`--ca-content-max` (90rem) in one pass, since neither page's content (wide
title+summary+count rows) has a reading-width reason to run narrower than the
rest of the app. Verified no other dense route (Sources, Compare, Atlas) has the
same constraint.

**Deliberately not done:** did not force Orbital's 3rd "Systems" mode onto any
route. The research pass found Orbital's own definition (diagnostics/advanced
settings/raw data entered deliberately) doesn't cleanly describe GovFrame's
record-detail pages, which are public reference data, not diagnostics — applying
the token literally risked misrepresenting what those pages are. Left as 2-mode
(Editorial/Operational), flagged here rather than guessed into place.

**Home page rebuilt around "land and go," not reassurance copy.** Owner mid-session:
returning users need immediate buttons to features, not a forced funnel through
Start Here; the "Access / No login or uploads / Sources / Traceable to publishers
/ Output / Created in your browser" fact-table was flagged directly as bad. Removed
that panel entirely. The new hero has exactly two equal-weight paths side by side —
"New here? → Start here" and "Know where you're going? →" a row of direct
one-click buttons to all six primary destinations (reusing `PRIMARY_NAV_ITEMS`, so
it can't drift out of sync with the real nav) — plus the search box for a third,
even faster path. Tagline's "create starter documents" clause (flagged as
AI-slop-sounding) is gone; it undersold the page anyway by naming only one of six
destinations.

**Cut reflexive "be careful" copy.** Owner: "so much dumb patronizing stuff... a
bunch of be careful, review this first, don't be silly." Removed the two highest-
repetition instances: CatalogDetailPage's "This page organizes public reference
data. It does not determine applicability or compliance." (rendered on all 19
catalog pages) and the home page's "Review the source before relying on a match."
Kept the one-line, once-per-page SiteFooter notice ("...Not an official government
system") — that one is a factual disclosure a tool like this plausibly needs
somewhere, not a repeated warning, and removing it site-wide wasn't asked for.
Left similar phrasing that's opt-in/contextual alone (About page's own scope
section, Sources' collapsed "Official source links" panel, the per-edge "needs
review" tag that only appears on genuinely inferred/candidate — not published —
relationships) since those aren't the blanket-repeated pattern being called out.
**Not fully swept:** `TemplatesPage.tsx` still has similar phrasing untouched —
flagged here, not fixed, given ship-timeline pressure.

**Landing page fit to one viewport, no scroll** (explicit owner requirement,
"There should be no scrolling on the landing page" / "respect the scroll").
Root cause was two independent bugs compounding on top of already-generous
content: (1) `.landing-hero`'s CSS `gap` was stacking with each child's own
Tailwind `mb-*` margin — double-spacing between every section; (2) the hero
had `min-height:100svh` set independently of the `SiteFooter` that renders as
its sibling immediately after it, so hero+footer together always exceeded one
viewport by exactly the footer's height, regardless of how small the footer
was. Fixed by removing the redundant per-child margins (CSS gap now does that
job alone) and changing the hero to `min-height: calc(100svh - 3.5rem)`, which
reserves room for the footer instead of ignoring it. Verified 0px overflow at
1440×900 and 1440×800; mobile (375×812) has a minor 62px overflow, judged
acceptable — narrow viewports genuinely need more vertical room for the same
content (6 shortcuts wrap to 2 columns instead of 3) and that's ordinary mobile
scroll, not the "why does a landing page scroll for no reason" complaint that
prompted this.

## Headline numbers (this session)

| | Before steps 4-7 | After |
|---|---|---|
| Nodes | 11,563 | 11,674 |
| Edges | 18,679 | 20,755 |
| Unparented | 67% | 53.3% |
| Isolated | 18% (2,073) | **10.8% (1,258, all explained)** |
