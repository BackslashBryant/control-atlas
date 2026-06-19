# EPIC: Control Atlas Clarity System and Translation-First UX Governance

## EPIC Summary

Control Atlas must be rebuilt around one clear product experience:

> **A public cyber compliance reference workspace that turns complex guidance into clear, traceable action.**

The current UI still feels too much like a database, registry, or graph explorer. That creates anxiety instead of clarity. This EPIC removes the **Novice/Expert Mode** model entirely, simplifies every primary workflow, introduces a reusable design/component system, and updates all planning and governance docs so future work cannot drift back into schema-first or jargon-first design.

This EPIC uses the prior research direction already captured in the attached planning notes: eliminate cognitive load, remove the novice/expert toggle, use progressive disclosure, simplify navigation, prefer single-column narrative flow, standardize labels, simplify templates, and update design docs so future developers preserve the same design intent. 

It also aligns with the repo’s broader software principles: KISS, DRY, YAGNI, SOLID, convention over configuration, composition over inheritance, and Law of Demeter. The governance layer should treat UX complexity the same way we treat code complexity: reduce it, centralize it, and stop repeating it. 

---

## Design Rationale

GOV.UK’s design principles are the strongest match for Control Atlas: start with user needs, do less, do the hard work to make it simple, build for inclusion, be consistent, and make things open. The “do the hard work to make it simple” principle is directly applicable here because Control Atlas sits on top of complex federal security sources, but the user should not have to feel that complexity first. ([GOV.UK][1])

USWDS provides the best federal-context model for this effort: it is a design system for the federal government, focused on accessible, mobile-friendly government sites, with reusable components, patterns, design tokens, utilities, and templates. It should strongly influence Control Atlas’ documentation and component taxonomy even if the repo does not directly adopt the USWDS package. ([U.S. Web Design System (USWDS)][2])

GoodUI’s practical patterns support the specific changes needed here: use one-column layout for narrative control, merge similar functions instead of fragmenting the UI, make selected/clickable states distinct, recommend useful paths instead of showing equal choices, reduce form fields, keep focus, use fewer borders, sell benefits over features, design for zero-data states, and maintain consistency. ([GoodUI][3])

WCAG 2.2 should be the baseline accessibility standard. Its guidance covers accessible content across devices and explicitly supports making web content more usable for people with disabilities and users in general. Control Atlas should treat accessibility, keyboard navigation, focus order, headings, labels, contrast, and target size as release gates, not polish items. ([W3C][4])

---

# EPIC Metadata

## Name

**Control Atlas Clarity System and Translation-First UX Governance**

## Type

Product / UX / Design System / Documentation Governance / Frontend Refactor

## Priority

**High**

## Status

Implemented in `main`; live Pages deploy parity pending re-verification

## Verification Status

- Local translation-first shell implementation is shipped in `main`.
- Local verification passed the full `npm run precommit` gate.
- Live GitHub Pages verification on June 19, 2026 found the public site still serving the older shell with `Crosswalks`, `Plain labels`, and `app/app.mjs`.
- Treat the epic as implemented in the repository and partially complete in public deployment until Pages serves the current shell.

## Primary Goal

Remove cognitive overload from Control Atlas and institutionalize a translation-first product standard across the UI, docs, templates, planning artifacts, and future work intake.

## Non-goals

* Do not add accounts.
* Do not add telemetry.
* Do not add backend services.
* Do not add evidence upload.
* Do not store user or organizational data.
* Do not remove source traceability.
* Do not remove the rotating `Ctrl+Alt+...` brand flourish.
* Do not replace the product identity.
* Do not turn Control Atlas into an official authorization decision engine.

---

# Product Decision

## Remove Novice/Expert Mode

The mode toggle must be removed.

A clear product should not require users to classify themselves before they can understand the interface. The correct model is:

```txt
One interface
Plain language by default
Technical details on demand
Source traceability always preserved
```

Do not replace Novice/Expert Mode with another toggle like:

* Plain / Technical
* Simple / Advanced
* Beginner / Practitioner
* Basic / Pro

Use contextual progressive disclosure instead.

---

# Open-Source Resource Strategy

