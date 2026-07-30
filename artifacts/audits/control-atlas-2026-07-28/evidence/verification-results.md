# Verification results — corrected local candidate

Date: 2026-07-29
Candidate implementation commit: `cf05530bc586b4e2ca4af1e7f399b2e42d257bf4`

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

## Candidate artifact identity

- Build manifest timestamp: `2026-07-29T01:35:49.122Z`.
- `index-B2w5-eYW.js`: SHA-256 `AD41B3F00C591077810F83036AB1AE4F24418969A89F07CB934C4D6D474A98D5`.
- `App-D3U3-Fo9.js`: SHA-256 `CDDD06D461A613F8D6FCFC1D5194D63E8150479BA3954A72D537F17941EA01B6`.
- `runtimeLoader-Cn2KtAwj.js`: SHA-256 `E15B5F46AC74070FF6E3FDA66D8E457448E2BE44488AFCF263AD5D66E85A4FFB`.
- `RelationshipGraph-CuLl9xFB.js`: SHA-256 `64AA5D263127BF4563EBF61C47FEF6990DA75A39E9AD8FC973D19469D65B45A3`; loaded only for an explicit desktop graph-dependent view.

## OSCAL boundary

The current importer classifies and normalizes the repository's controlled public-source inputs; it is not an independent OSCAL schema validator. The NIST CLI is the independent verification gate and correctly rejects missing required metadata. No uploaded or user-supplied OSCAL enters the static product.

## External results still required

- CI and CodeQL on the exact committed candidate.
- Same-runner previous-release Lighthouse A/B in the repository workflow.
- Deployment and post-deploy live smoke.
- Human editorial, practitioner, screen-reader, actual-zoom, and physical-device sign-off.
