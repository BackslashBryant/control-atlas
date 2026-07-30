# Verification results — corrected local candidate

Date: 2026-07-29
Candidate implementation commit: `c596c0f3160f60eed277f764f000c4c58c21183a`

## Current local results

- `npm run test:correction:contracts`: 58 TypeScript tests and 36 Node tests passed.
- `npm run test:correction:local`: 27 Playwright tests passed.
- `npm run precommit`: passed.
  - data suite: 236 tests passed;
  - runtime suite: 30 passed;
  - graph suite: 52 passed;
  - browser contracts: 23 passed;
  - accessibility smoke: 5 passed;
  - practitioner workflow smoke: 12 passed.
- Full automated accessibility matrix: 30 routes and interaction states passed with zero serious or critical axe violations.
- `npm run prepush:audit`: 2 brand-rotation tests and 37 browser/content/speaker tests passed; Vale reported zero findings.
- Complete search artifact: 229,145 bytes at gzip level 9, below the 300,000-byte invariant.
- Federal graph: 50 sources, 11,674 nodes, 22,273 edges, 22,273 evidence records, 11 blocked graph-health findings, and zero inferred candidate edges published.
- `npm run audit:deps`: passed with two existing time-bounded dev-tool exceptions.
- `npm run license:check`: 738 package entries passed.
- `npm run sbom:generate`: current CycloneDX SBOM generated.
- `npm run test:oscal:independent`: valid catalog/profile fixtures accepted by NIST OSCAL CLI; invalid fixtures rejected.
- The first final Lighthouse matrix exposed a 3,075 ms median LCP on the SP 800-53 catalog because publication identity waited for the full record payload.
- A delayed-payload browser invariant now proves the catalog title and source context render from the small bootstrap before records arrive.
- Focused post-fix Lighthouse: LCP 1,963 ms, TBT 8 ms, CLS 0.
- Final `npm run test:performance`: 16 routes × 3 measured samples, zero threshold failures; median LCP 1,956–1,963 ms, maximum median TBT 73 ms, maximum median CLS 0.034, performance 98, accessibility 100.
- Live replay of deployed application commit `54e40be` exposed one missed Catalog-detail toolbar consumer. The pre-fix DOM had no `data-controls-for` owner for its result-affecting controls. Commit `c596c0f` adds the missing browser invariant, wraps the toolbar in `WorkbenchControlSurface`, binds it to `catalog-record-results`, and passes the full local gate.

## Candidate artifact identity

- Build manifest timestamp: `2026-07-29T01:35:49.122Z`.
- `index-DK5gUEAZ.js`: SHA-256 `4D55C69BFC08CB2E8F2AE3E5F541A8D102897837D3F426C0878C8031D52DB7B0`.
- `App-CR2URoL2.js`: SHA-256 `C5D73FD8778E11E7B19BDB6E8D44CC4D14AA3CE39D9674C5BA77E4B62BB78D57`.
- `runtimeLoader-Cn2KtAwj.js`: SHA-256 `E15B5F46AC74070FF6E3FDA66D8E457448E2BE44488AFCF263AD5D66E85A4FFB`.
- `RelationshipGraph-CZveK5C1.js`: SHA-256 `438E3AEA20D075E3A5F1D207BFD35CAEF802B580BA9B1A2A5966C2EA620AA838`; loaded only for an explicit desktop graph-dependent view.

## First deployed-candidate evidence

- Correction branch Public Repo Checks `30502288499`: passed.
- `main` Public Repo Checks `30502377470`: passed.
- Secret Scan `30502377468`: passed.
- CodeQL `30502377495`: passed.
- Pages deployment `30502464010`: passed.
- Pages Live Smoke `30502503158`: 52 of 52 passed.
- Same-runner Lighthouse A/B `30502633632`: previous release median 58; application commit `54e40be` median 98.

## Corrected deployed-candidate evidence

- Application correction `c596c0f3160f60eed277f764f000c4c58c21183a`; deployment source `2496c9c4776c4cfb5c6ff42adcfb30efb5949c33`.
- Correction branch Public Repo Checks `30503469420`: passed.
- `main` Public Repo Checks `30503546369`: passed.
- Secret Scan `30503546338`: passed.
- CodeQL `30503546367`: passed.
- Pages deployment `30503636846`: passed.
- Pages Live Smoke `30503679776`: passed.
- Same-runner Lighthouse A/B `30503791440`: previous release median 53; corrected candidate median 91.
- Live Catalog-detail proof: one shared owner and one result target, matching `aria-controls`, visible ownership, zero horizontal overflow, entry asset `index-DK5gUEAZ.js`, and cache marker `20260729-1`.
- This post-deploy evidence update changes documentation only; the verified application assets are unchanged.

## OSCAL boundary

The current importer classifies and normalizes the repository's controlled public-source inputs; it is not an independent OSCAL schema validator. The NIST CLI is the independent verification gate and correctly rejects missing required metadata. No uploaded or user-supplied OSCAL enters the static product.

## External results still required

- Human editorial, practitioner, screen-reader, actual-zoom, and physical-device sign-off.