The team should not hand-roll every component. Use mature open-source systems and assets where they reduce risk, improve accessibility, or speed up implementation.

## Recommended Resource Stack

| Need                       | Recommended resource    | Use for                         |
| -------------------------- | ----------------------- | ------------------------------- |
| Federal UX patterns        | USWDS                   | Docs, patterns, tokens          |
| Accessible primitives      | Radix Primitives        | Disclosure, dialog, popover     |
| Web components             | Spectrum Web Components | Framework-neutral UI            |
| Lightweight web components | Shoelace/Web Awesome    | Static-site compatible UI       |
| Icons                      | Tabler Icons            | General product icons           |
| Icons                      | Heroicons               | Simple action icons             |
| CSS utilities              | Tailwind CSS            | Optional token utility layer    |
| Inspiration                | Awwwards                | Visual polish references        |
| Pattern research           | Mobbin                  | Real-world UI flows             |
| Cloneable examples         | Webflow Showcase        | Layout inspiration              |
| UI experiments             | GoodUI                  | Conversion and clarity patterns |

## Resource Guidance

### Prefer USWDS for federal-facing interaction patterns

USWDS has the strongest domain fit because Control Atlas is a public federal cyber compliance tool. Use its component categories and documentation structure as a reference for breadcrumbs, cards, buttons, summary boxes, forms, search, side navigation, tags, tooltips, typography, tables, and validation. USWDS also includes design tokens and utilities, which should inform Control Atlas’ own token layer. ([U.S. Web Design System (USWDS)][2])

### Prefer Radix if the repo moves toward React components

Radix provides unstyled, accessible, open-source primitives for high-quality design systems. Its components include dialogs, dropdown menus, popovers, accordions, tabs, sliders, radio groups, and switches, with keyboard navigation, focus management, screen reader support, and WAI-ARIA alignment. This is valuable because the risky parts of UI are often accessibility and behavior, not visual styling. ([radix-ui.com][5])

### Prefer Spectrum Web Components or Shoelace/Web Awesome if staying framework-neutral

Spectrum Web Components are designed to work with any framework or no framework and emphasize accessibility, standards-based web components, and lightweight LitElement implementation. This is a strong option if Control Atlas remains a static GitHub Pages app and avoids a framework migration. ([opensource.adobe.com][6])

Shoelace is also framework-agnostic and customizable, with components like alerts, badges, breadcrumbs, buttons, cards, dialogs, drawers, details, dropdowns, inputs, menus, skeletons, tabs, tags, tooltips, and design tokens. Note that Shoelace states it is now sunset in favor of Web Awesome, so use it only if the team accepts that migration path. ([shoelace.style][7])

### Prefer Tabler Icons for the default icon set

Tabler Icons is open source, MIT licensed, has thousands of SVG icons, supports Figma, and uses a consistent 24x24 grid and stroke model. This is a better fit than mixing multiple icon families. ([Tabler][8])

Heroicons is also MIT licensed and useful for simple, polished interface actions, especially if the design leans toward Tailwind-style components. Use either Tabler or Heroicons, not both, unless there is a defined reason. ([Heroicons][9])

### Use Awwwards, Mobbin, and Webflow as inspiration, not dependencies

Awwwards is useful for visual inspiration across UI design, content architecture, navigation, typography, responsive design, and data visualization categories. It should inform polish, spacing, motion, and page rhythm, not drive gimmicky visuals. ([Awwwards][10])

Mobbin should be used for studying real-world product flows and component patterns. Webflow Showcase should be used for layout ideas and interaction inspiration. Neither should replace the product’s federal-reference mission. ([mobbin.com][11])

---

# Required Architecture Decision

## Decision

Control Atlas must have a **translation layer** between the data model and the user interface.

Internal terms are allowed in:

* source data
* graph artifacts
* tests
* exports
* developer tools
* advanced details

Internal terms are not allowed as the default user experience.

## Internal-to-user translation examples

| Internal term     | User-facing label |
| ----------------- | ----------------- |
| relationship_type | Connection        |
| provenance_class  | Source type       |
| confidence        | Trust level       |
| evidence_strength | Source support    |
| source_basis      | Source basis      |
| locator           | Source location   |
| object_type       | Item type         |
| maps_to           | Maps to           |
| included_in       | Included in       |

