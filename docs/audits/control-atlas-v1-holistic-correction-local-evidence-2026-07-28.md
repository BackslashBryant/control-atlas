# Control Atlas V1 holistic correction — local release evidence

Evidence updated: 2026-07-29
Branch: `agent/forge/control-atlas-holistic-correction`
Starting commit and pre-deploy rollback target: `8a759f371731efec8be06ccfc515486ad0d0a3c7`
Candidate implementation commit: `c596c0f3160f60eed277f764f000c4c58c21183a`
Authority: local implementation, non-destructive validation, push, merge to `main`, and GitHub Pages deployment. Every locally completable launch-contract gate has current local and deployed evidence.

## Milestone commits

- `f13758492ac4c5e09ee3199e8c5c4f8ba36423b5` — restore guided Atlas loading and recovery.
- `4800640f7ebb6e94859ff9821b91194503df6403` — anchor result-affecting controls to the results they own.
- `575bc407d2d3bea59e0762dc4662514777b18794` — promote Resources to a top-level spoke and connect global discovery.
- `45b65443ca544365ecb453fc1234fe7d7f14ea26` — centralize deployed cache/version gate ownership.
- `8f201ea56fa49c721feed08c19174b95410e14d1` — separate accessible action colors from the brand accent.
- `cf05530bc586b4e2ca4af1e7f399b2e42d257bf4` — remove duplicate floating navigation and rewrite source entry in practitioner voice.
- `c596c0f3160f60eed277f764f000c4c58c21183a` — migrate the grouped Catalog-detail controls to the shared anchored workbench owner.

## Local outcome

The locally completable Control Atlas V1 correction is implemented. No known Critical or High product, source-truth, security, or data-integrity defect remains in the local candidate.

Control Atlas now keeps exact publication identity attached across the 11,674-node corpus, fails closed when identity is missing, and preserves publisher-declared hierarchy as the only tree. A baseline is a selectable published profile, never a framework or structural parent. Mappings, applicability, evidence, implementation aids, processes, and Resources are also never parents.

The product finds, reads, compares, traces, and produces starter files from explicit inputs. It does not determine applicability, select a baseline, claim compliance or inheritance, or decide authorization or ATO readiness.

The rotating `Ctrl + Alt + word` brand flourish remains protected. Its 27 words map to real product actions across the seven launch surfaces and exclude determinations and self-awarded quality claims. The blocking pre-push gate reruns the brand, copy-speaker, disclaimer, product-identity, and style contracts.

Product-authored glossary entries are labeled `Control Atlas explanation` with their references shown separately. They no longer masquerade as official source text or an unattributed practitioner consensus, and they do not assign applicability, baseline, compliance, inheritance, authorization, or ATO outcomes.

## Correction ledger

