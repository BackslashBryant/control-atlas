# Verification results — corrected local candidate

Date: 2026-07-29
Candidate implementation commit: `fed6cf5e550808d72ce2897a71b523c59999c775`

## Current local results

- `npm run test:correction:contracts`: 57 TypeScript tests and 33 Node tests passed.
- `npm run test:correction:local`: 27 Playwright tests passed.
- `npm run precommit`: passed.
  - data suite: 236 tests passed;
  - runtime suite: 30 passed;
  - graph suite: 51 passed;
  - browser contracts: 21 passed;
  - accessibility smoke: 5 passed;
  - practitioner workflow smoke: 12 passed.
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
- `index-Dhp3e1e8.js`: SHA-256 `6A1575C4F188FCBD1F4234BE38FBDA391068AC355D5BC49273CC853A7B27F112`.
- `App-Bn2A358z.js`: SHA-256 `E2FB6C0D7199DA7C05EB74240279976E424E3CD21AB5FBE913795EA2B12D37E4`.
- `runtimeLoader-CebW1eWN.js`: SHA-256 `B6B9F856F0CE9C7E4CB03D04EDA4E50F7BE30793CEF1994E6BCA92A2B6767BFF`.
- `RelationshipGraph-CAsH0jwE.js`: SHA-256 `B8799DFFF4B3CEDC4F5727A09E323C013095B382E3DF2A2E18D76A4B58F2FF86`; loaded only for an explicit desktop graph-dependent view.

## OSCAL boundary

The current importer classifies and normalizes the repository's controlled public-source inputs; it is not an independent OSCAL schema validator. The NIST CLI is the independent verification gate and correctly rejects missing required metadata. No uploaded or user-supplied OSCAL enters the static product.

## External results still required

- CI and CodeQL on the exact committed candidate.
- Same-runner previous-release Lighthouse A/B in the repository workflow.
- Deployment and post-deploy live smoke.
- Human editorial, practitioner, screen-reader, actual-zoom, and physical-device sign-off.
