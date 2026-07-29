# Control Atlas V1 holistic correction — local release evidence

Evidence updated: 2026-07-29
Branch: `agent/forge/control-atlas-holistic-correction`
Starting commit: `8848fc9be9996e76c8e3595c328bfda4af382d98`
Candidate implementation commit: `fed6cf5e550808d72ce2897a71b523c59999c775`
Authority: local implementation and non-destructive validation only

## Local outcome

The locally completable Control Atlas V1 correction is implemented. No known Critical or High product, source-truth, security, or data-integrity defect remains in the local candidate.

Control Atlas now keeps exact publication identity attached across the 11,674-node corpus, fails closed when identity is missing, and preserves publisher-declared hierarchy as the only tree. A baseline is a selectable published profile, never a framework or structural parent. Mappings, applicability, evidence, implementation aids, processes, and Resources are also never parents.

The product finds, reads, compares, traces, and produces starter files from explicit inputs. It does not determine applicability, select a baseline, claim compliance or inheritance, or decide authorization or ATO readiness.

The rotating `Ctrl + Alt + word` brand flourish remains protected. Its 20 words map to real product actions across the seven launch surfaces and exclude determinations and self-awarded quality claims. A required future pre-push gate now reruns the brand, copy-speaker, disclaimer, product-identity, and style contracts.

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
| CA-CPY-012/016 | Copy lacked speaker ownership and complete extraction | Speaker manifest and multi-source extractor | Determination ban, speaker coverage, repeated-copy, and disclaimer fixtures | Pass |
| CA-STA-013 | Durable interaction state was local | Validated URL state schemas | Round-trip, refresh, Back, Forward, invalid-state recovery | Pass |
| CA-RWD-014/018 | Fixed panels and page patches owned layout | Shared surface primitives | Overflow, first-useful-content, responsive, reduced-motion, and a11y checks | Pass locally; external human/device checks blocked |
| CA-TST-015 | Tests retained retired routes | Canonical route matrix | Meta-contract and browser recovery matrix | Pass |
| CA-SRCH-017 | Surfaces owned eligibility and ranking separately | Complete compact search artifact and MiniSearch Resources owner | Exact, ambiguous, topic, typo, facets, and honest-zero benchmarks | Pass |
| CA-PERF-019 | Every route loaded global graph/index state; catalog identity waited for its full record payload | Route-scoped artifact plan, self-contained Atlas shards, and staged catalog identity | Loader-plan contracts, shard canonicality, delayed-record invariant, payload budget, 16-route Lighthouse matrix | Pass |

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
| `npm run test:correction:contracts` | Pass — 57 TypeScript + 33 Node tests |
| `npm run test:correction:local` | Pass — 27 Playwright tests |
| `npm run precommit` | Pass |
| Data suite inside precommit | Pass — 236 tests |
| Runtime suite | Pass — 30 tests |
| Graph suite | Pass — 51 tests |
| Browser contracts | Pass — 21 tests |
| Accessibility smoke | Pass — 5 routes, zero serious/critical axe violations |
| Practitioner workflow smoke | Pass — 12 of 12 |
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
| 6. Performance and resilience | Pass | Blocked | Same-runner previous-release A/B on exact commit |
| 7. Security, privacy, dependencies | Pass locally | Blocked | CI/CodeQL on exact commit |
| 8. Release and operations | Pass locally | Blocked | CI, authorized deployment, live smoke, deployed URL/assets |
| 9. Product identity and launch communication | Pass locally | Blocked | Live metadata/repository-description verification and owner decision |

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
- Entry: `index-Dhp3e1e8.js` — 10,264 bytes — SHA-256 `6A1575C4F188FCBD1F4234BE38FBDA391068AC355D5BC49273CC853A7B27F112`.
- App: `App-Bn2A358z.js` — 31,662 bytes — SHA-256 `E2FB6C0D7199DA7C05EB74240279976E424E3CD21AB5FBE913795EA2B12D37E4`.
- Runtime loader: `runtimeLoader-CebW1eWN.js` — 34,641 bytes — SHA-256 `B6B9F856F0CE9C7E4CB03D04EDA4E50F7BE30793CEF1994E6BCA92A2B6767BFF`.
- Desktop relationship graph: `RelationshipGraph-CAsH0jwE.js` — 1,618,001 bytes, 501.93 KB gzip — SHA-256 `B8799DFFF4B3CEDC4F5727A09E323C013095B382E3DF2A2E18D76A4B58F2FF86`; it remains lazy and is not an initial-route dependency.

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
- CI, CodeQL, and same-runner previous-release Lighthouse A/B on the exact commit.
- Authorized deployment and post-deploy live evidence.
- Deployed URL and asset identity for this candidate.
- Owner review and final `GO` or `NO-GO`.

No push, merge, deployment, tag, release, or production mutation occurred.
