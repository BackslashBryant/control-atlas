# Live Browser Audit - Issue 9 - 2026-06-13

Target: `https://backslashbryant.github.io/GovFrame/`

Audited release commit: `1c8384e`

## Passed

- The deployed page identifies GovFrame as the Federal Security Control Integration Directory.
- Onboarding opens on first load and is dismissible.
- Search for `AC-2` returns the exact NIST control first and exposes its published relationships.
- AC-2 detail separates defining source, relationship type, federal provenance, confidence, and evidence quality.
- Detail provides an accessible relationship list as a text alternative.
- Sources shows federal provenance, owner, graph eligibility, access, lifecycle, versions, graph-health findings, and excluded sources.
- Browse loads graph catalogs and paginates large node sets.
- Compare resolves a DISA CCI to its published NIST SP 800-53 relationship.
- A 390 by 844 responsive viewport has no horizontal overflow.
- The generated release contains 17 sources, 6,780 nodes, 4,036 edges, 4,036 evidence records, and 705 graph-health findings.
- Blocked relationships appear in graph-health and are not published as edges.

## Finding Resolved During Audit

The first deployment loaded an older cached runtime module against the new app contract. Asset versioning was updated and redeployed. A fresh live page then loaded the new runtime and all tested journeys successfully.

## Open

- Native keyboard-only and screen-reader audits remain open because the in-app browser cannot directly execute those assistive-technology interactions.
- Browser-controlled 200% zoom and release performance audits remain Release 1 open requirements.