| Finding | Systemic root cause | Shared owner corrected | Cheapest faithful invariant | Status |
| --- | --- | --- | --- | --- |
| CA-SRC-001 | One ingestion identity stood in for several publications | Catalog-root publication identity resolver and graph builder | Full-corpus positive check plus missing/mismatched negative fixtures | Pass |
| CA-BLD-002 | Missing baseline became Moderate | Starter-document input schema | Required, optional, invalid, and omitted baseline fixtures | Pass |
| CA-BLD-003 | Preview and Download owned readiness separately | Validated generation snapshot | Snapshot equality, failure, retry, and no-file fixtures | Pass |
| CA-IA-004 | Route identity was duplicated | Canonical destination registry | URL, label, title, nav, analytics, context, and recovery parity | Pass |
| CA-IA-005 | Home had competing hero paths | Search-first Home composition | One primary action and exactly three entrances at responsive widths | Pass |
| CA-IA-006 | Build assumed a task funnel | Shared three-lane Build model | Tasks, starter documents, and Resources route contracts | Pass |
| CA-START-007 | A questionnaire wrapped a fixed result | Source navigator | Fixed inclusion rules and retired questionnaire recovery | Pass |
| CA-EXP-008 | Path, Map, and List owned different scopes | Focused Atlas relationship model | Shared published-edge scope and count parity | Pass |
| CA-CAT-009 | Catalog hid records behind grouping and a cap | Catalog query and pagination model | Every eligible record appears exactly once | Pass |
| CA-CMP-010 | Compare intent did not reveal required state | Compare workbench state model | Advancing, zero, error, and explicit mapping-source fixtures | Pass |
| CA-LRN-011 | Learn was an empty shell | Cited Learn content manifest | Six required topics, citations, limitations, and next actions | Pass |
| CA-CPY-012/016 | Copy lacked speaker ownership and complete extraction; glossary explanations were misattributed | Speaker manifest, multi-source extractor, shared product identity/disclaimer, and glossary consumers | Determination ban, glossary attribution, speaker coverage, repeated-copy, brand, and disclaimer fixtures | Pass |
| CA-STA-013 | Durable interaction state was local | Validated URL state schemas | Round-trip, refresh, Back, Forward, invalid-state recovery | Pass |
| CA-RWD-014/018 | Fixed panels and page patches owned layout | Shared surface primitives | Overflow, first-useful-content, responsive, reduced-motion, and a11y checks | Pass locally; external human/device checks blocked |
| CA-TST-015 | Tests retained retired routes | Canonical route matrix | Meta-contract and browser recovery matrix | Pass |
| CA-SRCH-017 | Surfaces owned eligibility and ranking separately | Complete compact search artifact and MiniSearch Resources owner | Exact, ambiguous, topic, typo, facets, and honest-zero benchmarks | Pass |
| CA-PERF-019 | Every route loaded global graph/index state; catalog identity waited for its full record payload | Route-scoped artifact plan, self-contained Atlas shards, and staged catalog identity | Loader-plan contracts, shard canonicality, delayed-record invariant, payload budget, 16-route Lighthouse matrix | Pass |
| CA-ATL-020 | The Atlas shell could remain blank while the route waited on the wrong graph scope | Shared route-scope loader and progressive-shell ownership | Blank, loading, selected, partial, error, and retry browser invariants | Pass |
| CA-UI-021 | Search, filter, and compare controls floated outside the result region they changed; the initial inventory audit omitted the grouped Catalog-detail state | Shared `WorkbenchControlSurface`, including the Catalog-detail consumer | One visible owner and result target per workbench, `aria-controls`, responsive containment, and zero-overflow checks | Pass |
| CA-RES-022 | Resources and practitioner communities existed under Build but were absent from primary discovery | Canonical Resources route, primary nav, and global Search | Canonical/legacy route, nav, Search, record-context, and responsive invariants | Pass |
| CA-REL-023 | Runtime cache identity and deployed checks used different owners | Shared runtime cache version and build metadata | Local and deployed marker agreement, subpath-safe identity checks | Pass locally; deployed proof pending |
| CA-CPY-024 | Start Here and source-entry copy exposed internal taxonomy and repeated disclaimer language | Shared source navigator plus Help/Home/Explore consumers | Speaker, content, browser, Start Here, and pre-push copy contracts | Pass |

## Superseded implementations deleted

- Questionnaire-based Start Here recommendation logic.
- Editorial resource collections and recommendation badges.
- Duplicated template readiness and implicit Moderate fallback.
- Retired route aliases that redirected into misleading destinations.
- Global `atlas-node-index.json`; focused records now load self-contained hashed neighborhood shards.
- Sharded search-index scheduler; Search uses one complete compact artifact.
- Obsolete static route-copy table and duplicate loading-copy ownership.
- Duplicate page-specific graph, route, and layout ownership replaced by shared owners.

## Local verification

| Command or invariant | Result |
| --- | --- |
| `npm run test:correction:contracts` | Pass — 58 TypeScript + 36 Node tests |
| `npm run test:correction:local` | Pass — 27 Playwright tests |
| `npm run precommit` | Pass |
| Data suite inside precommit | Pass — 236 tests |
| Runtime suite | Pass — 30 tests |
| Graph suite | Pass — 52 tests |
| Browser contracts | Pass — 23 tests |
| Accessibility smoke | Pass — 5 routes, zero serious/critical axe violations |
| Full automated accessibility matrix | Pass — 30 routes/states, zero serious/critical axe violations |
| Practitioner workflow smoke | Pass — 12 of 12 |
| `npm run prepush:audit` | Pass — brand rotation 2/2; browser/content/speaker 37/37; Vale 0 findings |
| Search artifact budget | Pass — 229,145 gzip bytes; limit 300,000 |
| Federal graph audit | Pass — 50 sources, 11,674 nodes, 22,273 edges/evidence, 11 blocked findings |
| Dependency audit | Pass with two existing scoped dev-tool exceptions |
| License check | Pass — 738 package entries |
| CycloneDX SBOM | Regenerated |
| Independent OSCAL CLI | Valid fixtures pass; invalid fixtures reject |
| Lighthouse metric contracts | Pass — 5 tests |
| Delayed catalog-record invariant | Pass — publication identity renders before the full record payload |
| Exact-candidate Lighthouse matrix | Pass — 16 routes, 3 measured samples each, zero threshold failures |

