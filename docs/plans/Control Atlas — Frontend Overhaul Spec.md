# Control Atlas — Frontend Overhaul Spec

**Based on:** Repo audit June 22 2026  
**Stack confirmed:** React 19 · Vite 8 · TypeScript 6 · Cytoscape + fcose · MiniSearch · Radix UI · Tabler Icons · CSS (styles/ top-level)  
**Data pipeline confirmed:** Runtime bundles for sources, nodes, edges, evidence, graph-health already exist  
**Test suite confirmed:** Data contracts, browser contracts, e2e (Playwright), a11y, content-review all present  
**Governing principle:** Build for translation, not documentation

---

## Situation Assessment

The data backend is ahead of the frontend. Build-time importers, normalizers, and validators are working. Runtime JSON bundles are stable and contract-tested. The CI pipeline is real. Dependabot is active.

The live site is broken because **the React UI layer is a thin, incomplete shell**. The components don't reflect the data that exists. The design system tokens exist in `styles/` but are applied inconsistently or overridden inline. Section routing is shallow. Copy is machine-generated and repetitive. Selectors expose raw schema values.

This spec targets `src/` and `styles/` exclusively. The data pipeline, scripts, tests, tools, and CI are not in scope — they're working. Do not touch them.

---

## Absolute Rules (Apply to Every File in This Spec)

1. **No raw** `source_id`**,** `canonical_id`**, or schema enum rendered to users.** Every selector, filter, badge, and label resolves through `display_name`. No exceptions.
2. **Plain-language content precedes formal source text on every surface.** Object detail pages, pattern pages, template prompts — plain language first, formal text collapsed below.
3. **No duplicate fact in headline + subhead.** Headline states what users can do. Subhead adds context. They don't repeat each other.
4. **Every color-coded element has a visible text label.** Provenance badges, confidence pips, graph edges, status indicators — color is never the sole differentiator.
5. **Every graph has a table fallback.** Table ships first. Graph is an enhancement.
6. **Privacy claim appears once per page.** Not once per section.
7. **No hardcoded color values anywhere in** `src/` **or** `styles/`**.** Every color references a CSS custom property from `styles/tokens.css`.

---

## Part 1: Design System (`styles/`)

### 1.1 `styles/tokens.css` — Full Token Set

Audit the existing file. Replace entirely with the following. Any token already present with a different value: the values below win.

```css
:root {
  /* ── Backgrounds ── */
  --ca-bg:             #0B1020;
  --ca-surface:        #111827;
  --ca-surface-raised: #1E293B;
  --ca-border:         #334155;
  --ca-border-subtle:  #1E293B;

  /* ── Text ── */
  --ca-text:        #F8FAFC;
  --ca-text-muted:  #CBD5E1;
  --ca-text-subtle: #64748B;

  /* ── Interactive ── */
  --ca-primary:       #2563EB;
  --ca-primary-hover: #1D4ED8;
  --ca-secondary:     #22D3EE;
  --ca-secondary-hover: #06B6D4;

  /* ── Provenance (always pair with text label) ── */
  --ca-prov-official:   #2563EB;
  --ca-prov-dod:        #4F46E5;
  --ca-prov-nist:       #22D3EE;
  --ca-prov-disa:       #1E40AF;
  --ca-prov-fedramp:    #0D9488;   /* teal — not blue, avoids primary collision */
  --ca-prov-mitre:      #7C3AED;
  --ca-prov-community:  #64748B;
  --ca-prov-inferred:   #F59E0B;
  --ca-prov-deprecated: #DC2626;
  --ca-prov-active:     #16A34A;

  /* ── Semantic ── */
  --ca-success: #16A34A;
  --ca-warning: #F59E0B;
  --ca-danger:  #DC2626;

  /* ── Spacing ── */
  --ca-space-1:  0.25rem;
  --ca-space-2:  0.5rem;
  --ca-space-3:  0.75rem;
  --ca-space-4:  1rem;
  --ca-space-6:  1.5rem;
  --ca-space-8:  2rem;
  --ca-space-12: 3rem;
  --ca-space-16: 4rem;

  /* ── Radii ── */
  --ca-radius-sm: 4px;
  --ca-radius-md: 8px;
  --ca-radius-lg: 12px;

  /* ── Type ── */
  --ca-font-display: "Space Grotesk", system-ui, sans-serif;
  --ca-font-body:    "Public Sans", system-ui, sans-serif;
  --ca-font-mono:    "JetBrains Mono", monospace;

  --ca-text-xs:   0.75rem;
  --ca-text-sm:   0.875rem;
  --ca-text-base: 1rem;
  --ca-text-lg:   1.125rem;
  --ca-text-xl:   1.25rem;
  --ca-text-2xl:  1.5rem;
  --ca-text-3xl:  1.875rem;
  --ca-text-4xl:  2.25rem;
}

```

### 1.2 `styles/base.css`

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; -webkit-font-smoothing: antialiased; }

