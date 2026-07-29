# Responsive and accessibility evidence — corrected local candidate

Date: 2026-07-29
Evidence boundary: local production build, browser automation, and viewport emulation only.

## Automated responsive result

- Home, Search, Explore, Catalog, Record, Compare, Build, Resources, Learn, and Sources pass the corrected 375, 768, and 1440 surface matrix without page-level horizontal overflow.
- Home keeps Search as the sole primary action and exactly three secondary entrances.
- Explore Map uses a bounded semantic relationship view below 768px and retains React Flow plus ELK on desktop.
- Catalog uses explicit pagination instead of a hidden row cap.
- Official descriptions use a readable preview with the full publisher text available through disclosure.
- Loading shells reserve space and retire after hydration; in-app URL updates do not restore the loading shell or hide the workspace.
- Reduced-motion automation keeps the protected Ctrl+Alt flourish stable.
- Keyboard automation retains visible focus and no focus trap.
- Axe smoke: 5 representative routes passed with zero serious or critical violations.

## Explicit external blockers

- Actual browser 200% zoom was not performed; viewport-equivalent reflow is not a substitute.
- NVDA was not performed.
- VoiceOver or TalkBack was not performed.
- Physical phone and tablet checks were not performed.

Those four items remain `Blocked`, not inferred from automation.
