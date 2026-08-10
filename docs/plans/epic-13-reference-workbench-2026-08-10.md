# Epic 13: Federal Cybersecurity Reference and Workbench

**Status:** Shipped

## Outcome

Control Atlas becomes the place practitioners go when they need to figure out
federal cybersecurity. The homepage explains that job immediately; Resources
is a first-class destination; the Atlas uses a compact, aggregated ecosystem
view with a persistent explanation workbench; and runtime failures remain
isolated to the data or route that failed.

The approved homepage definition is:

> Control Atlas brings the federal cybersecurity landscape together in one
> place—requirements, frameworks, controls, mappings, official guidance,
> tools, and practitioner resources—so you can see what applies, understand
> how it connects, and get to the next step faster.

## Constraints

- Static GitHub Pages application; no backend, login, upload, or user data.
- Official source structure remains distinct from Control Atlas organization,
  published mappings, and practitioner resources.
- No full-corpus graph or unreadably scaled node field.
- Atlas selection explains; drill changes scope; zoom changes aggregation.
- Essential meaning is never hover-only and every graph retains a semantic
  tree/list alternative.
- Resources remains separate from official publications while still appearing
  in universal search.
- No new graph dependency. Use the installed React Flow and `d3-hierarchy`
  stack as recorded in ADR 0015.

## Milestones

### 1. Runtime resilience and Epic 12 cleanup

- Replace unbounded artifact and worker waits with abortable deadlines.
- Evict rejected or abandoned cache entries so Retry makes a fresh attempt.
- Isolate optional artifacts from route-critical artifacts.
- Add route and app error boundaries that preserve global navigation.
- Contain dynamic import failures and allow a fresh retry.
- Verify gzip failure, fallback failure, timeout, invalid JSON, worker failure,
  render failure, route change during load, and retry success.
- Retire the untracked Epic 12 QA report after preserving its still-actionable
  findings here and in automated coverage.

### 2. First-class Resources and product navigation

- Restore `#/resources` and `#/resources/:id` as canonical routes.
- Primary navigation becomes Atlas, Library, Resources, and Guides.
- Utility navigation remains Search, Sources, and About.
- Keep compatible redirects from the temporary Library resource routes.
- Link Tools and communities directly from the homepage.

### 3. Homepage front door

- Lead with the approved product definition and an action-oriented headline.
- Keep Start with your work and universal search in the first viewport.
- Use a real, build-generated Atlas preview instead of an empty hero column.
- Replace seven equal task cards with four product entrances: Atlas, Library,
  Start the work, and Tools and communities.
- Show one connected source-to-action example and a compact trust boundary.
- Generate the static and hydrated homepage from one shared content contract.

### 4. Aggregated Atlas workbench

- Overview shows aggregated authority roots, the Cybersecurity trunk, and the
  nine areas using the actual generated spine counts.
- Dense branches aggregate before text or nodes become unreadable. A bubble,
  band, or compact cluster may encode density where useful; no single marker
  shape is mandatory.
- Area scope shows publisher/publication groups while siblings collapse to
  compact context.
- Publication scope preserves publisher-native families, benchmarks,
  functions, tactics, or groups.
- Record scope shows the selected record, parent/sibling context, bounded
  mappings, and source truth.
- Desktop uses a stable map/inspector split. Mobile uses the semantic tree plus
  an accessible selected-item sheet below the map.

## Acceptance criteria

1. The homepage communicates the product definition, primary action, search,
   and four entrances without requiring a scroll at 1440x900.
2. No reserved empty hero track or implied empty card slot exists at supported
   breakpoints.
3. Resources is reachable from global navigation and Home in one interaction.
4. The ecosystem overview is legible without shrinking essential labels below
   12 CSS pixels and uses at least 80 percent of the available map region.
5. Selecting any visible Atlas node populates the inspector without changing
   scope; drilling updates the URL, breadcrumb, and browser history.
6. Back, Forward, reload, copied URLs, keyboard navigation, touch, reduced
   motion, and 200 percent zoom retain the same meaning.
7. No single route data, worker, module, or render failure blanks the global
   application shell.
8. Every tested failure state offers an honest, bounded recovery action.
9. `npm run precommit`, focused E2E, accessibility, fresh-checkout, CI, and live
   Pages verification pass at the exact shipped commit.

## Rollback

Each milestone ships as a coherent commit. Resources retains compatibility
redirects; the prior homepage remains recoverable by reverting its commit; and
the Atlas aggregation layer consumes the unchanged generated spine, so its UI
can be reverted without changing source data or canonical relationships.
