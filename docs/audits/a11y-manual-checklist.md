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
| 6   | Graph map/list fallback (A11Y-001) | NVDA or VoiceOver on live `#/atlas-map?node=nist-800-53%3AAC-2` and `#/record/nist-800-53/AC-2?relationshipView=list`: verify Map/List tabs, labeled diagram, and relationship table with rationale columns. | 2026-07-09 | Pending human | Optional    | Automated axe on 14 live routes passed 2026-07-08; aria tree verified in product review.                                |

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

## Release gate

Before merging public-shell changes to `main`:

1. Complete all five rows above (or document justified deferral with residual risk).
2. Cite this checklist (date + auditor) in the live Pages audit doc for the release.
3. Run `npm run precommit` and record results in the audit doc automated gates table.

## References

- Automated a11y: [`tests/e2e/accessibility.spec.mjs`](../../tests/e2e/accessibility.spec.mjs)
- Live audit template: [`live-pages-audit-template.md`](live-pages-audit-template.md)
- Production readiness: [`../PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md)
