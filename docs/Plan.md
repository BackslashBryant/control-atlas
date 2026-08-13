# Control Atlas: Remaining Completion Work

**Owner:** Control Atlas maintainers
**Status:** Active
**Review date:** 2026-08-20
**Supersession:** This temporary plan is the sole active delivery plan. Delete it in the shipping change when every gate below passes; `docs/BACKLOG.md` remains the durable record of work not shipped.

## Outcome

Ship a source-truthful, task-first Control Atlas without treating parser counts, unit tests, or desktop emulation as proof of content completeness or accessibility.

## Executive verdict

**Not whole-product complete.** The source-review, taxonomy, route, and compact-layout milestones are locally met, but the current branch is not yet deployed and hands-on Android Chrome/TalkBack plus desktop NVDA evidence remains unverified. The legacy `ashbryant.github.io` 404 is an external ownership limitation, not a product-code fix. No test, structural reconciliation, or emulated viewport is being promoted into those missing evidence classes.

## Objective matrix

| Objective | Verdict | Evidence type | Current evidence |
| --- | --- | --- | --- |
| Reproducible secure build | Met locally | Automated | Supported portable Node runtime; audit and focused build/test gates pass. Exact-head CI and merged-main CI remain release-sequence gates. |
| Official-source semantic/currentness review | Met | Official-source review + automated manifest validation | All 27 profiles have three named samples, official sources, semantic, locator-only, and currentness dispositions. Structural counts remain a separate evidence class. |
| Publisher-field presentation | Met locally | Automated + local rendered browser | Source dates are separated; source text blocks, locators, procedure/config formats, and copy behavior retain focused regressions. Live proof awaits deployment. |
| Governed taxonomy contract and coverage | Partial by design | Automated | 28,845 of 182,190 record-dimension decisions are applicable; 153,345 are explicitly unreviewed; none are silently classified negative. URL/filter/link/export behavior is implemented and tested. |
| Six-width route/template quality | Met locally | Local rendered browser | Independent 24-route/state matrix at 320/375/390/768/1024/1440 found no remaining persistent overflow, unnamed visible control, duplicate footer, invalid-date/null text, or navigation-mode mismatch. |
| Android Chrome + TalkBack | Blocked | Emulator + unverified assistive technology | `ControlAtlas_API_35_Play` boots and contains Chrome and TalkBack, but Chrome stops at its first-run screen: continuing via **Use without an account** accepts Google's Terms of Service and usage/crash-data notice. No consent was accepted, so the site and TalkBack interaction remain unverified. |
| Desktop NVDA | Unmet | Environment inspection + unverified assistive technology | NVDA is absent from the standard system, 32-bit, and per-user installation paths. It was not installed because the owner must personally accept any installer or licensing terms; hands-on evidence remains unverified. |
| Canonical live release | Unmet for this branch | Live browser | Deployed SHA remains the prior main release until PR, CI, merge, Pages, and matching `release.json` verification complete. |

## 27-publication source audit

The governed details, official URLs, rationale, follow-up, and exact sample locators live in `data/source-review-manifest.json`; `data/generated/source-semantic-audit.json` joins them to independent structural/count evidence.

| Publication | Semantic review | Locator-only review | Currentness | Samples |
| --- | --- | --- | --- | --- |
| cmmc-2 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| csf-2 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| cui-policy | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| disa-cci | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| disa-srg | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| disa-stig | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| dod-rai | reviewed_no_known_mismatch | justified | current_as_checked | 3 |
| dod-zt | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| fedramp-rev5 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| fips-199 | reviewed_no_known_mismatch | justified | current_as_checked | 3 |
| fips-200 | reviewed_no_known_mismatch | justified | current_as_checked | 3 |
| microsoft-zt-maturity | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| mitre-attack | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| mitre-attack-ics | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| mitre-d3fend | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-800-171 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-800-171-rev2 | reviewed_no_known_mismatch | none | superseded | 3 |
| nist-800-172 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-800-37 | reviewed_no_known_mismatch | justified | current_as_checked | 3 |
| nist-800-53 | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-800-53a | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-800-53b | reviewed_no_known_mismatch | justified | current_as_checked | 3 |
| nist-ai-rmf | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-iot-cybersecurity | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-mobile-threats | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-ssdf | reviewed_no_known_mismatch | none | current_as_checked | 3 |
| nist-zt | reviewed_no_known_mismatch | none | current_as_checked | 3 |

## Current checkpoint

- Reproducible dependency/security baseline and the weighted Home area pool are shipped.
- The 27-profile review register records source-linked semantic samples and separate locator/currentness dispositions. DoD RAI, D3FEND, SP 800-53A, and NIST IoT registry/presentation defects are corrected in the active milestone; NIST SP 800-171 Revision 2 remains explicitly superseded.
- Source detail now separates publisher version, retrieval date, verification date, publication landing pages, and parser artifacts; fabricated date fallbacks and inaccurate third-party federal-source language are removed; compact headers are opaque.
- The source register now uses typed recorded/derived/not-applicable/missing states, resolves artifact publishers through parent publications, exposes that basis, and gates required layer completeness without fabricating fields.
- Source layers, contextual counts and filter options, deep links/history, layer-specific empty states, 25-row rendering, show-more focus, sticky orientation, compact labels, and 320/375/390/768 responsive behavior pass focused contracts and rendered review.
- Route-semantic polish is shipped and live-verified: the footer separates product-release and source-data dates, Compare uses native workflow buttons, About has named H2 card regions and a bounded desktop measure, and compact footer trust links fit within the first viewport at all required compact widths.
- The governed taxonomy contract now defines publisher, Atlas-evidence, and editorial layers plus explicit `applicable`, `not_applicable`, and `unreviewed` decisions. The generated report shows that 153,345 of 182,190 record-dimension decisions remain unreviewed, so taxonomy applicability is explicitly partial.
- The obsolete `ashbryant.github.io` host still returns 404 and is not available through the authenticated `BackslashBryant` repository account; the exact obsolete URL is forbidden in owned tracked files, but the external redirect remains open.
- Next release milestone: finish the consolidated quality gate and ship the branch through exact-head CI, fresh-checkout verification, merged-main CI, Pages, and live browser proof. Assistive-technology conformance remains explicitly blocked/unverified at the consent and installation boundaries above.

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
   - Keep governed tag coverage reproducible by publication, record type, taxonomy dimension, and source basis, separating `applicable`, `not_applicable`, and `unreviewed` records.
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