The important point is not the exact label. The important point is that labels must describe what the user can understand or do.

---

# Repository-Wide Governance Scope

This EPIC must update the current UI and the future-work machinery.

Codex must locate and update any equivalent files under:

```txt
README*
docs/**
prd/**
product/**
architecture/**
adr/**
roadmap/**
planning/**
design/**
ux/**
CONTRIBUTING*
.github/ISSUE_TEMPLATE/**
.github/PULL_REQUEST_TEMPLATE*
templates/**
```

If these folders do not exist, create the minimum needed structure.

---

# Required New Documentation

## 1. `docs/design/translation-first-design.md`

Purpose: permanent design doctrine.

Required sections:

```md
# Translation-First Design

## Principle

Build for translation, not complexity.

Control Atlas exists to reduce the distance between public cybersecurity guidance and clear user action.

## Required Page Questions

Every page must answer:

1. What am I looking at?
2. Why does it matter?
3. What connects?
4. Where did it come from?
5. How much should I trust it?
6. What should I do next?

## Forbidden Default UX

Do not lead with:

- raw schema fields
- relationship enum values
- source registry mechanics
- unexplained acronyms
- long ungrouped mappings
- equal-weight choices where one recommended path exists
- filters before intent
- tables before summaries

## Required Default UX

Lead with:

- plain-language summary
- user intent
- grouped relationships
- source trust summary
- clear next action
- collapsed advanced details

## Quality Gate

Would a real ISSO, ISSM, assessor, engineer, or compliance lead say this while trying to solve their problem?

If not, rewrite it.
```

---

## 2. `docs/design/content-style-guide.md`

Purpose: copy and labeling rules.

Required sections:

```md
# Content Style Guide

## Voice

Plain, direct, operational.

## Default Pattern

Every page, card, result, and detail view should answer:

1. What this is
2. Why it matters
3. What to do next

## Avoid

- architecture-first copy
- schema-first copy
- unexplained acronyms
- abstract noun stacks
- labels that sound like database columns
- “explore relationships” without context
- “confidence” without explaining how to act on it

## Prefer

- “This connects to...”
- “Use this when...”
- “This comes from...”
- “Review this before...”
- “Generate...”
- “Compare...”
- “Open official source...”

## Acronym Rule

Acronyms may appear when they are the searchable object, such as AC-2, CCI, STIG, SRG, RMF, or ATO. The first useful surrounding sentence must explain what the acronym means in user context.
```

---

## 3. `docs/design/design-system.md`

Purpose: reusable UI rules.

Required sections:

```md
# Control Atlas Design System

## Foundations

- Typography
- Color
- Spacing
- Elevation
- Radius
- Focus
- Motion
- Icons

## Components

- PageHeader
- SummaryCard
- ResultCard
- TrustBadge
- SourceSummary
- RelationshipGroup
- DisclosurePanel
- EmptyState
- LoadingState
- ErrorState
- Breadcrumbs
- NextActions
- FilterPanel
- IntentCard
- TemplateChoiceCard

## Layout Rules

- Use single-column narrative flow for reading-heavy pages.
- Use multi-column layouts only for scannable cards or comparisons.
- Keep related items close together.
- Keep unrelated sections visibly separated.
- Avoid dense tables as the first presentation of meaning.

## Disclosure Rules

- Use disclosure for raw metadata, long mappings, source mechanics, and advanced options.
- Do not hide primary user actions.
- Do not make users expand content to understand the page.
```

---

## 4. `docs/adr/ADR-translation-first-user-experience-boundary.md`

Purpose: permanent architectural decision.

Required content:

```md
# ADR: Translation-First User Experience Boundary

## Status

Accepted

## Context

Control Atlas uses structured public data, source registries, relationship metadata, provenance, confidence, evidence, and generated graph artifacts. These are required for correctness and traceability.

However, exposing these structures directly in the default UI increases cognitive load and makes the product feel like a database instead of a decision workspace.

## Decision

Control Atlas will maintain a strict boundary between internal data architecture and user-facing experience.

Internal model terms may exist in code, data, tests, exports, and advanced disclosures.

Default UI must translate those terms into plain user meaning.

## Consequences

- Components must render plain summaries before raw metadata.
- Detail pages must group relationships.
- Compare must begin with user intent, not catalog filters.
- Source trust must be summarized before source mechanics.
- Future architecture changes must include UX translation impact.
```