body {
  background: var(--ca-bg);
  color: var(--ca-text);
  font-family: var(--ca-font-body);
  font-size: var(--ca-text-base);
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3, h4 {
  font-family: var(--ca-font-display);
  font-weight: 600;
  line-height: 1.2;
  color: var(--ca-text);
}

h1 { font-size: var(--ca-text-3xl); }
h2 { font-size: var(--ca-text-2xl); }
h3 { font-size: var(--ca-text-xl); }
h4 { font-size: var(--ca-text-lg); }

code, kbd, .mono {
  font-family: var(--ca-font-mono);
  font-size: 0.9em;
}

a {
  color: var(--ca-secondary);
  text-decoration: none;
}
a:hover { text-decoration: underline; }

:focus-visible {
  outline: 2px solid var(--ca-secondary);
  outline-offset: 2px;
  border-radius: var(--ca-radius-sm);
}

/* Skip link */
.ca-skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--ca-primary);
  color: white;
  padding: 8px 16px;
  z-index: 9999;
  border-radius: 0 0 var(--ca-radius-sm) 0;
}
.ca-skip-link:focus { top: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

```

### 1.3 `styles/components.css` — Shared Component Styles

```css
/* ── Layout ── */
.ca-page {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--ca-space-6);
}

.ca-section {
  padding: var(--ca-space-16) 0;
}

/* ── Cards ── */
.ca-card {
  background: var(--ca-surface);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-md);
  padding: var(--ca-space-6);
}

.ca-card--raised {
  background: var(--ca-surface-raised);
}

.ca-card--interactive {
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.ca-card--interactive:hover {
  border-color: var(--ca-secondary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
.ca-card--selected {
  border-color: var(--ca-secondary);
  border-width: 2px;
}

/* ── Buttons ── */
.ca-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-2);
  font-family: var(--ca-font-body);
  font-size: var(--ca-text-sm);
  font-weight: 500;
  padding: 10px 20px;
  border-radius: var(--ca-radius-sm);
  border: none;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
  text-decoration: none;
  white-space: nowrap;
}

.ca-btn--primary {
  background: var(--ca-primary);
  color: white;
}
.ca-btn--primary:hover { background: var(--ca-primary-hover); }

.ca-btn--ghost {
  background: transparent;
  border: 1px solid var(--ca-border);
  color: var(--ca-text);
}
.ca-btn--ghost:hover {
  background: var(--ca-surface-raised);
  border-color: var(--ca-secondary);
}

.ca-btn--sm {
  font-size: var(--ca-text-xs);
  padding: 6px 12px;
}

/* ── Form controls ── */
.ca-input,
.ca-select {
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  color: var(--ca-text);
  font-family: var(--ca-font-body);
  font-size: var(--ca-text-sm);
  padding: 8px 12px;
  border-radius: var(--ca-radius-sm);
  width: 100%;
  transition: border-color 150ms ease;
}
.ca-input:focus,
.ca-select:focus {
  border-color: var(--ca-primary);
  outline: none;
}
.ca-select option[disabled] {
  color: var(--ca-text-subtle);
  font-style: italic;
}

.ca-field {
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-2);
}

.ca-label {
  font-size: var(--ca-text-sm);
  font-weight: 500;
  color: var(--ca-text);
}

.ca-helper {
  font-size: var(--ca-text-xs);
  color: var(--ca-text-muted);
}

/* ── Badges ── */
.ca-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ca-font-mono);
  font-size: var(--ca-text-xs);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--ca-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid currentColor;
  white-space: nowrap;
}

.ca-badge--official   { color: var(--ca-prov-official);   background: color-mix(in srgb, var(--ca-prov-official) 15%, transparent); }
.ca-badge--dod        { color: var(--ca-prov-dod);        background: color-mix(in srgb, var(--ca-prov-dod) 15%, transparent); }
.ca-badge--nist       { color: var(--ca-prov-nist);       background: color-mix(in srgb, var(--ca-prov-nist) 15%, transparent); }
.ca-badge--disa       { color: var(--ca-prov-disa);       background: color-mix(in srgb, var(--ca-prov-disa) 15%, transparent); }
.ca-badge--fedramp    { color: var(--ca-prov-fedramp);    background: color-mix(in srgb, var(--ca-prov-fedramp) 15%, transparent); }
.ca-badge--mitre      { color: var(--ca-prov-mitre);      background: color-mix(in srgb, var(--ca-prov-mitre) 15%, transparent); }
.ca-badge--community  { color: var(--ca-prov-community);  background: color-mix(in srgb, var(--ca-prov-community) 15%, transparent); }
.ca-badge--inferred   { color: var(--ca-prov-inferred);   background: color-mix(in srgb, var(--ca-prov-inferred) 15%, transparent); }
.ca-badge--deprecated { color: var(--ca-prov-deprecated); background: color-mix(in srgb, var(--ca-prov-deprecated) 15%, transparent); }
.ca-badge--active     { color: var(--ca-prov-active);     background: color-mix(in srgb, var(--ca-prov-active) 15%, transparent); }

.ca-badge--type {
  color: var(--ca-text-muted);
  background: var(--ca-surface-raised);
  border-color: var(--ca-border);
  text-transform: uppercase;
  font-size: var(--ca-text-xs);
}

