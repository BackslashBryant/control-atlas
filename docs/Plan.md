# Control Atlas: Remaining Completion Work

**Owner:** Control Atlas maintainers
**Status:** Active
**Review date:** 2026-08-20
**Supersession:** This temporary plan is the sole active delivery plan. Delete it in the shipping change when every gate below passes; `docs/BACKLOG.md` remains the durable record of work not shipped.

## Outcome

Ship a source-truthful, task-first Control Atlas without treating parser counts, unit tests, or desktop emulation as proof of content completeness or accessibility.

## Current checkpoint

- Reproducible dependency/security baseline and the weighted Home area pool are shipped.
- The 27-profile review register records source-linked semantic samples and separate locator/currentness dispositions. DoD RAI, D3FEND, SP 800-53A, and NIST IoT registry/presentation defects are corrected in the active milestone; NIST SP 800-171 Revision 2 remains explicitly superseded.
- Source detail now separates publisher version, retrieval date, verification date, publication landing pages, and parser artifacts; fabricated date fallbacks and inaccurate third-party federal-source language are removed; compact headers are opaque.
- Next source milestone: replace the flat sentinel-filled register model with parent-publication joins and layer-specific fields, then make layer state, counts, filters, and bounded rendering contextual and URL-stable.

## Remaining work

1. **Reproducible baseline and security policy**
   - Use a repository-compatible Node runtime (`>=22.22.0`) for every local gate.
   - Keep dependency changes limited to verified lockfile deltas and require the audit gate to reject stale or expired exceptions.
   - Record the initial executive verdict and objective matrix from current repository, generated, CI, and live evidence.

2. **Source semantics and currency**
   - Record and review a representative, source-linked semantic sample for every one of the 27 publication profiles.
   - Store review dispositions in a versioned manifest: semantic review (`reviewed_no_known_mismatch`, `remediation_required`, or `blocked`), locator-only review (`none`, `justified`, `remediation_required`, or `blocked`), and currentness (`current_as_checked`, `refresh_required`, `superseded`, or `blocked`).
   - Reconcile substantive upstream content that is currently locator-only, generic, missing from presentation, or represented by the wrong object type. Explicitly classify justified locator-only records.
   - Check current upstream identity/version for each source; update evidence only from official source material and retain publisher-native hierarchy and declared multi-parent cases.
   - Keep CCI, STIG/SRG, 800-53/800-53A, ATT&CK/D3FEND, NIST Zero Trust, DoD Zero Trust, IoT, and Mobile as mandatory regression samples.

3. **Taxonomy and discovery proof**
   - Measure governed tag coverage by publication, record type, taxonomy dimension, and source basis, separating `applicable`, `not_applicable`, and `unreviewed` records.
   - Reconcile publisher classifications, evidence-backed Atlas facets, and editorial concepts; prohibit prose-only applicability inference.
   - Prove tag URL round trips, contextual counts, hidden unavailable choices, bounded vendor/product selection, search aliases, record/resource/template/playbook/compare links, and export context.

4. **Product and accessibility evidence**
   - Keep Home area browsing source-backed: size populated areas by current leaf-record count on a logarithmic scale, show the exact count, and suppress zero-result links.
   - Re-run route/template review at 320, 375, 390, 768, 1024, and 1440 for Atlas landscape, hierarchy, local connections, record detail, Library, Compare, Resources, Sources, and About.
   - Verify no inert action, hidden below-the-fold result, zero-result selectable facet, excessive DOM/list rendering, broken history/deep link, or unlabeled keyboard/focus behavior remains.
   - Complete Android Emulator Chrome + TalkBack and desktop NVDA checks. Record any prerequisite that requires user legal acceptance instead of simulating it.

5. **Release discipline**
   - Add the smallest durable contracts needed for any discovered defect; do not weaken performance, integrity, or source-truth gates.
   - Ship through feature PR, exact-head CI, fresh remote checkout, merged-main CI, Pages deployment, matching live `release.json` SHA, focused live-browser verification, and cleanup.

## Acceptance gates

| Gate | Required evidence |
| --- | --- |
| Source truth | All 27 profiles have a recorded official-source semantic and currentness disposition; unresolved scope is explicit and no profile is silently marked complete from structural counts alone. |
| Presentation | Required publisher fields, source text formatting, locators, ordered/unordered procedures, code/configuration, XML/JSON/registry, and copy output pass profile regression fixtures. |
| Graph and discovery | Bounded hierarchy/neighborhood/list behavior, working links and Compare handoffs, governed tags, URL/history round trips, and accessible mobile list-first fallback pass focused tests and rendered review. |
| Responsive/accessibility | Rendered review at all six widths plus Android Chrome/TalkBack and NVDA evidence; any user-only consent boundary is documented as a release blocker, not waived. |
| Quality and release | Full quality gates, exact-head CI, fresh checkout, merged-main checks, Pages live smoke, matching `release.json`, and no leftover task worktree/branch. |

## Ship sequence

1. Complete source and product evidence; prioritize a verified P0/P1 defect over broad cosmetic change.
2. Implement the smallest source-backed remediation with focused contract tests, then run full quality gates.
3. Show the local rendered result before subjective visual changes ship, using the guarded server workflow only after command-and-port confirmation.
4. Open a PR; require exact-head CI and a fresh remote checkout before merge.
5. Verify merged `main`, Pages workflow, live `release.json` SHA, and live desktop/mobile-browser behavior.
6. Delete this file in the shipping change; prune clean worktrees and delete merged task branches.
