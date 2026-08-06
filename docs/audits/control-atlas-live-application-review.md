# Control Atlas — Live Application Review

Date: 2026-08-02
Mode: personal browser walkthrough (local build served via `serve-static-site.mjs`, port 4317/21514) plus a raw-HTML/hydrated-DOM comparison against the deployed GitHub Pages site.
Repository baseline at start of review: `d532039` ("fix(audit): close visual and keyboard accessibility gaps"). Fixes described here landed during this session on top of that baseline; the worktree is uncommitted at the time of writing (see `docs/STATE.md` session 19).

## Deploy/state consistency (Stage 0)

| Check | Result |
|---|---|
| Local `main` vs `origin/main` | Identical, clean working tree at session start |
| Local build `RUNTIME_CACHE_VERSION` vs deployed meta tag | Both `20260729-1` — match |
| Local build main bundle hash vs deployed `<script src>` | `index-De_bpqt-.js` on both — byte-identical |
| Deployed meta tags (description, OG, Twitter, CSP) | Identical to local build's `index.html` |
| Console errors on deployed Home load | None |

**Finding: no deploy drift.** The deployed site is exactly what the source at `d532039` produces. Do not assume a green deploy pipeline guarantees this in general — it happened to hold here and was independently checked, not inferred from CI status.

## Pages and viewports personally inspected

Local build, hash-router (`#/...`) navigation, at 1440×900 unless noted; representative pages additionally checked at 390×844 (mobile) and, for one deep case (the Explore/Map record view), at every stage of a four-round live redesign.

- Home (`/`)
- Search (`/search`), including a topic query ("encryption"), a nonsense query, and an exact-identifier query (`DE.AE-08`)
- Start Here (`/start`)
- Explore overview (`/explore`) and the 9 areas (Governance, Risk, Compliance, Architecture, Implementation, Assessment, Operations, Threats & Defense, Knowledge) — spot-checked all 9 for content/navigation/terminology; Governance, Threats & Defense, and Knowledge additionally exercised for back/forward and direct-link navigation while fixing the routing bug below
- Catalog hub and a catalog detail
- Record detail pages: a control (`nist-800-53:AC-2`), a CCI (`disa-cci:CCI-000001`), a D3FEND countermeasure (`mitre-d3fend:D3-AA`)
- Explore's per-record Path / Map / List views for `AC-2` — the most heavily re-worked surface this session (see below)
- Compare hub and a configured catalog-to-catalog comparison (`nist-800-53` × `fedramp-rev5`)
- Learn hub
- Build hub, Tasks, Documents hub, a document detail (Security Plan Starter) with the input form exercised end to end
- Resources hub
- Sources hub
- About
- Error/empty states: `/not-found`, `/retired?q=...`, an invalid record id (`Item not found` / `Record metadata unavailable` paths), a zero-connection record
- Mobile (390×844) spot-check: Home, a record detail, the Build/Documents form, Compare, the Explore record view — no horizontal overflow found on any of these

Not personally inspected this session: every one of the ~278 D3FEND countermeasures, every one of the 1,216 SP 800-53 controls, or an exhaustive per-STIG/per-SRG pass — Stage 0/session-17 automated contract tests (`tests/federal-graph-contract.test.mjs`) cover completeness at that scale; this review is a representative sample, not a full census.

## Findings

### Critical — fixed
**Explore area navigation was completely stuck.** `AtlasMapPage.tsx`'s `AtlasGuidedPath` component seeded its `openLimbId` local state from `state.atlasLimb` via a bare `useState` initializer, with no effect to re-sync it when the prop changed later. Reproduced three ways: (1) direct navigation to a different area's URL while Explore was already mounted, (2) browser back/forward between two areas, (3) clicking a different limb card via a fresh page load's residual state — all three left the *previous* area's catalog list on screen while the URL bar and document title had already updated to the new area. This silently defeats bookmarking, sharing, and back/forward for the site's primary browsing mechanism, and would not be caught by a test that only checks the URL changed.
Fixed: `src/ui/pages/AtlasMapPage.tsx:748-754` adds a `useEffect` that re-syncs `openLimbId` whenever `state.atlasLimb` changes. Also removed an `startTransition` wrap around the hash-driven `setViewState` call in `src/ui/App.tsx:313` (same failure class — a route commit must not be a deferrable/interruptible transition).
Verified: reproduced the original symptom with the pre-fix build (direct nav, hashchange event confirmed firing, browser back), then re-ran the identical steps against the rebuilt site and confirmed each one now shows the correct area.

