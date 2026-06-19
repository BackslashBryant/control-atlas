# Live Browser Audit — Epic 8 MITRE Threat Lens — 2026-06-19

Target: staged `dist/site` via local gates (post-merge: `https://backslashbryant.github.io/control-atlas/`)

Branch: `agent/forge/epic-8-mitre-threat-lens`

Manual a11y checklist: [`a11y-manual-checklist.md`](a11y-manual-checklist.md)

---

## Verification gates (automated)

| Gate | Command | Result |
| --- | --- | --- |
| MITRE fetch + import | `npm run fetch:mitre` | Pass — Enterprise (697), ICS (97), D3FEND (271); committed snapshot fallback |
| Data contract | `npm run test:data` | Pass — 105 tests including MITRE importer + federal graph extensions |
| Runtime threat chain | `npm run test:runtime` | Pass — `buildThreatChain` / export paths |
| Threat chain E2E | `tests/e2e/threat-chain.spec.mjs` | Pass — T1033 trace, library detail deep link |
| Critical path | `tests/e2e/critical-path-matrix.spec.mjs` | Pass — MITRE library search, threat chain table label |
| Accessibility E2E | `npm run test:a11y` | Pass — compare threat chain route (60s budget), library MITRE detail |
| Full ship gate | `npm run precommit` | Pass — lint, typecheck, unit/contract, browser, smoke, a11y (54 E2E) |

Generated graph after build: **9,371 nodes**, **12,429 edges**, **44 sources** (+794 ATT&CK/D3FEND nodes vs pre–Epic 8).

---

## Required manual checks

- [x] Compare → **Threat to controls** opens threat-chain workbench with domain filter (local `dist/site`, 2026-06-19)
- [x] Library search `T1033` → technique detail with **Threat context** and **Trace this technique…** action (local spot-check)
- [x] Selected threat chain shows D3FEND countermeasures and NIST controls for T1033 (local spot-check)
- [ ] Live Pages post-merge spot-check — pending until `main` push and Pages deploy

---

## Passed (Epic 8 scope)

- Graph-eligible MITRE sources in registry (`mitre-attack-enterprise`, `mitre-attack-ics`, `mitre-d3fend-ontology`, `mitre-d3fend-mappings`)
- Committed ATT&CK Enterprise + ICS catalogs, D3FEND countermeasures, attack→D3FEND and D3FEND→800-53 maps
- Compare **Threat to controls** workbench with exports and deep links (`workbench=threat-chain`, `chainItem`)
- Library detail MITRE context, populated MITRE references group where edges exist
- Epic 9 relationship map renders MITRE neighbors on technique nodes with mapped edges
- `mitre_published` provenance styling in graph theme and Compare legend

---

## Residual / deferred

- **D3FEND→NIST coverage:** only 36 official Rev. 5 bridge edges; UI surfaces unmapped D3FEND steps explicitly
- **Threat chain summary table:** hidden when a technique is selected to keep axe and render time bounded; full table visible when browsing all techniques
- **Live Pages deploy:** pending merge to `main` and CI/Pages run
- Mobile ATT&CK, ATT&CK Mitigations as first-class nodes — out of scope per epic spec

---

## Sign-off

Epic 8 closes PRD Library object types for ATT&CK/D3FEND and Compare threat-chain trace (`ATT&CK → D3FEND → NIST control`) with committed snapshots and full precommit evidence.
