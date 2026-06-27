# Comprehensive UI/UX Visual and Architectural Audit Spec

**Date:** 2026-06-23
**Goal:** Address critical visual, accessibility, responsive, and architectural UI/UX defects in Control Atlas. This spec provides an exhaustive, step-by-step remediation guide for a junior developer. Do not use external libraries (e.g., Tailwind, MUI); strictly adhere to the existing CSS token system and Radix UI primitives.

## 1. Audit Findings & Evidence

A thorough visual inspection of the running application (`localhost:4173`) and code analysis revealed significant deviations from the translation-first design principles. 

### 1.1 Navigation & Shell Layout (Critical)
**Evidence:** Screenshots of Desktop (`/`, `/explore`, `/compare`, `/atlas-map`) and Mobile viewports (375px width).
*   **Desktop Overflows & Collisions:** The `TopNav` component fails to manage its flex children. The brand lockup ("Control Atlas" + "Ctrl+Alt+Comply") shares a flex container with the primary links (Start, Atlas Map, Explore, etc.) and the utility buttons (Search, Help, Glossary). On standard desktop resolutions, these elements wrap randomly, overlap each other, and break the visual hierarchy.
*   **Mobile Hamburger Failure:** On a 375px mobile viewport, the `TopNav` does *not* collapse into a hamburger menu. Instead, it aggressively stacks all 7 navigation links vertically, consuming over 50% of the screen real estate before the user sees the page hero.
*   **Legacy CSS Conflicts:** The `styles/surfaces.css` file (1980 lines) contains duplicated CSS resets that conflict with `styles/base.css`, causing unpredictable layout behaviors across the shell.

### 1.2 Information Architecture & Copy (Major)
**Evidence:** Visual inspection of `/atlas-map`.
*   **Duplicated Content:** On the Atlas Map page, the summary text *"The map starts with source categories so you can understand where requirements come from..."* is rendered twice consecutively—once in the page header and again inside the "Explore the compliance ecosystem" panel. This violates the principle of "Prefer usable systems" by cluttering the UI.
*   **Hash Router Stalling:** Direct navigation to specific object hashes (e.g., `#/object/NIST_SP-800-53_rev5_AC-2`) sometimes fails to progress past the `HomePage` content due to how the staged data loader (`loadRuntimeDatasetStaged()`) interacts with `ViewState.view`.

### 1.3 Color & Contrast Accessibility (Major)
**Evidence:** Code analysis of `styles/tokens.css` and a11y standards.
*   **WCAG AA Contrast Failures:** The current text tokens for secondary information fail the 4.5:1 contrast requirement against the dark background (`--ca-bg: #0d1117`).
    *   `--ca-text-muted: #8b949e` (Fails)
    *   `--ca-text-subtle: #6e7681` (Fails)

### 1.4 Cytoscape Graph Accessibility (Major)
**Evidence:** Code analysis of `RelationshipGraph.tsx`.
*   **Keyboard Trapping & Navigability:** The Cytoscape canvas is not fully keyboard navigable. Nodes cannot be reached via standard `Tab` / `Enter` interactions. For users relying on screen readers or keyboard navigation, the entire interactive map is inaccessible. 
*   **Missing State Announcements:** The graph filters visually update the canvas, but lack `aria-live` announcements to notify screen readers of the new state (e.g., "Filtered to 15 nodes").

---

## 2. Remediation Execution Plan (For Developer)

Follow these phases sequentially. 

### Phase 1: CSS Foundation & Contrast 
**Goal:** Fix the underlying tokens and remove conflicting CSS resets.

1.  **Modify `styles/tokens.css`:**
    *   Update `--ca-text-muted` to a lighter gray that passes 4.5:1 against `#0d1117` (e.g., `#9ca3af`).
    *   Update `--ca-text-subtle` to a lighter shade that passes WCAG AA.
2.  **Clean `styles/surfaces.css`:**
    *   Search for `margin: 0; padding: 0;` or `box-sizing: border-box;` resets applied to `body`, `html`, or `*` at the top of the file and delete them. Rely solely on `base.css` for globals.
3.  **Run Tests:** `npm run test:a11y` must pass.

### Phase 2: TopNav Responsive Rebuild
**Goal:** Prevent desktop overlapping and implement a proper mobile drawer.

1.  **Restructure `src/ui/components/TopNav.tsx`:**
    *   Group the JSX into three semantic `div` containers: `.nav-brand`, `.nav-primary`, and `.nav-utility`.
2.  **Update CSS for Desktop (in `components.css` or `surfaces.css`):**
    *   Apply `display: flex; justify-content: space-between; align-items: center; gap: var(--ca-space-lg);` to the parent header container.
    *   Apply `display: flex; gap: var(--ca-space-sm); flex-wrap: nowrap;` to `.nav-primary`.
3.  **Implement Mobile Drawer (≤880px):**
    *   Hide `.nav-primary` entirely on screens narrower than `880px`.
    *   Introduce a Radix UI `Dialog` component (or use an existing primitive) triggered by a Hamburger icon button (from `@tabler/icons-react`).
    *   Render the navigation links vertically *only* inside this drawer.

### Phase 3: Copy and Hash Routing Fixes
**Goal:** Clean up the UI text and ensure deep links load reliably.

1.  **Atlas Map Duplication (`src/ui/pages/AtlasMapPage.tsx`):**
    *   Locate the duplicated paragraph *"The map starts with source categories..."* and remove the redundant instance from the `PageHeader` description or the introductory panel.
2.  **View State Reliability (`src/ui/lib/viewState.ts` / `App.tsx`):**
    *   Ensure that the `loadRuntimeDatasetStaged()` promise cleanly triggers a React state update that forces the `AppContent` switch statement to re-evaluate the requested `#/object/...` route once data is loaded.

### Phase 4: Cytoscape Accessibility
**Goal:** Make the graph canvas usable for keyboard users.

1.  **Add Tab Focus (`src/ui/components/RelationshipGraph.tsx`):**
    *   Ensure the `div` wrapping the cytoscape instance has `tabIndex={0}` and an appropriate `aria-label`.
2.  **Implement Keyboard Handlers:**
    *   Add an `onKeyDown` listener. 
    *   Allow the `Tab` key to programmatically iterate through visible nodes (`cy.nodes(':visible')`). 
    *   Use `node.select()` and trigger the Tippy tooltip to visually indicate keyboard focus.
    *   Bind the `Enter` key to trigger the exact same routing/action as a mouse `tap` event on the currently focused node.
3.  **Add `aria-live` Region:**
    *   Add `<div className="visually-hidden" aria-live="polite">{graphAnnouncement}</div>` to the component.
    *   Update `graphAnnouncement` whenever the source filters change (e.g., "Graph updated, showing N nodes").

### Phase 5: Final Verification
Before opening a PR, run the following:
1.  `npm run lint` and `npm run typecheck`
2.  `npm run test:a11y`
3.  Launch the site (`npm run build:site && node ./tools/serve-static-site.mjs`). Resize your browser to 375px width and verify the hamburger menu works and the layout does not clip.
