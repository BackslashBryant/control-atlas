# Verification results

Date: 2026-07-28

## Artifact validation

PowerShell validation:

- Required deliverables present: 10 of 10.
- Surface matrix: 56 rows.
- Surface statuses: 40 Fail, 13 Pass, 1 Blocked, 2 Skipped with reason.
- `Not tested`: 0.
- Invalid surface status values: 0.
- Copy register: 84 rows/rules.
- Desktop wireframe: valid XML.
- Mobile wireframe: valid XML.
- Broken relative links across audit documents: 0.
- `git diff --check`: pass.

The local image inspector does not render SVG. Both boards were therefore XML-validated but not raster-rendered in that inspector. Chrome refused a local/data SVG URL under its URL safety policy, so no alternate browser workaround was attempted.

## Repository contracts

### `npm run test:correction:contracts`

Result: pass.

- Graph/route suite: 31 passed, 0 failed.
- Resources/browser-contract suite: 24 passed, 0 failed.
- Total: 55 passed, 0 failed.

Interpretation limit: these contracts prove selected graph, route, resource-search, and browser-source behaviors. They do not disprove live destination, source-identity, copy, or layout findings. In particular, the browser contract `mounted record surfaces render official descriptions rather than synthetic translations` passes while the live CSF record displays the wrong publication name. The missing contract is exact record-to-publication identity.

### `npm run test:style`

Result: pass.

The fixture test accepted approved copy and rejected six known bad examples. This verifies the Vale rule harness, not complete copy coverage. The current extractor omits several user-facing source classes documented in the audit.

## Checks intentionally not run

`npm run precommit` was not run. It includes browser/server-backed checks, while repository instructions prohibit starting a development server without explicit command/port confirmation. The task was audit-only and made no product code, route, style, test, build, or runtime change.

Human screen readers, physical devices, and actual measured 200% browser zoom remain outside this evidence boundary.