/* ── Confidence pip ── */
.ca-confidence {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--ca-text-xs);
  color: var(--ca-text-muted);
}
.ca-confidence__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.ca-confidence--high .ca-confidence__dot  { background: var(--ca-success); }
.ca-confidence--medium .ca-confidence__dot { background: var(--ca-warning); }
.ca-confidence--low .ca-confidence__dot   { background: var(--ca-text-subtle); }

/* ── Divider ── */
.ca-divider {
  border: none;
  border-top: 1px solid var(--ca-border);
  margin: var(--ca-space-6) 0;
}

/* ── Tables ── */
.ca-table-wrap { overflow-x: auto; }

.ca-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ca-text-sm);
}
.ca-table th {
  text-align: left;
  padding: var(--ca-space-3) var(--ca-space-4);
  background: var(--ca-surface-raised);
  color: var(--ca-text-muted);
  font-size: var(--ca-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--ca-border);
  white-space: nowrap;
}
.ca-table td {
  padding: var(--ca-space-3) var(--ca-space-4);
  border-bottom: 1px solid var(--ca-border-subtle);
  vertical-align: top;
}
.ca-table tr:last-child td { border-bottom: none; }
.ca-table tr:hover td { background: var(--ca-surface-raised); }
.ca-table tr.ca-table__row--deprecated { opacity: 0.6; }

/* ── Copy button ── */
.ca-copy-wrap { display: inline-flex; align-items: center; gap: var(--ca-space-2); }

.ca-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ca-font-mono);
  font-size: var(--ca-text-xs);
  color: var(--ca-text-subtle);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease;
  padding: 2px 4px;
  border-radius: var(--ca-radius-sm);
}
.ca-copy-wrap:hover .ca-copy-btn,
.ca-copy-btn:focus-visible { opacity: 1; }
.ca-copy-btn.ca-copy-btn--copied { color: var(--ca-success); opacity: 1; }

/* ── Step indicator ── */
.ca-steps {
  display: flex;
  align-items: center;
  gap: var(--ca-space-2);
  margin-bottom: var(--ca-space-8);
}
.ca-step {
  display: flex;
  align-items: center;
  gap: var(--ca-space-2);
  font-size: var(--ca-text-sm);
  color: var(--ca-text-subtle);
}
.ca-step__num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ca-text-xs);
  font-weight: 600;
}
.ca-step--active { color: var(--ca-text); }
.ca-step--active .ca-step__num {
  background: var(--ca-primary);
  border-color: var(--ca-primary);
  color: white;
}
.ca-step--done .ca-step__num {
  background: var(--ca-success);
  border-color: var(--ca-success);
  color: white;
}
.ca-step__connector {
  flex: 1;
  height: 1px;
  background: var(--ca-border);
}

/* ── Tab bar ── */
.ca-tabs {
  display: flex;
  border-bottom: 1px solid var(--ca-border);
  gap: 0;
  margin-bottom: var(--ca-space-6);
}
.ca-tab {
  padding: var(--ca-space-3) var(--ca-space-6);
  font-size: var(--ca-text-sm);
  font-weight: 500;
  color: var(--ca-text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}
.ca-tab:hover { color: var(--ca-text); }
.ca-tab--active {
  color: var(--ca-secondary);
  border-bottom-color: var(--ca-secondary);
}

/* ── Empty state ── */
.ca-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ca-space-4);
  padding: var(--ca-space-16);
  text-align: center;
  color: var(--ca-text-muted);
}
.ca-empty__icon { color: var(--ca-text-subtle); }
.ca-empty__title { font-family: var(--ca-font-display); font-size: var(--ca-text-lg); }

