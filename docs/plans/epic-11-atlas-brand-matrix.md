# Epic 11: Atlas Identity + Matrix Layout

> **Superseded July 16, 2026.** The v1.0 release-readiness decision replaces the graph-plus-matrix and pull-tab direction with one bounded Atlas offering Path, Map, and List over the same real relationship set. See [`atlas-recovery-options.md`](atlas-recovery-options.md). This file remains historical design evidence and must not be implemented as written.

**Status:** Ready to execute  
**Created:** 2026-06-27  
**Priority:** P1 (brand + rename) → P1 (matrix layout) → P2 (pull-tab + nav pill)

**Goal:** Make the Atlas the unmistakable flagship of Control Atlas — persistent brand wordmark on every page, renamed to just "Atlas," full-page graph+matrix split inspired by MITRE ATT&CK Navigator, and a context-aware pull-tab for ambient access from any workbench.

**User problem solved:** The top-left brand component is visually inert and the tagline is buried in a `<small>` tag. "Atlas Map" reads like a feature name, not a product. The graph alone on the Atlas page has no companion table, leaving power users without a data-dense view of cross-framework coverage. The Atlas is invisible when users are on Compare or Explore.

---

## Change 1 — Rename "Atlas Map" → "Atlas" (S, P1)

Rename all user-visible strings. Do **not** change URL slugs, `view` keys, or TypeScript type names — hash routes must stay backward-compatible.

### Files to touch

| File | What to change |
|---|---|
| `src/ui/lib/navigation.ts:16` | `label: "Atlas Map"` → `label: "Atlas"` |
| `src/ui/pages/AtlasMapPage.tsx` | All `eyebrow="ATLAS MAP"` → `eyebrow="ATLAS"` and page `<h1>Atlas Map</h1>` → `<h1>Atlas</h1>` in both `FoundationAtlasMapPage` and `RuntimeAtlasMapPage` `PageHeader` calls |
| `src/ui/pages/HomePage.tsx` | Any card text referencing "Atlas Map" → "Atlas" |
| `tests/e2e/*.spec.mjs` | Search for `Atlas Map` string matches in assertions and update — run `grep -r "Atlas Map" tests/` first |

### Verify

```
npm run precommit
```

---

## Change 2 — Brand bar: [Ctrl]+[Alt]+[Comply↻] wordmark (M, P1)

Replace the flat `CA` box + "Control Atlas / Ctrl+Alt+Comply" text layout with keyboard-key pills. The rightmost key cycles through `Comply → Map → Navigate → Audit` on a 2.5 s interval. The whole button remains the home navigation target.

### Visual target

```
[Ctrl] + [Alt] + [Comply↻]          ← home button, full width of brand slot
Control Atlas · public federal compliance map   ← sub-line, muted
```

The active (rightmost) key gets the primary blue background (`--ca-primary` / `#1f6feb`) to match the existing brand entrance overlay style. The rotation uses a simple opacity+translateY fade — no clip-window needed.

### TopNav.tsx change

Replace the `.brand` button interior:

```tsx
// Before
<span className="brand-mark" aria-hidden="true">CA</span>
<span>
  <strong>Control Atlas</strong>
  <small>Ctrl+Alt+Comply</small>
</span>

// After
<span className="brand-kbd" aria-hidden="true">
  <span className="brand-key">Ctrl</span>
  <span className="brand-plus">+</span>
  <span className="brand-key">Alt</span>
  <span className="brand-plus">+</span>
  <span className="brand-key brand-key--active">
    <span className="brand-key-word" aria-hidden="true">{rotatingWord}</span>
  </span>
</span>
<span className="brand-sub">Control Atlas</span>
```

Add a `useState` + `useEffect` interval at the top of `TopNav`:

```tsx
const BRAND_WORDS = ["Comply", "Map", "Navigate", "Audit"];
const [wordIdx, setWordIdx] = useState(0);
useEffect(() => {
  const t = setInterval(() => setWordIdx((i) => (i + 1) % BRAND_WORDS.length), 2500);
  return () => clearInterval(t);
}, []);
const rotatingWord = BRAND_WORDS[wordIdx];
```

Respect `prefers-reduced-motion` — if the user has reduced motion, skip the interval and keep `wordIdx` at 0 (`"Comply"` always).