---

# Required Updates to Existing Planning Docs

Codex must update all PRDs, roadmap docs, architecture docs, future planning docs, and design notes to include this rule:

```md
## Translation-First Product Standard

Control Atlas is not a data explorer first. It is a public reference workbench that translates complex cybersecurity guidance into clear, traceable user action.

Future work must preserve this order:

1. User intent
2. Plain-language meaning
3. Visible relationships
4. Source trust
5. Recommended next action
6. Raw technical detail only on demand
```

Add this acceptance rule to roadmap and epic planning docs:

```md
No roadmap item may be accepted unless it identifies the user confusion it reduces and the action it enables.
```

---

# Required Issue and PR Template Updates

## Pull request template

Add:

```md
## Translation-First Review

- [ ] This change reduces user confusion or improves a clear user action.
- [ ] Default UI does not expose raw schema, enum, registry, or graph terms.
- [ ] Technical details are available only when useful and disclosed progressively.
- [ ] Page or component copy answers what this is, why it matters, and what to do next.
- [ ] Navigation, labels, and actions use consistent language.
- [ ] No novice/expert mode or split-personality UX was introduced.
- [ ] Accessibility and keyboard behavior were checked.
```

## Feature / chore / epic templates

Add:

```md
## User Clarity Requirement

What user confusion does this reduce?

## User Action Requirement

What action does this help the user take?

## Complexity Handling

What complexity is hidden, grouped, translated, or moved behind disclosure?

## Source Trust

How does the user know where the information came from and how much to trust it?
```

## ADR template

Add:

```md
## UX Translation Impact

How does this architecture decision affect what users see?

## User-Facing Boundary

Which technical concepts stay internal?

Which concepts must be translated?
```

---

# Application Deliverables

## Deliverable 1: Remove Novice/Expert Mode

### Tasks

* Remove the header toggle.
* Remove all mode state.
* Remove mode-specific labels.
* Remove any tests expecting the toggle.
* Remove docs that instruct future work to use novice/expert behavior.
* Replace with one canonical interface.
* Preserve technical details inside contextual `Advanced details` disclosures.

### Acceptance criteria

* No visible copy says “Novice Mode,” “Expert Mode,” “Plain labels,” or “Technical labels.”
* No duplicated label system remains.
* Technical values still exist where needed.
* User-facing UI has one stable language.

---

## Deliverable 2: Adopt Reusable UI Components Instead of Hand-Rolling Everything

### Preferred approach

Use **native HTML plus a small component layer first**. This keeps Control Atlas static, durable, and GitHub Pages friendly.

Use open-source libraries only where they save real effort:

* Disclosure panels
* Dialogs
* Popovers/tooltips
* Tabs
* Select/combobox
* Toasts/alerts
* Skeleton/loading states
* Icons
* Design tokens

### Recommended implementation hierarchy

1. **Native HTML/CSS where adequate**

   * `details`
   * `summary`
   * buttons
   * forms
   * headings
   * lists
   * semantic sections

2. **USWDS pattern references**

   * breadcrumbs
   * cards
   * summary boxes
   * search
   * forms
   * tags
   * tables
   * validation
   * typography

3. **Framework-neutral Web Components if needed**

   * Spectrum Web Components
   * Shoelace/Web Awesome

4. **Radix/shadcn only if the app is already moving to React**

   * Do not migrate to React just to use shadcn.
   * Do not introduce a framework migration inside this EPIC unless the repo already depends on it.

### Required component inventory

Create or refactor these reusable components:

```txt
PageHeader
SectionHeader
SummaryCard
ResultCard
IntentCard
TrustBadge
SourceSummary
RelationshipGroup
DisclosurePanel
AdvancedDetails
Breadcrumbs
NextActions
FilterPanel
EmptyState
LoadingState
ErrorState
TemplateChoiceCard
CopyButton
```

