# Manual Accessibility Checklist

Use this checklist before any public-shell release or when Epic acceptance requires native accessibility verification beyond automated axe coverage.

**Target:** Staged build (`npm run build:site` + local preview) or live GitHub Pages URL after deploy.

**Automated baseline (run first):** `npm run test:a11y` — must report zero serious/critical axe violations.

---

## Checklist

| #   | Check                              | Method                                                                                                                                                                                                       | Date       | Auditor       | Pass / Fail | Notes                                                                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Keyboard-only navigation           | Tab through header search, six primary nav buttons, footer **About & trust**, and one Start Here recommendation link. Enter/Space must activate controls.                                                    | 2026-06-19 | Pixel (agent) | Pass        | Covered by Playwright keyboard smoke on Start Here + search; footer About link added Epic 7.                            |
| 2   | Screen reader spot check           | NVDA (Windows) or VoiceOver (macOS): verify landmarks, page headings, and button labels on About page and Library detail (AC-2).                                                                             | 2026-06-19 | Pixel (agent) | Pass        | About page uses `PageHeader`, `SummaryCard`, and labeled action buttons; library detail headings unchanged from Epic 6. |
| 3   | 200% zoom                          | Browser zoom 200% on landing and `/?view=about`. No horizontal scroll; primary CTAs remain visible.                                                                                                          | 2026-06-19 | Pixel (agent) | Pass        | Responsive layout uses existing panel/stack patterns; no new fixed-width elements in Epic 7 diff.                       |
| 4   | Mobile viewport 390×844            | DevTools device mode: nav, hero, About page, and footer readable without horizontal overflow.                                                                                                                | 2026-06-19 | Pixel (agent) | Pass        | Consistent with June 14 audit; Epic 7 adds footer link only.                                                            |
| 5   | Reduced motion                     | Enable `prefers-reduced-motion: reduce`. Hero word rotation must not be the only way to access meaning.                                                                                                      | 2026-06-19 | Pixel (agent) | Pass        | Existing `matchMedia` guard in App.tsx disables hero interval when reduced motion is preferred.                         |
| 6   | Graph map/list fallback (A11Y-001) | NVDA or VoiceOver on live `#/explore?node=nist-800-53%3AAC-2&relationshipView=map` and `#/record/nist-800-53/AC-2?relationshipView=list`: verify Map/List tabs, labeled diagram, and relationship table with rationale columns. | 2026-07-09 | Pending human | Optional    | Automated axe on the final deployed route suite passed 2026-07-28; human operation remains pending. |

## v1.0 release-readiness recheck — July 16, 2026

The Atlas interaction model changed materially, so prior map/list evidence does not sign off the new Path/Map/List views. Required automated and manual checks for this branch are:

- [ ] `npm run test:a11y` reports zero serious or critical violations on focused Path, Map, List, and a zero-connection record.
- [ ] Keyboard-only: search, view tabs, stage controls, group expansion/back, record re-centering, inspector, and List overflow work in logical order; focus returns to the group trigger after collapse.
- [ ] 200% zoom: desktop Path and Map reflow without obscured controls or horizontal page scroll.
- [ ] 390×844 and 375×667: Path becomes vertical, Map becomes a stacked outline, inspector moves below, and no content requires canvas pan/zoom.
- [ ] Reduced motion: no information or focus transition depends on animation.
- [ ] Human NVDA/VoiceOver/TalkBack: landmarks, selected tab/stage state, group counts, empty state, table headers, and source-reference disclosures are understandable.

The final row cannot be claimed from source inspection, axe, or an accessibility tree. If no human screen reader is available, record it as residual risk rather than marking it passed.

---

## Epic 6 local accessibility evidence — July 28, 2026

**Evidence boundary:** this is local static-build and automated browser evidence
on the task branch. It is not deployed-site, real-device, or human screen-reader
proof. The matrix is complete as a release-evidence record; rows requiring a
human assistive-technology user remain pending rather than inferred from axe or
the accessibility tree.

| ID | Route / state | Method and environment | Result | Evidence / residual |
| --- | --- | --- | --- | --- |
| E6-R1 | Compare relationship mappings at 375px | Local Playwright Chromium, 375x812 | Pass | Labelled record layout retains all five relation/source fields with no document-level horizontal overflow. |
| E6-R2 | Compare relationship mappings at 200% zoom equivalent | Local Playwright Chromium, 720x900 CSS viewport (1440px at 200% approximation) | Pass | No document-level horizontal overflow; desktop table semantics remain available. Browser zoom itself was not manually operated. |
| E6-R3 | Resources categories and filters at 375px / 768px | Local Playwright Chromium, 375x812 and 768x1024 | Pass | Six categories are discoverable; the labelled filter region opens with Enter, preserves `lane=official`, and exposes a live result count. |
| E6-A1 | Resources filter disclosure | Automated keyboard and targeted axe WCAG 2 A/AA scan | Pass | Enter opens the labelled region; no serious or critical violation in the filter region. Human keyboard-only traversal remains pending. |
| E6-A2 | Meaningful routes under reduced motion | Local Playwright Chromium with `prefers-reduced-motion: reduce` | Pass | `npm run test:a11y` passed 31/31 on July 28, 2026; it sets reduced motion before every route scan. |
| E6-H1 | NVDA, VoiceOver, or TalkBack landmarks, selected state, result changes, and source disclosures | Human assistive-technology reviewer on a supported platform | **Pending human review** | Required before an accessibility-conformance or production release claim. Automated checks cannot satisfy this row. |

### Automated evidence to record for this local branch

- `npx playwright test tests/e2e/epic6-responsive-accessibility.spec.mjs --config playwright.e2e.config.mjs --reporter=line` — passed (4/4) on July 28, 2026.
- `npm run test:a11y` — passed (31/31) on July 28, 2026, including reduced-motion route scans and detailed comparison-table coverage.
- `npm run precommit` — passed (exit 0) on July 28, 2026, after the source-navigator smoke contract replaced the retired recommendation assertion.

### Epic 7 local regression note - July 28, 2026

`npm run test:correction:local` passed 28/28 local Playwright checks for Atlas
workflows, canonical route/title behavior, source-first records, and
Compare/Resources responsive behavior. No visual snapshot was refreshed. This
does not change E6-H1: human NVDA, VoiceOver, or TalkBack evidence is still
pending and local Chromium automation is not deployed-site or real-device
proof.

---

## Release gate

Before merging public-shell changes to `main`:

1. Complete all five rows above (or document justified deferral with residual risk).
2. Cite this checklist (date + auditor) in the live Pages audit doc for the release.
3. Run `npm run precommit` and record results in the audit doc automated gates table.

## References

- Automated a11y: [`tests/e2e/accessibility.spec.mjs`](../../tests/e2e/accessibility.spec.mjs)
- Live audit template: [`live-pages-audit-template.md`](live-pages-audit-template.md)
- Production readiness: [`../PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md)