/* ── Code/preview block ── */
.ca-code-block {
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-md);
  overflow: hidden;
}
.ca-code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ca-space-3) var(--ca-space-4);
  border-bottom: 1px solid var(--ca-border);
  background: var(--ca-surface);
}
.ca-code-block__header-label {
  font-size: var(--ca-text-xs);
  font-family: var(--ca-font-mono);
  color: var(--ca-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ca-code-block__body {
  padding: var(--ca-space-4);
  font-family: var(--ca-font-mono);
  font-size: var(--ca-text-sm);
  overflow-x: auto;
  max-height: 480px;
  overflow-y: auto;
  white-space: pre;
  color: var(--ca-text);
}

/* ── Disclaimer block ── */
.ca-disclaimer {
  background: color-mix(in srgb, var(--ca-warning) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--ca-warning) 30%, transparent);
  border-radius: var(--ca-radius-md);
  padding: var(--ca-space-4) var(--ca-space-6);
  font-size: var(--ca-text-sm);
  color: var(--ca-text-muted);
}
.ca-disclaimer strong { color: var(--ca-warning); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .ca-page { padding: 0 var(--ca-space-4); }
  .ca-section { padding: var(--ca-space-8) 0; }
  h1 { font-size: var(--ca-text-2xl); }
  h2 { font-size: var(--ca-text-xl); }
}

```

---

## Part 2: React Component Architecture (`src/`)

### 2.1 Font Loading

In `src/index.html`, add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

```

Self-host if CSP enforcement makes Google Fonts a concern — use `fontsource` packages instead.

### 2.2 CSS Import Order in `src/main.tsx`

```tsx
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
// component-level CSS modules can follow

```

### 2.3 Shell Layout (`src/App.tsx`)

```tsx
export default function App() {
  return (
    <>
      <a href="#main-content" className="ca-skip-link">Skip to main content</a>
      <TopNav />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:type/:id" element={<ObjectDetailPage />} />
          <Route path="/crosswalks" element={<CrosswalksPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/patterns/:slug" element={<PatternDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/provenance" element={<ProvenancePage />} />
          <Route path="/start" element={<StartHerePage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}

```

### 2.4 `src/components/TopNav.tsx`

Sticky, 56px, `--ca-bg` background, `border-bottom: 1px solid var(--ca-border)`.

```tsx
const NAV_LINKS = [
  { to: '/start',      label: 'Start Here' },
  { to: '/library',    label: 'Library' },
  { to: '/crosswalks', label: 'Crosswalks' },
  { to: '/patterns',   label: 'Patterns' },
  { to: '/templates',  label: 'Templates' },
  { to: '/provenance', label: 'Provenance' },
];

```

Active link: `color: var(--ca-secondary)` + `border-bottom: 2px solid var(--ca-secondary)`.

Search trigger: Tabler `IconSearch`, `aria-label="Search controls, STIGs, and terms"`, opens `<SearchOverlay>`.

Mobile (< 768px): hamburger → right drawer. Brand + search icon always visible.

`Cmd+K` / `Ctrl+K` keyboard shortcut opens search overlay from anywhere.

### 2.5 `src/components/SearchOverlay.tsx`

Full-screen overlay, autofocused input, MiniSearch querying the nodes runtime bundle.

Result card structure:

```tsx
<div className="ca-card ca-search-result">
  <span className="ca-badge ca-badge--type">{node.type}</span>
  <span className="mono">{node.canonical_id}</span>
  <CopyButton value={node.canonical_id} />
  <h3>{node.title}</h3>
  <p className="ca-text-muted">{node.plain_language_summary}</p>
  <span className="ca-text-subtle">{node.source_id_display} · {node.version}</span>
</div>

```

`plain_language_summary` is what renders — not `description`. If `plain_language_summary` is empty for a node, render a warning chip: `[no plain-language summary yet]`. This makes missing translations visible and creates pressure to fill them.

Escape closes overlay. Enter on selected result navigates to `/library/:type/:id`.

### 2.6 `src/components/ProvenanceBadge.tsx`

Single reusable component. Takes `provenanceClass: string`. Renders color + label. Never renders without a label.

```tsx
const PROVENANCE_MAP: Record<string, { label: string; cssClass: string }> = {
  official:          { label: 'Official',    cssClass: 'ca-badge--official' },
  federal_published: { label: 'Federal',     cssClass: 'ca-badge--official' },
  dod_published:     { label: 'DoD',         cssClass: 'ca-badge--dod' },
  nist_published:    { label: 'NIST',        cssClass: 'ca-badge--nist' },
  disa_published:    { label: 'DISA',        cssClass: 'ca-badge--disa' },
  fedramp_published: { label: 'FedRAMP',     cssClass: 'ca-badge--fedramp' },
  mitre_published:   { label: 'MITRE',       cssClass: 'ca-badge--mitre' },
  community_open_source: { label: 'Community', cssClass: 'ca-badge--community' },
  inferred:          { label: 'Inferred',    cssClass: 'ca-badge--inferred' },
  deprecated:        { label: 'Deprecated',  cssClass: 'ca-badge--deprecated' },
};

```

### 2.7 `src/components/ConfidencePip.tsx`

Takes `confidence: 'high' | 'medium' | 'low'`. Renders colored dot + text label.

```tsx
const LABELS = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' };

```

### 2.8 `src/components/CopyButton.tsx`

```tsx
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      className={`ca-copy-btn ${copied ? 'ca-copy-btn--copied' : ''}`}
      onClick={copy}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
    >
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

```

---

## Part 3: Pages

### 3.1 `src/pages/HomePage.tsx`

**Hero section:**

```tsx
// Rotating tagline implementation
const WORDS = ['Comply', 'Map', 'Assess', 'Crosswalk', 'Navigate', 'Inherit', 'Audit', 'Authorize'];

// prefers-reduced-motion check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// If reduced motion: render WORDS[0] statically, aria-label on container
// If not: rotate every 2500ms with 300ms CSS opacity fade
// Fixed-width container sized to 'Crosswalk' (longest word)
// aria-label="Ctrl Alt Comply" on container, aria-hidden on rotating span

```

Hero DOM structure (top to bottom):

1. `<h1>Control Atlas</h1>` — `--ca-font-display` weight 700
2. `<div class="ca-hero-tagline" aria-label="Ctrl Alt Comply">` containing:
  - `<span class="ca-hero-prefix">Ctrl+Alt+</span>` — `--ca-text-muted`
  - `<span class="ca-hero-word" aria-hidden="true">{currentWord}</span>` — `--ca-secondary`, `--ca-font-mono`, fixed-width
3. `<p class="ca-hero-sub">The public map for federal cyber compliance.</p>` — `--ca-text-muted`
4. `<p class="ca-hero-body">Explore public controls, baselines, STIGs, and compliance patterns — and generate blank RMF/ATO templates without uploading data or creating an account.</p>`
5. CTA row: `<Link className="ca-btn ca-btn--primary">Start Here →</Link>` · `<Link className="ca-btn ca-btn--ghost">Explore Library</Link>` · `<Link className="ca-btn ca-btn--ghost">Generate Template</Link>`

**Pillar grid** (below hero, 3×2 desktop / 2×3 tablet / 1 mobile):

Each pillar card is a `<Link>` wrapping a `.ca-card.ca-card--interactive`:

```
Start Here     — "Where do I begin?"
Library        — "What does this control mean?"
Crosswalks     — "How do these frameworks relate?"
Patterns       — "How does this process work?"
Templates      — "What do I need to produce?"
Provenance     — "Why trust this mapping?"

```

The question is displayed, not just the section name. Tabler icon per card. Arrow at bottom-right.

### 3.2 `src/pages/LibraryPage.tsx`

Two-column layout: 240px filter sidebar (sticky) + results area.

**Filters** (all checkboxes, no page reload on change):

Object type group: Control · Baseline · STIG Rule · SRG Requirement · CCI · ATT&CK Technique · D3FEND Countermeasure

Source class group: NIST · DISA · FedRAMP · MITRE · Community · Inferred

"Clear all filters" link at bottom.

**Result card** (`src/components/ObjectCard.tsx`):

```
[TYPE CHIP]  canonical_id  [COPY]         [PROVENANCE BADGE]  [CONFIDENCE PIP]
Title
plain_language_summary (first 120 chars, truncated)
source display_name · version                               View →

```

Rules:

- `plain_language_summary` always renders. If missing: `[Plain-language summary not yet available]` in `--ca-text-subtle` italic. Never silently omit.
- Result count shown above list: `Showing 42 results`
- Mobile: filter drawer triggered by "Filter" button above results

### 3.3 `src/pages/ObjectDetailPage.tsx`

Route: `/library/:type/:id`

Page sections in order (non-negotiable):

```
[← Library]                                    [Copy link]

[TYPE CHIP]  canonical_id  [COPY]    [PROVENANCE BADGE]  [CONFIDENCE PIP]

Title (h1)

┌─────────────────────────────────────────────────────┐
│  What this means                                    │
│  plain_language_summary                             │
└─────────────────────────────────────────────────────┘

<details> Source text (collapsed by default)
  <summary>Show source text ↓</summary>
  formal description field
</details>

<hr class="ca-divider">

Related objects
  [ObjectCard compact] × n

<hr class="ca-divider">

What to do next
  Contextual links to templates, crosswalks, patterns

<hr class="ca-divider">

Source & provenance
  Source: {source display_name}
  Version: {version}   Last imported: {last_imported}

```

The `plain_language_summary` box gets a distinct background (`--ca-surface-raised`) with a left border `3px solid --ca-secondary`. This visually signals "this is the translation layer" vs the source text below.

If `plain_language_summary` is missing, render:

```
┌─────────────────────────────────────────────────────┐
│  ⚠ Plain-language summary not yet available         │
│  Source text is shown below.                        │
└─────────────────────────────────────────────────────┘

```

And auto-expand the source text `<details>` so users aren't left with an empty page.

### 3.4 `src/pages/TemplatesPage.tsx`

**Page header:**

```
Templates
Generate a blank template in three steps.
No data leaves your browser.

```

Three-step wizard. `src/components/StepIndicator.tsx` at top showing current step.

**Step 1 — Artifact type:**

Nine visual cards in a 3×3 grid. Each card: title + one-sentence description of what it produces. On selection: `ca-card--selected` class.

Card content:

```
Security Plan Starter
Blank SSP-style sections with implementation prompts

Evidence Expectation Matrix
Evidence types and artifact names by control

POA&M Starter
Blank weakness and milestone tracking table

STIG Evidence Checklist
Blank per-rule evidence tracking with check/fix summaries

Inheritance Worksheet
Provider / customer / shared responsibility prompts

Reciprocity Checklist
BoE review, boundary comparison, and AO decision prompts

Control Implementation Worksheet
Per-control implementation statement prompts

Assessment Planning Worksheet
Blank assessment scope and methodology planner

Continuous Monitoring Calendar
ConMon artifact cadence planning table

```

**Step 2 — Context (optional):**

Two fields. Both optional. Field 1: Framework. Field 2: Environment.

Framework `<select>` uses `<optgroup>` with display names only:

```html
<option value="">None / Generic (default)</option>
<optgroup label="NIST">
  <option value="nist-800-37">NIST 800-37 (RMF)</option>
  <option value="nist-800-53">NIST 800-53</option>
  <option value="nist-800-53a">NIST 800-53A</option>
  <option value="nist-800-53b">NIST 800-53B</option>
  <option value="nist-800-171">NIST 800-171</option>
  <option value="nist-800-171-rev2">NIST 800-171 Rev. 2</option>
  <option value="nist-800-172">NIST 800-172</option>
  <option value="nist-ai-rmf">NIST AI RMF</option>
  <option value="nist-ssdf">NIST SSDF</option>
  <option value="csf-2">NIST CSF 2.0</option>
</optgroup>
<optgroup label="DISA">
  <option value="disa-cci">DISA CCI</option>
  <option value="disa-srg">DISA SRG</option>
  <option value="disa-stig">DISA STIG</option>
</optgroup>
<optgroup label="DoD">
  <option value="dod-zt">DoD Zero Trust</option>
  <option value="dod-rai">DoD Responsible AI</option>
</optgroup>
<optgroup label="Other">
  <option value="cmmc-2">CMMC 2.0</option>
  <option value="fedramp-rev5">FedRAMP Rev. 5</option>
  <option value="fips-199">FIPS 199</option>
  <option value="fips-200">FIPS 200</option>
  <option value="cui-policy">CUI Policy</option>
</optgroup>

```

Environment: radio buttons (not select), with short description inline:

```
○ Generic
○ Cloud SaaS — software delivered over the internet, hosted by a provider
○ Platform Service — infrastructure or platform your system runs on
○ Enclave — isolated network or classified environment
○ On-Premises System — hardware and software you own and operate
○ Hybrid System — combination of cloud and on-premises
○ Enterprise Service — shared service used by multiple systems

```

**Step 3 — Options:**

Checkboxes with name + one-line description. Proper spacing between each (not a run-on list):

```
☑ Implementation Prompts
  Adds guided questions for describing how each control is implemented.

☑ Evidence Expectations
  Adds example artifact types and suggested review cadence per control.

☐ Inheritance Prompts
  Adds questions to identify controls inherited from a provider.

☐ Reciprocity Prompts
  Adds questions to reuse evidence from a prior authorization package.

☐ STIG References
  Links relevant STIG rules to each control row where mappings exist.

☐ Source Footnotes
  Adds public source citations to each template section.

☑ Placeholder Fields
  Fills blank prompt fields so you know what information belongs where.

```

Output format — horizontal radio buttons: `● Markdown ○ CSV ○ JSON ○ YAML`

Generate button: `<button class="ca-btn ca-btn--primary">Generate Template →</button>` full-width.

**Generated output:**

Renders in a `ca-code-block` below the form. No auto-download. User previews first.

Header row: `Preview · [Markdown ▾]` on left, `[Copy] [Download ↓]` on right.

Every generated template starts with:

```markdown
> **Reference only.** Generated by Control Atlas from public sources.
> Not an official government artifact. Does not constitute a completed
> authorization package. All decisions remain with the applicable AO,
> agency, or program office.
> Source: {framework display name or "None / Generic"} · {date} · Control Atlas {version}

```

### 3.5 `src/pages/CrosswalksPage.tsx`

Page header:

```
Crosswalks
See how frameworks, controls, and requirements connect.
Every mapping shows its source and confidence.

```

Four tabs: `STIG → CCI → NIST` · `Baseline Comparator` · `Full Relationship Table` · `Graph View`

**Tab 1: STIG → CCI → NIST**

Filter bar: STIG Source (grouped select, display names) · Confidence (High/Medium/Low/All) · Provenance (Official/Community/Inferred/All)

Table columns: STIG ID + title · CCI ID · Control ID + family · Provenance badge · Confidence pip

Export button: "Export visible rows →" → Markdown / CSV / JSON (export file includes provenance metadata header block)

**Tab 2: Baseline Comparator**

Two grouped selects side by side. After both selected, render three columns: In both · Only in A · Only in B. Source versions stated below. Export button.

**Tab 3: Full Relationship Table**

All edges from the edges runtime bundle. Columns: From · Relationship · To · Provenance · Confidence · Plain-language rationale

`plain_language_rationale` column: if missing, render `[Plain-language rationale not yet available]` in `--ca-text-subtle`. This makes translation gaps visible.

Filter bar: Relationship type · Provenance · Confidence · From type · To type

**Tab 4: Graph View**

See Part 4 below. Table View button always accessible.

### 3.6 `src/pages/ProvenancePage.tsx`

Page header:

```
Provenance
Why trust this mapping?
Every source used in Control Atlas — with version, status, and license.

```

Searchable table from the sources runtime bundle.

Columns: Name (links to source URL) · Class (ProvenanceBadge) · Status (active/deprecated badge) · Version · Last Checked · Parser Status · License

Deprecated rows: `opacity: 0.6` + ⚠ icon in Name column.

Filter: source class checkboxes.

### 3.7 `src/pages/PatternsPage.tsx`

Left sidebar nav (desktop) / accordion (mobile) with all pattern topics.

Each pattern page (`src/pages/PatternDetailPage.tsx`) follows strict structure:

```
[Pattern title]                    [Related templates →]

[First paragraph: plain language. No framework jargon in first sentence
 without an immediate parenthetical definition.]

─────

Where this breaks down
• [specific, practical failure mode]
• [specific, practical failure mode]

What good looks like
• [observable, actionable signal]
• [observable, actionable signal]

Do / Don't
┌────────────────────────┬────────────────────────┐
│ Do                     │ Don't                  │
│ · specific action      │ · specific mistake      │
└────────────────────────┴────────────────────────┘

Related controls  [AC-2 chip] [AC-3 chip] ...

Related templates  [→ Inheritance Worksheet] [→ Reciprocity Checklist]

Sources and limitations
[Plain text. Citations. Disclaimer.]

```

### 3.8 `src/pages/StartHerePage.tsx`

Page header:

```
Start Here
Not sure where to begin? Answer three questions.
You'll get a plain-language starting point — not a compliance decision.

```

Three-question flow. One question visible at a time. StepIndicator at top.

Q1: System type — 7 radio options with one-line descriptions Q2: Data sensitivity — 4 radio options Q3: Operational context — 5 radio options

Output (`src/components/StartHereResult.tsx`):

```
Based on your answers

You're likely working under: [framework display name]

Here's why:
[2–3 sentence plain-language rationale]

─────

Where to start

1. [Pattern page link with one-line description]
2. [Baseline comparison link]
3. [Template generation link with artifact type pre-selected]
4. [Library link to relevant framework controls]

─────

⚠ Reference recommendation only.
This is not a compliance determination. Your actual framework
requirements depend on your agency, AO, and authorization scope.

[Start over]                              [Go to Library →]

```

No data stored. No network call. Pure client-side derivation from three selections. No profile created.

---

## Part 4: Cytoscape Graph (`src/components/RelationshipGraph.tsx`)

### Implementation

Replace or wrap the existing D3 graph. Cytoscape + fcose is already installed (`cytoscape-fcose` in dependencies). Use it.

```tsx
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
cytoscape.use(fcose);

```

### Node Styles

One stylesheet entry per node type. Use `--ca-prov-*` values directly in JS (read from `getComputedStyle(document.documentElement).getPropertyValue('--ca-prov-nist').trim()`):


| Node type             | Shape           | Color source          |
| --------------------- | --------------- | --------------------- |
| control               | round-rectangle | `--ca-prov-nist`      |
| stig_rule             | hexagon         | `--ca-prov-disa`      |
| cci                   | diamond         | `--ca-prov-disa`      |
| baseline              | ellipse         | `--ca-prov-fedramp`   |
| attack_technique      | pentagon        | `--ca-prov-mitre`     |
| defend_countermeasure | tag             | `--ca-prov-mitre`     |
| source                | rectangle       | `--ca-prov-community` |


Label: `canonical_id`. Font: JetBrains Mono 10px. Color: `--ca-text`.

### Edge Styles

```
official / federal_published → solid, width 2, color --ca-prov-official
nist_published               → solid, width 2, color --ca-prov-nist
disa_published               → solid, width 2, color --ca-prov-disa
fedramp_published            → solid, width 2, color --ca-prov-fedramp
dod_published                → solid, width 2, color --ca-prov-dod
mitre_published              → solid, width 2, color --ca-prov-mitre
community_open_source        → dashed, width 1, color --ca-prov-community
inferred                     → dashed, width 1, color --ca-prov-inferred

```

Inferred edges always dashed. Edge width varies by confidence: high=2, medium=1.5, low=1.

### Filter Controls Panel (overlaid top-right)

```
Filter by provenance:
[×] Official  [×] NIST  [×] DISA  [×] FedRAMP  [×] MITRE  [×] DoD  [ ] Community  [ ] Inferred

Node type: [All ▾]
Confidence: [All ▾]

[Reset]    [Table View ↑]

```

Provenance filter chips use ProvenanceBadge styling. Toggle on/off hides/shows matching edges.

### Layout

- Crosswalk view (STIG→CCI→NIST): `dagre` layout (hierarchical, top-down) — install `cytoscape-dagre`
- Open relationship explorer: `fcose` (already installed)
- Do NOT use default Cose — produces hairballs at this data density

### Object-local graph

Every ObjectDetailPage has a "View in graph" button. Opens graph pre-filtered to that object and its first-degree neighbors only. This is the primary entry point. The full graph in Crosswalks tab is secondary.

### Table fallback

`src/components/RelationshipTable.tsx` — always available via "Table View" button. Renders same edge data as the graph. Ships before the graph. Table is not optional.

---

## Part 5: Data Display Contracts

### 5.1 `display_name` for Sources

All source records in the sources runtime bundle must include `display_name` and `display_group`. If they don't exist in the current bundle schema, add them to the normalization step.

Reference map (canonical):

```
cmmc-2          → CMMC 2.0              / Other
csf-2           → NIST CSF 2.0          / NIST
cui-policy      → CUI Policy            / Other
disa-cci        → DISA CCI              / DISA
disa-srg        → DISA SRG              / DISA
disa-stig       → DISA STIG             / DISA
dod-rai         → DoD Responsible AI    / DoD
dod-zt          → DoD Zero Trust        / DoD
fedramp-rev5    → FedRAMP Rev. 5        / Other
fips-199        → FIPS 199              / Other
fips-200        → FIPS 200              / Other
nist-800-171    → NIST 800-171          / NIST
nist-800-171-rev2 → NIST 800-171 Rev. 2 / NIST
nist-800-172    → NIST 800-172          / NIST
nist-800-37     → NIST 800-37 (RMF)    / NIST
nist-800-53     → NIST 800-53          / NIST
nist-800-53a    → NIST 800-53A         / NIST
nist-800-53b    → NIST 800-53B         / NIST
nist-ai-rmf     → NIST AI RMF          / NIST
nist-ssdf       → NIST SSDF            / NIST

```

Group display order in UI: NIST → DISA → DoD → Other. Within group: alphabetical.

### 5.2 `plain_language_summary` on Nodes

Every node must have a `plain_language_summary` field. Current status unknown from outside the repo — audit and populate. Priority order for populating:

1. NIST control family overviews (18 families — high leverage, one summary per family covers many controls)
2. Top 20 most-mapped NIST controls (AC-2, AC-3, AC-17, AU-2, AU-6, CM-6, IA-2, IA-5, IA-8, SC-7, SC-28, SI-2, etc.)
3. All FedRAMP baseline controls at Moderate
4. STIG rules — use the STIG title + check text summary as a starting point

For MVP, an empty `plain_language_summary` is acceptable IF the UI handles it gracefully (shows the warning state, auto-expands source text). Do not block launch on 100% population — but the warning state must render for every empty node.

---

## Part 6: SiteFooter

Three-column layout:

```
Control Atlas                  Navigation              Legal
The public map for             Start Here              Open-source (MIT)
federal cyber compliance.      Library                 Not an official
                               Crosswalks              government system.
Open-source. No login.         Patterns
Public data only.              Templates
                               Provenance

```

Footer bottom bar: `© Control Atlas contributors · Not an official government system · All mappings are reference aids based on public sources.`

---

## Acceptance Criteria

Done when every item below is true:

**Design system**

- [ ] `styles/tokens.css` contains the full token set above — zero hardcoded hex values anywhere in `src/` or `styles/`
- [ ] Space Grotesk, Public Sans, JetBrains Mono load and render correctly
- [ ] All six section pages route and render without errors

**Homepage**

- [ ] Rotating tagline: cycles through all 8 words, reduced-motion shows "Comply" statically, `aria-label` correct
- [ ] Pillar cards show practitioner question, not just section name
- [ ] All three CTAs navigate to correct routes

**Search**

- [ ] Opens from nav icon and Cmd+K / Ctrl+K
- [ ] Returns results from MiniSearch against nodes bundle
- [ ] Result cards show `plain_language_summary` (or warning if missing)
- [ ] Keyboard navigable; Escape closes

**Library**

- [ ] Filters work without page reload
- [ ] Result cards show `plain_language_summary` before any other content
- [ ] Object detail page: plain-language box renders first, source text collapsed by default
- [ ] Missing `plain_language_summary` triggers warning state + auto-expanded source text
- [ ] "What to do next" section present on every detail page
- [ ] Copy button works for canonical_id and page URL

**Templates**

- [ ] Step 1 renders as visual artifact-type cards, not a dropdown
- [ ] Framework dropdown groups by family with display names — zero raw source_id values
- [ ] Environment renders as radio buttons with inline descriptions
- [ ] Include Options: each checkbox has name + one-line description, proper visual separation
- [ ] Generate button produces output in inline preview block
- [ ] Generated output includes disclaimer block with source metadata
- [ ] Download works for Markdown and CSV

**Crosswalks**

- [ ] All four tabs functional
- [ ] `plain_language_rationale` renders in relationship table; missing values show warning
- [ ] Baseline comparator shows delta view with source versions stated
- [ ] Export produces files with provenance metadata

**Graph**

- [ ] Table fallback always accessible via button
- [ ] Edge colors use `--ca-prov-`* tokens with no hardcoded values
- [ ] All edges have text labels (not color alone)
- [ ] Provenance filter chips show/hide matching edges
- [ ] Object-local graph opens from ObjectDetailPage "View in graph" button
- [ ] Layout: `dagre` for crosswalk view, `fcose` for open explorer — never default Cose

**Provenance**

- [ ] All source records display `display_name`, not `source_id`
- [ ] Deprecated rows have visual warning and opacity reduction
- [ ] Source class filter works

**Start Here**

- [ ] Three questions, one visible at a time, StepIndicator shows progress
- [ ] Output is plain-language with actionable links
- [ ] No data stored or transmitted — purely client-side
- [ ] Output labeled as reference recommendation

**Global**

- [ ] No section intro restates the same fact in headline + subhead
- [ ] Privacy claim appears once per page, not per section
- [ ] All interactive elements keyboard reachable and have `:focus-visible` styles
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] Skip-to-main-content link is first focusable element
- [ ] Site footer present on all pages with disclaimer
- [ ] Mobile layout functional at 375px viewport

**Dependabot PRs**

- [ ] All 10 open Dependabot PRs reviewed and merged or closed before launch