### Acceptance criteria

* No page has one-off markup for common cards, badges, disclosures, or empty states.
* Components are documented in `docs/design/design-system.md`.
* Components use shared tokens.
* Accessibility behavior is either native or backed by a proven component resource.

---

## Deliverable 3: Design Tokens

Create or normalize CSS tokens.

Required token groups:

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;

  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;

  --color-action: #example;
  --color-action-hover: #example;
  --color-surface: #example;
  --color-surface-raised: #example;
  --color-border: #example;
  --color-muted: #example;
  --color-warning: #example;
  --color-success: #example;
  --color-danger: #example;
  --color-info: #example;
}
```

Use existing brand colors where possible. Do not invent a full redesign if the current dark visual identity can be preserved.

### Acceptance criteria

* Common spacing, typography, badge, card, and button styles use tokens.
* Ad hoc margins and padding are reduced.
* UI density is visibly lower.
* Contrast remains accessible.

---

## Deliverable 4: Global Navigation and Orientation

### Required nav order

```txt
Start Here
Library
Compare
Patterns
Templates
Sources
```

Rename `Crosswalks` to `Compare` in the nav. The page may still explain that comparisons are based on public crosswalks.

### Required global behavior

* Logo links home.
* Active nav state is visually obvious.
* Each page begins with:

  * page title
  * one-sentence purpose
  * one primary action
* Detail pages include breadcrumbs.
* Detail pages include `Back to results` when entered from search.

### Acceptance criteria

* Navigation follows user intent, not internal product modules.
* Page purpose is clear within five seconds.
* No page begins with filters before explaining the task.

---

## Deliverable 5: Library Search Redesign

### Current pain

The Library risks feeling like a database query screen.

### New structure

```txt
Title
Purpose summary
Search input
Primary action
Refine results disclosure
Grouped results
Helpful empty state
```

### Required behavior

* Search is the dominant action.
* Filters are secondary under `Refine results`.
* Result cards show meaning before metadata.
* Results can group by item type:

  * Controls
  * CCIs
  * STIG/SRG items
  * Baselines
  * Sources
  * Patterns
  * Templates

### Required result card

```txt
Title
Item type
Plain summary
Primary source
Public connections count
Primary action
```

### Acceptance criteria

* User can search `AC-2` and know what to open next.
* Filters do not visually dominate the page.
* Empty state gives suggested searches and next steps.

---

## Deliverable 6: Detail Page Redesign

### Required page order

```txt
Breadcrumb
Title
Plain-language summary
Why it matters
Where it appears
What it connects to
Common evidence / common use
Source support
Next actions
Advanced details
```

### Required relationship grouping

Do not show raw mapping strings as the default.

Group into sections:

```txt
Baseline memberships
Assessment procedures
DISA CCIs
Related controls
Framework mappings
STIG/SRG references
MITRE references
Templates
Patterns
Other public mappings
```

### Required trust labels

Use:

```txt
Direct from official source
Derived from public mapping
Suggested by public data
Needs review before relying on it
```

### Advanced details

Collapsed by default.

May contain:

```txt
relationship_type
provenance_class
confidence
evidence_strength
source_basis
locator
retrieved
node_id
edge_id
source_id
```

### Acceptance criteria

* AC-2 detail page does not overwhelm the user on load.
* Raw mappings are available but not primary.
* Each detail page has at least two context-aware next actions.
* Page starts with meaning, not metadata.

---

## Deliverable 7: Compare Redesign

### Current pain

Crosswalks are filter-first and can lead to confusing zero-result states.

### New flow

Start with:

```txt
What do you want to compare?
```

Intent cards:

```txt
Framework to framework
Control to control
STIG/SRG to controls
Baseline to baseline
Find what maps to this item
```

After selection:

1. Show relevant inputs only.
2. Recommend common comparisons.
3. Show summary first.
4. Show mappings second.
5. Show raw details last.

### Empty state

Replace generic zero-result language with:

```txt
No public connections found for this comparison.