## Launch-contract gate matrix

`Local` means evidence gathered from this worktree and local production build. `Launch` remains blocked wherever the contract requires a deployed candidate, external person, physical device, remote workflow, or owner decision.

| Gate | Local | Launch | Remaining evidence |
| --- | --- | --- | --- |
| 1. Source and decision integrity | Pass | Pass | None known |
| 2. Practitioner workflows | Pass | Pass for automation | Human comprehension is Gate 4 |
| 3. IA, layout, and copy | Pass for automation | Blocked | Human editorial sign-off and actual 200% zoom |
| 4. Practitioner validation | Blocked | Blocked | Five practitioners across at least three roles |
| 5. Accessibility | Pass for automation | Blocked | NVDA; VoiceOver or TalkBack; physical phone/tablet; actual 200% zoom |
| 6. Performance and resilience | Pass | Pass | Same-runner A/B `30503791440`: previous-release median 53, corrected candidate median 91 |
| 7. Security, privacy, dependencies | Pass | Pass | None known |
| 8. Release and operations | Pass | Pass | None known |
| 9. Product identity and launch communication | Pass | Blocked only on owner decision | Owner `GO` or `NO-GO` |

No gate is recorded as `Not tested`.

## Performance and artifact architecture

- Static route shell owns early LCP and retires after hydration.
- Search is one complete compact artifact, 229,145 compressed bytes.
- Catalog landing uses a small bootstrap and loads a selected catalog's records separately.
- Focused Atlas routes fetch one manifest plus one self-contained neighborhood shard; the largest generated shard is 59,075 compressed bytes.
- Full nodes, edges, and evidence load only for an explicit graph-dependent comparison or generation action.
- Mobile Map uses a bounded semantic relationship view; desktop keeps the adopted React Flow plus ELK stack.
- Catalog identity and source context render from the small bootstrap before the selected publication's full record payload arrives.
- The final exact-candidate 16-route, five-collection run used the last three samples per route and failed closed at LCP 2.5 seconds, TBT 200 milliseconds, and CLS 0.1.
- Final medians: LCP 1.956–1.963 seconds, TBT 0–73 milliseconds, CLS 0–0.034, performance 98, accessibility 100, zero threshold failures.

## Candidate artifact identity

- Build manifest timestamp: `2026-07-29T01:35:49.122Z`.
- Entry: `index-DK5gUEAZ.js` — 10,573 bytes — SHA-256 `4D55C69BFC08CB2E8F2AE3E5F541A8D102897837D3F426C0878C8031D52DB7B0`.
- App: `App-CR2URoL2.js` — 32,068 bytes — SHA-256 `C5D73FD8778E11E7B19BDB6E8D44CC4D14AA3CE39D9674C5BA77E4B62BB78D57`.
- Runtime loader: `runtimeLoader-Cn2KtAwj.js` — 34,747 bytes — SHA-256 `E15B5F46AC74070FF6E3FDA66D8E457448E2BE44488AFCF263AD5D66E85A4FFB`.
- Desktop relationship graph: `RelationshipGraph-CZveK5C1.js` — 1,618,001 bytes, 501.93 KB gzip — SHA-256 `438E3AEA20D075E3A5F1D207BFD35CAEF802B580BA9B1A2A5966C2EA620AA838`; it remains lazy and is not an initial-route dependency.

## First deployed-candidate evidence and correction discovery

