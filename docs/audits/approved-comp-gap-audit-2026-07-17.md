# Approved-comp gap audit — July 17, 2026

## Decision

**Release readiness is reopened.** Commit `94ab460` improved performance, data loading, responsive bounds, search matching, and accessibility, but the deployed Atlas is not a faithful implementation of the two owner-approved visual directions. Passing functional and axe checks did not prove product fidelity or comprehension.

The `v1.0.0` tag and release remain blocked pending owner approval.

## Evidence boundary

- Target: `https://backslashbryant.github.io/control-atlas/`
- Deployed commit inspected: `94ab460`
- Owner reference: approved six-column decomposition view and bounded spatial Map with expandable groups and a dedicated guidance inspector
- Desktop inspection: in-app browser at the deployed PL-2 Path and Map
- Mobile inspection: 390×844 emulation plus the release screenshot artifact
- Live automation still passed: 28/28 deployed Playwright checks. That result is regression evidence, not a visual/product approval.

## Release blockers

| ID | Finding | Deployed evidence | Required correction |
| --- | --- | --- | --- |
| V1-RR-004 | Atlas Path does not match the approved decomposition view | Six approved working columns became six tabs and a single low-density result panel. The selected-path action bar, parallel context, card hierarchy, and visible workflow progression are absent. | Restore a six-column desktop decomposition board using real relationships and clearly labeled workflow guidance; stack the same stages vertically on mobile. Preserve an explicit empty stage instead of inventing a connection. |
| V1-RR-005 | Atlas Map does not match the approved spatial view | The first viewport shows disconnected rectangular groups, little spatial hierarchy, and no useful selected-item explanation. The center/group/item composition and visible branch connectors from the approved comp are absent. | Center the selected record, place actual connection groups around it, draw visible deterministic connectors, expand one group into bounded real records, and restore the “why this connects / what to do next” inspector. |
| V1-RR-006 | Search is overwhelming before the user searches | `/explore` opens with 11,000+ records distributed across 17 taxonomy groups; the first group is expanded even with an empty query. | Start with a calm prompt, example searches, and task shortcuts. Show grouped results only after a query or explicit browse action. |
| V1-RR-007 | Templates is an information dump instead of a workflow | The default route renders ten task cards, current-source detail, up to 40 official resources, tool inventories, and companion templates in one page. | Require a task selection first; reveal one numbered step at a time; collapse reference inventories by default; keep the next action visible. |
| V1-RR-008 | Repeated trust/copy boilerplate obscures useful instructions | “Public,” “official,” “source,” “open-source,” and “not an official government system” repeat across page introductions, rows, cards, and four footer statements. The Atlas inspector spends space defending the model instead of explaining the selected connection. | State trust once per surface, keep one concise global disclaimer, use record-level provenance only when it differs, and write specific action copy. |
| V1-RR-009 | Playbooks repeats content and heavy routes delay orientation | Recommended playbooks repeat inside category sections. Sources, Compare, and Templates can show generic full-graph loading before their own page shell. | De-duplicate recommended cards and progressively render route-specific orientation before large datasets arrive. |
| V1-RR-010 | Current tests do not enforce approved visual composition | Bounds, overflow, tabs, and axe passed while the product materially diverged from the approved comps. | Add structural visual contracts for six desktop columns, mobile stage stacking, center/group/item Map geometry, visible connectors, persistent inspector actions, and default-page density limits. |

## Technical debt coupled to the blockers

- `src/ui/pages/AtlasMapPage.tsx` combines Atlas search, filters, Path, Map, List, source-purpose browsing, RMF browsing, and multiple empty states in roughly 1,700 lines.
- `src/ui/pages/TemplatesPage.tsx` combines task routing, FedRAMP transition content, official resources, tools, template generation, and export options in roughly 1,400 lines.
- The current Atlas data model is useful and should be retained: one incident-edge shard per selected record, one filtered relationship set, and no invented Map edges.
- React Flow supports custom nodes, handles, edges, and keyboard operation, but it is unnecessary for the approved bounded six-group composition. A deterministic DOM/SVG layout avoids the existing large graph chunk and gives tighter visual control.

## Acceptance criteria

1. At 1440×1000, the PL-2 decomposition view presents six readable columns in one bounded workspace and a selected-path action bar without page-level horizontal overflow.
2. At 390×844, those stages stack vertically in workflow order; no card, action, or inspector is clipped.
3. Map initially renders only real connection groups. Expanding one group reveals only real incident records and never exceeds the desktop/mobile item caps.
4. Visible connectors join the selected record, groups, and expanded items; the Map remains bounded and does not overlap the inspector.
5. The inspector answers “why this connects” and “what to do next” for the selected record or relationship, with record/source actions from the approved comp.
6. Search, Templates, Sources, and Playbooks each expose one obvious first action and do not front-load exhaustive inventories.
7. Global disclaimer language appears once in the full footer. Repeated row-level trust labels are removed unless the trust state differs.
8. New visual contracts, novice/expert workflows, axe, keyboard, mobile, reduced-motion, performance, full precommit, CI, and live Pages replay pass before a new GO recommendation.