```tsx
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

useEffect(() => {
  if (prefersReducedMotion) return;
  const t = setInterval(() => setWordIdx((i) => (i + 1) % BRAND_WORDS.length), 2500);
  return () => clearInterval(t);
}, [prefersReducedMotion]);
```

### CSS to add in `styles/surfaces.css` (replace existing `.brand`, `.brand-mark` blocks)

```css
/* Brand wordmark */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  text-decoration: none;
  flex-shrink: 0;
}
.brand:hover { background: var(--ca-surface-raised); }

.brand-kbd {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--ca-font-mono);
  line-height: 1;
}
.brand-key {
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  border-bottom: 2px solid var(--ca-border);
  border-radius: 5px;
  padding: 4px 8px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--ca-text);
  min-width: 2ch;
  text-align: center;
}
.brand-key--active {
  background: var(--ca-primary);
  border-color: color-mix(in srgb, var(--ca-primary) 70%, #000);
  border-bottom-color: color-mix(in srgb, var(--ca-primary) 50%, #000);
  color: #fff;
  min-width: 8ch;
}
.brand-key-word {
  display: inline-block;
  transition: opacity 0.2s, transform 0.2s;
}
.brand-key-word.fading {
  opacity: 0;
  transform: translateY(-4px);
}
.brand-plus {
  color: var(--ca-text-muted);
  font-size: var(--font-size-sm);
  padding: 0 1px;
}
.brand-sub {
  font-size: var(--font-size-xs);
  color: var(--ca-text-muted);
  font-family: var(--ca-font-sans);
  white-space: nowrap;
}

/* Remove old brand-mark styles — .brand-mark block can be deleted */
```

**Animation note:** Rather than a CSS animation class, drive the word swap directly from React state. Add/remove a `.fading` class via `useEffect` for the 200 ms crossfade window, then swap the word. This avoids the clip-window bug from the old carousel.

### Mobile — `@media (max-width: 720px)`

The existing mobile block already has `.brand { flex: 1 1 auto }`. Keep that. Add:

```css
.brand-sub { display: none; }  /* too cramped on mobile */
```

### E2E impact

The shell spec asserts `page.getByRole('button', { name: 'Control Atlas' })`. After this change the accessible name will come from the full text content of the button. Check with:

```
grep -r "Control Atlas" tests/
```

If the accessible name changes, update the test. Consider adding `aria-label="Control Atlas — home"` to the `.brand` button so the accessible name is stable regardless of visual word rotation.

---

## Change 3 — Atlas: graph + matrix table split (L, P1)

Replace the current right-side panel (category explainer / `SelectedItemPanel`) with a scrollable coverage matrix table. The graph and table are linked: selecting a node in the graph filters the table; clicking a row in the table centers the graph.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ATLAS                                    [search] [⧉]   │
├──────────────────────────┬──────────────────────────────┤
│                          │  Coverage matrix              │
│   React Flow graph       │  ┌────┬───────┬─────┬──────┐ │
│   (existing)             │  │Ctrl│800-53 │CSF2 │CMMC  │ │
│                          │  ├────┼───────┼─────┼──────┤ │
│                          │  │AC-2│  ●    │  ●  │  ◑   │ │
│                          │  │AC-3│  ●    │  ◑  │  ○   │ │
│                          │  └────┴───────┴─────┴──────┘ │
└──────────────────────────┴──────────────────────────────┘
```

On mobile (`max-width: 900px`): stack vertically — graph on top (fixed 45vh), table below (scrollable).

### New component: `src/ui/components/AtlasMatrix.tsx`

Responsibilities:
- Accept `nodes: GraphNode[]`, `selectedNodeId: string | null`, `onSelectNode: (id) => void`
- Build rows from the node list (filter to actual controls/baselines — skip hierarchy nodes)
- Columns: derive from which framework catalog each node belongs to (`node.metadata?.catalog` or similar field)
- Cells: look up whether a relationship exists from that node to each framework column; map to `"official" | "inferred" | "none"` → `● ◑ ○`
- Clicking a row calls `onSelectNode(nodeId)`, scrolls to row, adds `aria-selected`
- When `selectedNodeId` changes externally, scroll the corresponding row into view

### `AtlasMapPage.tsx` changes

In `FoundationAtlasMapPage`:
1. Remove `<FoundationSidePanel>` and the "How federal compliance fits together" explainer aside
2. Replace with `<AtlasMatrix nodes={model.nodes} selectedNodeId={selectedNodeId} onSelectNode={handleSelectNode} />`
3. Change `.atlas-map-layout` grid from `2-col [graph | side-panel]` to `[graph | matrix]` with `grid-template-columns: 1fr 1fr`

In `RuntimeAtlasMapPage`:
1. Remove `<SelectedItemPanel>` from the layout
2. Add `<AtlasMatrix>` alongside the graph
3. Wire `selectedNodeId` / `onSelectNode` bidirectionally

### CSS changes in `styles/surfaces.css`

```css
/* Atlas split layout */
.atlas-map-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