- Correction branch Public Repo Checks: run `30502288499`.
- `main` Public Repo Checks: run `30502377470`.
- Secret Scan: run `30502377468`.
- CodeQL: run `30502377495`.
- GitHub Pages deployment: run `30502464010`.
- Pages Live Smoke: run `30502503158`, 52 of 52 live workflows passed.
- Same-runner Lighthouse A/B: run `30502633632`; previous release `v1.0.2` median performance 58, candidate `54e40be` median performance 98.
- Live cache marker `20260729-1`, top-level Resources, revised Start Here copy, and the nonblank Atlas entry all matched the committed application.
- Live DOM replay then proved the grouped Catalog-detail controls had no `data-controls-for` owner. The browser contract covered Catalog inventory but not Catalog detail. Commit `c596c0f` extends the invariant to the omitted state and migrates that consumer to the shared owner.

## Corrected deployed-candidate evidence

- Application correction: `c596c0f3160f60eed277f764f000c4c58c21183a`.
- Deployment source with the pre-deploy evidence packet: `2496c9c4776c4cfb5c6ff42adcfb30efb5949c33`.
- Correction branch Public Repo Checks: run `30503469420`.
- `main` Public Repo Checks: run `30503546369`.
- Secret Scan: run `30503546338`.
- CodeQL: run `30503546367`.
- GitHub Pages deployment: run `30503636846`.
- Pages Live Smoke: run `30503679776`, all live accessibility and workflow checks passed.
- Same-runner Lighthouse A/B: run `30503791440`; previous release `v1.0.2` median performance 53, corrected candidate median performance 91.
- Live Catalog-detail DOM: exactly one `data-controls-for="catalog-record-results"` owner, exactly one result target, matching `aria-controls`, visible ownership, and zero horizontal overflow.
- Live control owner label: `Filter SP 800-53 Rev. 5 controls`; deployed entry asset: `index-DK5gUEAZ.js`; cache marker: `20260729-1`.
- This post-deploy evidence update changes documentation only; the verified application assets are unchanged.

## Open-source utility decision

Retain and consolidate:

- MiniSearch for Resources search;
- React Flow and ELK for the desktop relationship map;
- Radix primitives for targeted accessible interaction;
- Playwright, axe, Lighthouse CI, and CycloneDX for release evidence.

Do not add a second search engine, graph framework, router, state library, design system, or RAG layer. No measured launch-contract gap justifies the extra owner or payload.

## Security and data-integrity boundaries

- The public static product has no account, upload, secret, or private-state path.
- Official URLs remain registry-backed; no guessed official deep links are generated.
- The two dependency exceptions are build/audit-tool-only, time-bounded to 2026-10-24, and unreachable from public input.
- The product importer is not represented as an independent OSCAL schema validator. Independent NIST CLI evidence rejects malformed fixtures. If user-supplied OSCAL ingestion is ever proposed, schema validation becomes a blocking prerequisite.

## Evidence packet

- Full-corpus identity: `artifacts/audits/control-atlas-2026-07-28/evidence/full-corpus-source-identity.md`
- Practitioner workflows: `artifacts/audits/control-atlas-2026-07-28/evidence/workflow-evidence.md`
- Responsive/accessibility boundary: `artifacts/audits/control-atlas-2026-07-28/evidence/responsive-layout-evidence.md`
- Command results: `artifacts/audits/control-atlas-2026-07-28/evidence/verification-results.md`
- Surface reconciliation: `artifacts/audits/control-atlas-2026-07-28/surface-matrix-reconciliation.csv`
- Copy reconciliation: `artifacts/audits/control-atlas-2026-07-28/copy-register-reconciliation.csv`
- Performance summary: `artifacts/lighthouse-ci/summary.json`
- OSCAL cross-check: `artifacts/oscal-cli/cross-check.json`
- SBOM: `artifacts/sbom.cdx.json`
- Rollback: `artifacts/audits/control-atlas-2026-07-28/evidence/rollback-record.md`
- Future pre-push chore: `docs/planning/control-atlas-pre-push-brand-copy-chore-2026-07-29.md`

## External evidence explicitly pending

- Five-practitioner validation and replay.
- Human editorial sign-off.
- Human NVDA desktop session.
- Human VoiceOver or TalkBack mobile session.
- Physical phone and tablet checks.
- Actual browser 200% zoom session.
- Owner review and final `GO` or `NO-GO`.

The corrected candidate was pushed, merged to `main`, deployed to GitHub Pages, and verified as recorded above. Tags and GitHub Releases are not part of this correction.
