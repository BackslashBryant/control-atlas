# Epic 8: MITRE Threat Lens

**Status:** Shipped (June 19, 2026)

**Goal:** Surface MITRE ATT&CK (Enterprise + ICS) techniques and D3FEND countermeasures in the public Library and Compare threat chain.

**User confusion reduced:** "How does this attack technique connect to defenses and controls I already use?"

**PRD gaps addressed:** Library object types (`attack_technique`, `defend_countermeasure`); Compare trace `ATT&CK → D3FEND → control`; provenance `mitre_published`; reference corpus rows 5–6 in [`docs/PRD.md`](../PRD.md).

**Branch:** `agent/forge/epic-8-mitre-threat-lens`

**Dependencies:** Epic 1 bundles; Epic 2 library detail; Epic 3 Compare (STIG chain pattern); Epic 9 relationship graph.

**Lead personas:** Forge (implementation), Scout (MITRE source policy), Muse (UX/copy), Pixel (E2E/a11y), Vector (doc closeout), Sentinel (source eligibility).

---

## Current baseline

- Generated graph has **9,371 nodes** including 697 Enterprise + 97 ICS ATT&CK techniques and 271 D3FEND countermeasures
- Compare **Threat to controls** workbench ships in React shell
- Epic 9 graph renders MITRE neighbors on technique nodes with published edges

---

## Stories

### Story 8.1 — Source registry and fetch script

**Scope:**

- Graph-eligible registry entries: `mitre-attack-enterprise`, `mitre-attack-ics`, `mitre-d3fend-ontology`, `mitre-d3fend-mappings`
- [`scripts/fetch-mitre-data.mjs`](../../scripts/fetch-mitre-data.mjs) with committed snapshot fallback
- `npm run fetch:mitre`

**Acceptance criteria:**

- Sources pass registry validation with checksums
- Fetch writes `data/attack-techniques.json`, `data/d3fend-countermeasures.json`, maps

### Story 8.2 — Importers and build pipeline

**Scope:**

- [`tools/importers/mitre-attack-adapter.mjs`](../../tools/importers/mitre-attack-adapter.mjs)
- [`tools/importers/mitre-d3fend-adapter.mjs`](../../tools/importers/mitre-d3fend-adapter.mjs)
- Wire CATALOGS/MAPS in [`scripts/build-framework-data.mjs`](../../scripts/build-framework-data.mjs)
- Contract tests in `tests/mitre-*-importer.test.mjs`

**Acceptance criteria:**

- Enterprise + ICS techniques and D3FEND countermeasures in generated bundles
- Edges: attack→d3fend, d3fend→800-53 with `mitre_published` provenance
- `npm run test:data` green

### Story 8.3 — Compare threat chain

**Scope:**

- `buildThreatChain()` / `exportThreatChain()` in runtime
- Compare workbench `threat-chain` in React shell
- Intent card: "Threat to controls"

**Acceptance criteria:**

- Technique → countermeasure → NIST control trace in three clicks or fewer
- Export CSV/Markdown/JSON with provenance metadata

### Story 8.4 — Library surfacing

**Scope:**

- Display names for `attack_technique`, `defend_countermeasure`
- Detail page context (tactic/platform/domain)
- "What to do next" links to threat chain and relationship map
- Graph theme for new node types

**Acceptance criteria:**

- Search by technique ID and plain language
- MITRE references group populated on control pages where edges exist

### Story 8.5 — E2E and doc closeout

**Scope:**

- `tests/e2e/threat-chain.spec.mjs`
- Extend critical-path and a11y specs
- Live Pages audit

**Acceptance criteria:**

- `npm run precommit` green
- Plan.md, context.md updated on ship

---

## Epic acceptance criteria (PRD-aligned)

1. Enterprise and ICS ATT&CK techniques searchable in Library
2. D3FEND countermeasures searchable with plain-language summaries
3. Compare **Threat to controls** traces technique → countermeasure → NIST control
4. Provenance text labels on all new relationships
5. Relationship map + table fallback work on MITRE nodes
6. Static site only; committed snapshots reproducible

## Verification commands

```text
npm run fetch:mitre
npm run build:data
npm run test:data
npm run build:site
npm run test:e2e
npm run test:a11y
npm run precommit
```

## Out of scope

- Mobile ATT&CK
- ATT&CK Mitigations as first-class nodes
- Backend/API runtime
- Compliance scoring

## Risk

| Risk | Mitigation |
| --- | --- |
| Bundle size (~800–1,200 new nodes) | Committed snapshots; object-local graph only |
| D3FEND API drift | Pinned versions + checksums; fetch fallback |
| ICS vs Enterprise ID collisions | Separate catalog prefixes |