Try:
- changing one catalog
- removing connection filters
- searching for a specific control
- checking Sources to confirm whether this framework is included
```

### Acceptance criteria

* Compare page does not open with dropdown clutter.
* User sees a recommended path.
* Empty states reduce confusion.
* Raw mapping tables are not the first visible outcome.

---

## Deliverable 8: Sources Redesign

### Current pain

Sources page feels like a registry inventory.

### New source card

```txt
Source name
Plain description
Trust summary
Used in map: Yes/No
Status
Primary action: View source details
Secondary action: Open official source
```

### Source detail order

```txt
What this source is
How Control Atlas uses it
Trust and status
Official link
Known limits
Advanced metadata
```

### Acceptance criteria

* Badges are reduced.
* Warnings are grouped.
* Source trust is obvious.
* Metadata is not sprayed across the card.

---

## Deliverable 9: Templates Redesign

### Current pain

The template generator can become checkbox-heavy.

### New flow

Start with:

```txt
What are you trying to create?
```

Artifact cards:

```txt
Security Plan Starter
Evidence Matrix
POA&M Starter
Assessment Planning Worksheet
ConMon Calendar
Inheritance / Reciprocity Worksheet
STIG Checklist
```

After selection:

```txt
What this template is for
What it includes
Generate button
More options
```

### Acceptance criteria

* Template page starts with artifact choice, not settings.
* Optional checkboxes are hidden under `More options`.
* Generate action is obvious.

---

## Deliverable 10: Patterns Redesign

### Current direction

Rename patterns around outcomes, not abstract architecture language.

Examples:

```txt
Cloud Service Provider Inheritance -> Using FedRAMP Inheritance
Shared Responsibility Model -> What Your Cloud Provider Owns vs What You Own
Reciprocity -> Reusing Prior Authorization Work
Continuous Monitoring -> Keeping Authorization Evidence Current
```

### Pattern detail order

```txt
What this helps with
When to use it
How it works
Common mistakes
Related controls
Related templates
Source support
```

### Acceptance criteria

* Pattern names sound like user problems or outcomes.
* Each pattern gives a useful next action.
* Pattern cards are scannable and not metadata-heavy.

---

## Deliverable 11: Help and Glossary Refactor

### Purpose

The glossary should support clarity, not become another encyclopedia.

### Required term structure

```txt
Term
Plain definition
Why it matters
Related pages
Official source
```

### Rules

* Do not define internal schema terms unless they appear in Advanced details.
* Link glossary terms contextually.
* Keep definitions short.
* Use the same canonical labels as the UI.

### Acceptance criteria

* Glossary matches the new interface language.
* No stale novice/expert terminology remains.
* Glossary helps users act, not just learn terms.

---

# Quality Gates

## Static copy leak test

Add tests to fail if default rendered UI contains:

```txt
Novice Mode
Expert Mode
Plain labels
Technical labels
relationship_type
provenance_class
evidence_strength
source_basis
confidence: direct
federal_published
maps_to
object type
source class
```

These terms may exist in source data, code, tests, exports, and Advanced details. They must not appear in the default UI.

## Browser tests

Add Playwright or equivalent tests for:

```txt
Header has no mode toggle
Nav order is Start Here, Library, Compare, Patterns, Templates, Sources
Library search works
Filters are secondary
Detail page starts with what/why/next
Raw mappings are collapsed
Compare starts with intent cards
Compare empty state gives next steps
Source cards show trust summary
Templates start with artifact choice
Keyboard navigation reaches primary actions
Focus states are visible
Mobile layout remains readable
```

## Documentation governance tests

Add script or checklist validating that core docs include:

```txt
Build for translation, not complexity
translation-first
what this is
why it matters
what to do next
progressive disclosure
advanced details
source support
```

---

# Implementation Phases

## Phase 1: Governance first

* Add translation-first doctrine.
* Add content style guide.
* Add design-system doc.
* Add ADR.
* Update README, PRD, roadmap, architecture docs, and planning docs.
* Update issue and PR templates.

## Phase 2: Remove mode system

* Delete toggle.
* Delete mode state.
* Delete conditional labels.
* Replace with canonical labels.
* Update tests.

## Phase 3: Design system foundation

* Add tokens.
* Normalize buttons, cards, badges, disclosures, breadcrumbs, and empty states.
* Select icon library.
* Decide whether to use native components, USWDS references, Spectrum Web Components, or another library.

## Phase 4: High-anxiety page redesign

Order:

1. Detail pages
2. Compare
3. Sources
4. Templates
5. Library
6. Patterns
7. Help / Glossary

## Phase 5: Regression hardening

* Add copy leak tests.
* Add accessibility tests.
* Add browser flow tests.
* Add docs governance checks.
* Run full precommit/build suite.
* Bump cache strings if static assets require it.

---

# Recommended Open-Source Asset and Component Decisions

## Strong recommendation

Use **Tabler Icons** as the default icon system.

Reason: large set, open source, MIT license, consistent stroke, Figma support, and broad enough to cover source, trust, compare, template, warning, copy, search, and navigation icons. ([Tabler][8])

## Strong recommendation

Use **USWDS as the reference model**, not necessarily the installed dependency.

Reason: Control Atlas is federal-adjacent, public-sector-oriented, static, and documentation-heavy. USWDS gives the right taxonomy for components, patterns, tokens, and accessibility expectations. ([U.S. Web Design System (USWDS)][2])

## Conditional recommendation

Use **Spectrum Web Components** if the team wants ready-made framework-neutral components.

Reason: works with any framework or without one, is accessibility-minded, and provides buttons, breadcrumbs, cards, dialogs, menus, search, status lights, tabs, tags, text fields, tooltips, and more. ([opensource.adobe.com][6])

## Conditional recommendation

Use **Radix Primitives** only if the app is already moving to React.

Reason: excellent accessible primitives, but adopting it solely for this EPIC may trigger unnecessary framework migration. ([radix-ui.com][5])

## Avoid as default

Do not adopt a heavy visual framework just to make the site look modern. The issue is not lack of decoration. The issue is decision density, weak hierarchy, and exposed internal complexity.

---

# EPIC Acceptance Criteria

This EPIC is complete when:

1. Novice/Expert Mode is removed.
2. One clear interface remains.
3. Every page starts with user meaning.
4. No primary page defaults to raw schema, registry, or graph language.
5. Detail pages group relationships and collapse raw mappings.
6. Compare is intent-first.
7. Sources are trust-first.
8. Templates are artifact-first.
9. Library is search-first.
10. Patterns are outcome-first.
11. Help/Glossary supports the page instead of adding clutter.
12. Design tokens exist and are used.
13. Reusable component patterns exist.
14. Open-source resources are selected and documented.
15. README, PRD, roadmap, architecture docs, ADRs, contribution docs, issue templates, PR templates, and future planning docs enforce translation-first design.
16. Tests prevent mode regressions and schema-language leakage.
17. Accessibility checks pass.
18. Static deployment cache strings are bumped if needed.
19. The full validation suite passes.

---

# Definition of Done

Control Atlas no longer feels like a graph database with a polished skin.

It feels like a guided public cyber compliance reference workspace.

A user can land on any page and immediately understand:

* What this is
* Why it matters
* What connects
* Where it came from
* How much to trust it
* What to do next

Future epics, features, chores, ADRs, and planning docs must preserve that standard by default.

[1]: https://www.gov.uk/guidance/government-design-principles "Government Design Principles - GOV.UK"
[2]: https://designsystem.digital.gov/ "USWDS: The United States Web Design System | U.S. Web Design System (USWDS)"
[3]: https://goodui.org/ "
              GoodUI ideas and A/B tested patterns for higher conversion rates and growth            | GoodUI
    "
[4]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[5]: https://www.radix-ui.com/primitives "Radix Primitives"
[6]: https://opensource.adobe.com/spectrum-web-components/ "Spectrum Web Components"
[7]: https://shoelace.style/ "Shoelace: A forward-thinking library of web components."
[8]: https://tabler.io/icons "Tabler Icons: 6100+ free vector icons for web design"
[9]: https://heroicons.com/ "Heroicons"
[10]: https://www.awwwards.com/websites/ "Winning websites. Web Design Inspiration - Awwwards"
[11]: https://mobbin.com/ "Mobbin — UI & UX design inspiration for mobile & web apps"
