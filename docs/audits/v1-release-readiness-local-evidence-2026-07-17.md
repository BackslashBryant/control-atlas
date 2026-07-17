# v1.0 release-readiness local evidence — July 17, 2026

## Decision

**Local gate green; release remains NO-GO.** The owner-approved Atlas compositions and the release-blocking search, navigation, and copy findings are implemented and fully verified locally on `agent/muse/v1-0-approved-comp-recovery`. Nothing in this audit authorizes a push, merge, Pages deployment, `v1.0.0` tag, or release publication.

The final local `npm run precommit`, post-deploy workflow replay, focused-Atlas Lighthouse run, and owner review remain gates.

## Evidence boundary

- The deployed site at commit `94ab460` was audited before this branch was edited. That product review revoked approval even though its live automation passed.
- Local browser evidence uses the production static build served by the Playwright configuration on canonical port 4317.
- Emulated viewports are not real-device evidence. Axe and ARIA inspection are not a human screen-reader sign-off.
- The 720 CSS-pixel test is the reflow equivalent of a 1440-pixel viewport at 200% browser zoom; it is not recorded as a manual browser-zoom action.
- Focused-Atlas Lighthouse must be rerun on the deployed commit. Bundle and request evidence below does not substitute for Lighthouse.

## Full local gate

`npm run precommit` completed with exit code 0 in 782.8 seconds on July 17, 2026.

- Static build: 45 sources, 11,486 nodes, 16,207 edges, 16,207 evidence records, and 11 declared graph-health findings.
- Lint and both TypeScript projects passed.
- License review validated 407 package entries.
- Atlas, data, runtime/search, graph, browser, DOM, public-package, and accessibility gates passed.
- Full Playwright matrix: **127 passed, 1 skipped**.
- The focused recovery rerun also passed 45/45 tests across Atlas source navigation, the standalone relationship graph, complete-catalog access, and every template download workflow.

## Release-blocker disposition

| ID | Local disposition | Evidence |
| --- | --- | --- |
| V1-RR-004 | Implemented | Purpose is a real six-column Requirement → Control → Implementation → Evidence → Assessment → Decision board at 1440×1000. It becomes one vertical column on compact layouts and retains explicit “Known gap” stages. |
| V1-RR-005 | Implemented | Map centers the selected record, shows only groups backed by incident edges, draws deterministic connectors, expands one bounded group, and keeps the guidance inspector outside the Map. Zero-edge records render no Map. |
| V1-RR-006 | Implemented | Explore renders no result taxonomy for an empty query. A checked-in 15-case quality gate passes 4/4 expert and 11/11 novice queries across 11,486 search records. |
| V1-RR-007 | Implemented | Templates initially shows only task selection. Official materials, tools, FedRAMP transition detail, and blank working documents appear after a task is chosen. |
| V1-RR-008 | Implemented for release blockers | Footer trust copy appears once. Vague “source truth,” “companions,” and “Official link” labels were replaced with specific current-rule, working-document, published-mapping, and candidate-mapping language. Internal schema vocabulary and the unmounted legacy renderer were not churned. |
| V1-RR-009 | Implemented | Recommended Playbooks no longer repeat in category lists. Heavy routes identify the route and explain the data being prepared instead of showing a generic connection-loading message. |
| V1-RR-010 | Implemented | Structural contracts cover six desktop columns, vertical compact stages, centered Map geometry, group/item caps, zero-connection behavior, inspector placement, 390×844 and 375×667 bounds, 200% equivalent reflow, and reduced motion. |

## Novice and expert workflows

### Complete novice

1. Landing explains the product as “The public map for federal cyber compliance.”
2. Start accepts a system type, impact, and operating environment and returns a guided path.
3. Explore begins with examples instead of thousands of records.
4. `how do I control user accounts` returns AC-2 in the first result group.
5. Templates asks for the job first, then reveals the connected materials in numbered order.

### Expert

1. Exact `AC-2`, `AC-2(1)`, and `CCI-000225` queries return the expected record at rank one.
2. Purpose exposes all six workflow stages and opens a selected published connection.
3. Map exposes only real connection groups; List retains the complete relationship and source-reference fallback.
4. Compare labels relationship state as **Published mapping** or **Candidate mapping** instead of implying every published relationship is an official government mapping.
5. The DISA STIG → CCI → NIST chain and detailed Compare table remain functional after the copy changes.

## Accessibility, mobile, and visual evidence

| Check | Result |
| --- | --- |
| Keyboard view tabs | Pass — ArrowLeft/ArrowRight move the selected Atlas view. |
| Keyboard group collapse | Pass — Escape collapses the expanded group and restores focus to its trigger. |
| Zero-connection ARIA | The focused matrix found a critical dangling `aria-controls`; the empty state was moved into the owned tab panel and both the axe route and functional empty-state regression pass. |
| Desktop bounds | Pass at 1440×1000; Map and inspector do not overlap and the document has no horizontal overflow. |
| Mobile bounds | Pass at 390×844 and 375×667; Map becomes a stacked outline and the inspector follows it. |
| Purpose reflow | Pass — six columns on desktop, one ordered column on compact layouts. |
| 200% equivalent reflow | Pass at 720 CSS pixels with one-column Purpose and no document overflow. |
| Reduced motion | Pass — all Atlas controls remain present and transition duration is reduced to the global near-zero value. |
| Visual review | Pass for the local evidence screenshots in `artifacts/release-readiness/`; they were inspected after generation, not inferred from assertions alone. |
| Human screen reader / real device | **Unverified residual.** NVDA, VoiceOver, TalkBack, iOS, and Android hardware were not available. |

## Performance evidence

- The focused Atlas chunk is 47.66 kB raw / 12.99 kB gzip in the production build.
- The Atlas route loads the compact node index and one deterministic neighborhood shard for AC-2.
- A browser payload contract confirms the focused Atlas does not request `nodes.json`, `edges.json`, or the 1.6 MB lazy React Flow relationship chunk.
- The deployed baseline remains Lighthouse Performance 12 with 17.24 s LCP, 5.42 s TBT, 1.45 CLS, and 20.93 s TTI. A post-deploy run against this implementation is still required to prove the release threshold.

## Four-tool spike outcome

Only the four approved candidates were spiked. No production dependency or runtime service was added.

- **Crawl4AI:** hold as an isolated exception fallback after repeated Playwright extraction failures.
- **Chonkie:** hold for a future long-document search problem; it does not repair record-level search by itself.
- **Qdrant:** reject for the current static stack; both bounded local indexing attempts exceeded stop criteria.
- **Marker:** reject for local integration; consider only an isolated evaluation when a named PDF defeats lightweight extraction.

Full measurements and cleanup evidence are in [`../spikes/open-source-tool-spike-results-2026-07-17.md`](../spikes/open-source-tool-spike-results-2026-07-17.md).

## Remaining gates

1. Obtain approval before push, merge, or deployment under the current sprint constraint.
2. After deployment, replay novice/expert desktop and mobile workflows and run focused-Atlas Lighthouse against the recorded threshold.
3. Obtain explicit owner approval before creating or publishing `v1.0.0`.