.atlas-matrix {
  border: 1px solid var(--ca-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: clamp(24rem, 60vh, 44rem);
  display: flex;
  flex-direction: column;
}
.atlas-matrix-scroll {
  overflow: auto;
  flex: 1;
}
.atlas-matrix table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.atlas-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--ca-surface);
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--ca-border);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--ca-text-muted);
  white-space: nowrap;
}
.atlas-matrix tbody tr { cursor: pointer; }
.atlas-matrix tbody tr:hover td { background: var(--ca-surface-raised); }
.atlas-matrix tbody tr[aria-selected="true"] td {
  background: color-mix(in srgb, var(--ca-primary) 10%, transparent);
}
.atlas-matrix td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--ca-border);
  color: var(--ca-text);
}
.atlas-matrix td.coverage-cell { text-align: center; }
.atlas-coverage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.atlas-coverage-dot--official { background: var(--ca-success, #3fb950); }
.atlas-coverage-dot--inferred { background: var(--ca-warning, #d29922); }
.atlas-coverage-dot--none { background: var(--ca-border); }

/* Mobile stack */
@media (max-width: 900px) {
  .atlas-map-layout { grid-template-columns: 1fr; }
  .atlas-map-main { height: 45vh; }
  .atlas-matrix { max-height: 40vh; }
}
```

### Legend

Add a one-line legend below the matrix header row:

```
● Official mapping  ◑ Inferred / community  ○ Not mapped
```

### E2E — add one new assertion to `critical-path-matrix.spec.mjs`

```js
test("critical path: Atlas matrix table links to graph node", async ({ page }) => {
  await page.goto("/?view=atlas-map");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const matrix = page.getByRole("table", { name: "Atlas coverage matrix" });
  await expect(matrix).toBeVisible();
  const firstRow = matrix.locator("tbody tr").first();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-selected", "true");
});
```

---

## Change 4 — Atlas pull-tab: persistent context access (M, P2)

A `position: fixed` vertical tab anchored to the right viewport edge, visible on all pages except the Atlas page itself (where it would be redundant). Clicking it opens a 360px slide-in side panel containing the relationship graph in focus mode, centered on whatever the current page context is (selected control, compare source, etc.).

### New component: `src/ui/components/AtlasPullTab.tsx`

Props:
```ts
type AtlasPullTabProps = {
  contextNodeId: string | null;   // derived from current view state
  bundle: RuntimeBundle | null;
  onNavigate: (view, patch?) => void;
};
```

Behavior:
- Hidden when `viewState.view === "atlas-map"`
- Renders a `<button className="atlas-pull-tab" aria-label="Open Atlas panel" aria-expanded={open}>ATLAS</button>` fixed to right edge
- When `open`, renders `<div className="atlas-pull-panel" role="dialog" aria-label="Atlas panel">` containing a compact `<RelationshipExplorer>` or a "View full Atlas →" link if bundle isn't loaded
- Closes on `Escape`, clicking the tab again, or clicking outside the panel
- `contextNodeId` is passed down from `App.tsx` based on current view state:
  - `atlas-map`: hide (redundant)
  - `library-detail`: use `state.node`
  - `matrix` (compare): use `state.items` if set
  - everything else: `null` → show overview graph

### App.tsx wiring

Add `<AtlasPullTab>` as a sibling of `<TopNav>` and the main `<main>` in the root render, outside the page router:

```tsx
<AtlasPullTab
  contextNodeId={deriveAtlasContext(viewState)}
  bundle={bundle}
  onNavigate={onNavigate}
/>
```

Add a helper `deriveAtlasContext(viewState: ViewState): string | null` in `viewState.ts` or inline in App.

### CSS

```css
.atlas-pull-tab {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 200;
  background: var(--ca-primary);
  color: #fff;
  border: 1px solid color-mix(in srgb, var(--ca-primary) 70%, #000);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 14px 6px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.15s;
}
.atlas-pull-tab:hover { background: color-mix(in srgb, var(--ca-primary) 85%, #fff); }

.atlas-pull-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 360px;
  background: var(--ca-surface);
  border-left: 1px solid var(--ca-border);
  z-index: 199;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,.3);
  transform: translateX(0);
  transition: transform 0.2s ease;
}
.atlas-pull-panel[hidden] { transform: translateX(100%); }

@media (max-width: 720px) {
  .atlas-pull-tab { display: none; }  /* too cramped; full-page Atlas route serves mobile */
}
```

---

## Change 5 — Atlas nav pill visual treatment (S, P2)

Give the Atlas nav button a filled primary-color background so it reads as the flagship feature rather than a peer item.

### `styles/surfaces.css` — inside the `.primary-nav` block

```css
.primary-nav button[data-atlas] {
  background: var(--ca-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-weight: 600;
}
.primary-nav button[data-atlas]:hover {
  background: color-mix(in srgb, var(--ca-primary) 85%, #fff);
}
.primary-nav button[data-atlas].nav-active {
  background: color-mix(in srgb, var(--ca-primary) 70%, #000);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ca-primary) 40%, transparent);
}
```

In `TopNav.tsx`, add `data-atlas=""` to the Atlas nav button:

```tsx
// In PRIMARY_NAV_ITEMS.map(...)
<button
  data-atlas={item.view === "atlas-map" ? "" : undefined}
  aria-current={active ? "page" : undefined}
  ...
>
```

---

## Execution order

```
1. Change 1 (rename)          — fast, no risk, opens the door
2. Change 2 (brand wordmark)  — visual identity, no data deps
3. Change 5 (nav pill)        — two-liner CSS, do alongside Change 2
4. Change 3 (matrix layout)   — new component, bulk of the session
5. Change 4 (pull-tab)        — separate PR if time is short
```

Run `npm run precommit` (86 E2E) after each logical group. Ship via branch + PR — `main` is branch-protected, required CI check is `checks`.

---

## Files touched summary

| File | Changes |
|---|---|
| `src/ui/lib/navigation.ts` | Label rename |
| `src/ui/pages/AtlasMapPage.tsx` | h1/eyebrow rename; swap side panel → AtlasMatrix |
| `src/ui/pages/HomePage.tsx` | Card copy rename if needed |
| `src/ui/components/TopNav.tsx` | Brand wordmark; Atlas `data-atlas` prop |
| `src/ui/components/AtlasMatrix.tsx` | **New** — coverage matrix table |
| `src/ui/components/AtlasPullTab.tsx` | **New** — fixed pull-tab + panel |
| `src/ui/App.tsx` | Mount AtlasPullTab; add `deriveAtlasContext` |
| `styles/surfaces.css` | Brand, atlas-map-layout, atlas-matrix, pull-tab CSS |
| `tests/e2e/critical-path-matrix.spec.mjs` | New Atlas matrix test |
| Various `tests/e2e/*.spec.mjs` | Update any "Atlas Map" string assertions |

---

## Known constraints

- **Branch protection on main:** create a branch, push, `gh pr create`, wait for CI (`checks` job), then `gh pr merge`.
- **`gh pr edit` GraphQL bug:** if you need to update a PR title/body, use `gh api -X PATCH repos/BackslashBryant/control-atlas/pulls/<N> -f title="..." -f body="..."` instead.
- **ELK bundle (501 KB gzip):** the graph chunk is large. The matrix table will load without it (it reads graph data, not ELK), so the matrix-only render path is fast. The ELK split is tracked separately and intentionally deferred from this epic.
- **Node IDs:** hierarchy nodes (`hierarchy:authority`, etc.) are not real controls. `AtlasMatrix` should filter to nodes where `node.metadata?.item_id` is set, or where `node.type !== "hierarchy"`.