### High — fixed
**Four full-page notice states had no `<h1>`.** `not-found` and `retired` in `src/ui/App.tsx`, and `Item not found` / `Record metadata unavailable` in `src/ui/pages/ObjectDetailPage.tsx`, all rendered a `<h2>` as their only heading — meaning a screen-reader user jumping to the page's first heading found nothing. `CatalogDetailPage.tsx`'s equivalent "Catalog not found" state already used `<h1>` correctly, so this was an inconsistency, not a universal pattern. Fixed by bumping all four to `<h1>`.

### Copy — fixed
**"Structural position" eyebrow used internal-sounding jargon.** Renamed to (initially) "Control Atlas structure", then — after a second pass caught that this new wording *itself* mislabeled the entire breadcrumb (including the publisher-declared segment, "SP 800-53 → Access Control → AC-2") as Control-Atlas-organized, when `WhereThisSitsRail.tsx` already badges only the genuinely organizing hop per-crumb — corrected again to the neutral "Hierarchy". Documented as a self-caught regression in `docs/STATE.md`, not left silently fixed twice.

### Map/Explore-record view — reworked across four rounds of live review (exceeds "fix defects only"; recorded here for completeness, not claimed as a required correction)
The record-level Path/Map/List view went through substantial, owner-directed rework during this session, in response to specific live feedback rather than a pre-identified defect list. Summary (full detail in `docs/STATE.md` session 19):
1. Split the diagram's contents by relationship class: structural children (enhancements) now render as a full, uncapped tag list, separate from applicability/correlation/implementation/assessment data.
2. Fixed the diagram's default zoom (was clamping to 0.4x on a 7-node neighborhood — verified via the diagram's own zoom-level readout; forced to a 1.0x floor, a 2.5x increase), reduced the canvas's height, narrowed and made sticky the side inspector, clipped its description preview to ~5 lines, hid the redundant "Jump to node" keyboard-shortcut strip once the node count is small enough to read directly (kept in the accessibility tree, not removed).
3. Added relationship-class color coding (nodes and edges) driven by each connection group's already-existing `.lens` field, which no caller had previously populated despite the prop existing; added a legend; regrouped the below-diagram controls by relationship class instead of a flat source list; corrected the breadcrumb eyebrow (see above).
4. Replaced the default view entirely: relationship-type summary cards with counts are now the primary content: selecting one shows that class's own record list; the node-link diagram is now an explicit, off-by-default "View as graph" secondary view.

This was verified after every round: typecheck, lint, full test suite, the four directly-relevant e2e spec files, the full accessibility suite, and (after the round-4 rewrite) the complete e2e suite and the visual regression suite — see `docs/audits/control-atlas-external-evaluation-readiness.md` for the consolidated verification evidence. One test regression I caused was fixed rather than weakened (see that report).
**Explicitly deferred, not built:** a true radial/concentric relationship-class-lane layout for the *optional* graph itself (the graph, when opened, is still an ELK "mrtree" layout, just now correctly scoped to one relationship class at a time). This is a bounded, real follow-on, not attempted this session.

### Noted, not fixed (pre-existing, out of scope for this pass)
- `AC-2`'s own `ancestor_path` currently has no link tagged `origin: "organizing"` (checked live via DOM), so the per-crumb "Control Atlas structure" badge in `WhereThisSitsRail.tsx` never actually renders for this specific record even though the mechanism is correctly built. This is a data-generation question in `scripts/build-framework-data.mjs`'s `attachAncestorPaths`, not introduced this session.
- Design feedback on the general color palette ("everything blends together") was investigated and found to be a deliberate, previously-locked design decision (155 real CSS custom properties, all text contrast measured 5.4–13.75:1, comfortably above WCAG AA) — not a defect. Recorded as a design conversation to have separately if the palette itself is to be revisited.
- The user separately volunteered that the "Decomposes into" tag/badge-button pattern is one they'd like to see reused more broadly across the site. Not acted on beyond its existing and newly-added uses (the Explore-record family-tree tags) — noted as a future enhancement, not a defect.

## Practitioner-workflow-adjacent observations
Search, Compare (with its "a published mapping... does not establish equivalence, applicability, implementation, compliance, or authorization" disclaimer), Sources-vs-Resources distinction, and error-state recovery were all exercised live and read as intended — see `docs/audits/control-atlas-practitioner-workflow-dry-run.md` for the full per-task account.
