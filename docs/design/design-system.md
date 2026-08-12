# Control Atlas Design System

- **Owner:** Muse
- **Status:** Canonical
- **Last reviewed:** 2026-08-11
- **Supersession:** Approved visual-system changes replace the affected rule here and its component or visual tests in the same change.

Control Atlas adapts **Orbital Archive No. 01 v1.7.0** as its visual and interaction system. The product principle remains: build for translation, not complexity.

## Foundations

- **Palette:** Lunar Signal Modernism: Orbit Ink, Graphite, Slate, Alloy, Grid Line, Dust, Bone, Relay Cyan, Observatory Gold, Solar Orange, Status Signal, Alert Rust, and Fault Red.
- **Typography:** Barlow Condensed for display, Inter for body, and IBM Plex Mono for identifiers and operational labels. The reference package does not bundle font files, so the application uses deliberate system fallbacks without a network dependency.
- **Spacing:** 4-point scale with dense operational surfaces and clear separation between unrelated tasks.
- **Geometry:** restrained 2-6px radii, thin technical borders, datum marks, grids, and limited elevation.
- **Focus:** visible focus treatment and 44px touch targets are release gates.
- **Motion:** brief feedback only; reduced-motion preferences disable nonessential transitions and animation.
- **Icons:** Tabler is the single icon family. Status and provenance never depend on color alone.

Canonical values live in `styles/tokens.css`. Components consume semantic `--ca-*` aliases; route CSS must not introduce palette literals.

## Information Depth

| Depth | Purpose | Treatment |
|---|---|---|
| 0 / Signal | Product orientation, trust boundary, and route choice | Editorial composition with one primary action |
| 1 / Mission | Search, browse, compare, generate, and resource workflows | Operational shell, visible scope, restrained cards and tables |
| 2 / Systems | Individual records, resources, and source detail | Dense metadata, provenance, return path, source truth separated from interpretation |

Every non-home route exposes its depth, mission label, and current scope through the shared context bar.

## Shared Components

- `BrandLockup`
- `OrbitalContextBar`
- `PageHeader`
- `SummaryCard`
- `ResultCard`
- `TrustBadge`
- `SourceSummary`
- `RelationshipGroup`
- `DisclosurePanel`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `Breadcrumbs`
- `NextActions`
- `FilterPanel`
- `CommonsLaneBadge`
- `TemplateChoiceCard`
- `CopyButton`

## Layout and Disclosure

- Use a single narrative column for reading-heavy content.
- Use columns only when they improve scanning or comparison.
- Put primary work before supporting context on compact screens.
- Use disclosure for raw metadata, long mappings, source mechanics, and advanced options.
- Never hide the primary action or information needed to understand the page.
- Maintain an obvious return path from every Depth 2 surface.

## Geometry Safe Corridors

Decorative aerospace geometry (orbital rings, plotted paths, datum lines, grain, scanlines) may only occupy: page margins and gutters, the empty side of a hero split, plot/map/timeline/diagram canvases, panel edges and footer rails, or a dedicated media region. It must never cross running copy or headings, form labels/fields/controls/validation, table rows or cells, primary calls to action, or focus rings. Reducing decorative geometry is always preferred over reducing content clarity on narrow screens.

## Identity Boundaries

- Relay Cyan means interaction and informational emphasis.
- Observatory Gold means priority or curated value.
- Solar Orange is reserved for rare editorial signal.
- Status Signal, Alert Rust, and Fault Red retain fixed state meanings.
- Purple, violet, pink, and magenta are outside the Control Atlas palette.
- Avoid aerospace photography, decorative telemetry, fake operational readings, and invented niche iconography.
- The result should read as a public technical reference instrument, never a fake government portal.

## Branding

**Product:** Control Atlas

**Tagline:** The public map for federal cyber compliance.

**Signature:** `Ctrl+Alt+[rotating word]` is a brand flourish, not a navigation model.

The source design package is MIT licensed. Control Atlas adapts its system without copying product-specific content or fabricating official status.
