# Control Atlas interaction overhaul

## Outcome

Every click must either reveal useful information, change the user's working context, or complete an action. Navigation must not be used to compensate for an empty preview.

## Primary journey map

| User goal | Current path | Friction | Required behavior |
| --- | --- | --- | --- |
| Decide where to begin | Home -> Start Here -> questions -> recommendation | The current landing page hides the three established entry paths under a disclosure and removes the product's recognizable orbital navigation. | Restore the orbital actions as visible task choices. Keep Start Here in the center and do not add an entrance gate. |
| Find a known record | Home/header search -> results -> record | Search is a useful direct path. | Preserve it and keep the full result row actionable. |
| Understand a relationship | Record -> Atlas -> group -> related item -> inspector -> full record | The selected-item inspector repeats identifiers and generic instructions. The fourth click is required to learn what the item says. | Selecting a related item reveals its real synopsis, action text, relationship rationale, and source basis in place. |
| Continue exploring from a related record | Atlas -> related item | The current primary action leaves the map for a detail page. | Provide an in-place `Explore from this record` action that refocuses the map. Keep full record and source links secondary. |
| Understand what to do | Playbooks -> guide | Abstract headings and guidance make the user translate the product's model into work. | Use task outcomes, `Use this when`, `What to do`, `What to avoid`, and specific destination labels. |
| Create working material | Templates -> choose document -> configure -> download | Requires a separate rendered review in the next milestone. | Measure choice count, clarify the document outcome, and keep one primary creation action per step. |
| Compare records | Compare -> configure -> results -> evidence/record | Dense controls and result modes require a separate rendered review in the next milestone. | Start from a comparison question, defer advanced controls, and summarize before detail. |

## Milestone 1

1. Restore the orbital landing navigation using plain task labels.
2. Restore the rotating `[Ctrl] + [Alt] + [Flourish]` brand signature.
3. Keep Start Here as the center action; no blocking intro overlay or click-to-enter step.
4. Replace the Atlas generic inspector with an in-place record brief.
5. Let the user refocus the map on the selected record without leaving the Atlas.
6. Keep the full record and source material available as secondary actions.
7. Replace page-specific header offsets and unsafe `scrollIntoView` calls with shared header-aware navigation behavior.
8. Ship the task-first Playbooks copy already prepared on this branch.

## Acceptance criteria

- The landing page shows Start Here plus three visible orbital task buttons without opening a disclosure.
- The landing and persistent header show `[Ctrl] + [Alt] +` a rotating task word; reduced-motion users see a stable word.
- Each orbital button states the outcome of selecting it and has a 44 by 44 CSS-pixel minimum target.
- The orbital layout becomes a single-column sequence on narrow screens without horizontal overflow.
- Selecting an Atlas related item updates the inspector on the same page.
- A selected Atlas item displays its human-readable type, identifier, non-duplicate title when available, record synopsis, relationship rationale, and source basis.
- The inspector does not show generic `What to do next` copy in place of available record content.
- `Explore from this record` refocuses the Atlas on the selected item and clears the previous group and selection.
- `Open full record` and `View source` remain available but are not required to understand the selected item.
- Programmatic jumps in Atlas, Compare, Templates, record details, and page jump navigation stop below the visible site header.
- Sticky sidebars and filter bars use the same shared header-safe offset token.
- Selection is exposed with `aria-pressed`, the updated brief is announced as a live region, and all actions remain keyboard reachable.
- Existing search, Path, Map, List, filters, and deep links continue to work.

## Evidence standard

- Fast contract, unit, type, and lint checks are the inner loop.
- Final proof includes a production build, focused Playwright journeys at desktop and mobile widths, keyboard selection, and automated accessibility checks.
- No deployment, merge, or publication occurs without fresh approval.

## Whole-product coverage matrix

| Surface | Main user task | Highest-friction default state | Overhaul status |
| --- | --- | --- | --- |
| Home | Choose a useful starting path | Recognizable orbit and brand flourish had been removed. | Restored; desktop, compact, motion, and reduced-motion coverage required. |
| Start Here | Get one recommended path | Three questions and a repeated instructional empty state appeared at once. | One question at a time; prior answers remain visible and editable; recommendation remains one explicit action. |
| Search | Find a known record or topic | Six filters competed with results; a connection-data switch sat outside refinement. | Search stays primary; all optional narrowing, including connection status, is under `Refine results`. |
| Record detail | Understand and act on one record | Repeated metadata and peer actions obscured the synopsis and connections. | Synopsis first; Atlas is primary when connections exist; compare/copy are secondary; advanced metadata stays collapsed. |
| Atlas Path | Choose the relationship stage to inspect | Earlier board dumped all stages and records. | Stage choice first; records disclosed only after a stage is chosen. |
| Atlas Map/List | Understand a selected connected record | Selection showed generic advice and required leaving Atlas for meaning. | Real record brief opens in place; refocus action continues exploration without leaving Atlas. |
| Compare hub | Choose a comparison | The framework form appeared before the user chose a comparison question. | Four task cards first; only the chosen workbench is shown. |
| Compare setup/results | Reconcile two scopes | Optional item and advanced relationship controls appeared alongside the two required choices. | Two required selectors first; item/type/source/trust/inferred controls are collapsed; results render without a separate scroll CTA. |
| Playbooks | Follow task guidance | Abstract model language required translation. | Task name, use case, actions, avoidances, and specific next destination. |
| Templates hub | Produce a working document | Ten equal-weight, paragraph-heavy task cards appeared at once. | Four common tasks first; six additional tasks are progressively disclosed. |
| Template task/detail | Choose and download the right starter | Method, documents, official sources, tools, and page index competed before creation. | Selected task hides the catalog; recommended starter is primary; process is optional; sources and tools share one supporting disclosure. |
| Sources hub | Judge source trust | A 45-source catalog, filters, two inventories, and an `On this page` sidebar competed. | Search leads; source groups start collapsed; query matches render directly; filters and inventories remain optional; sidebar removed. |
| Source detail | Verify one source | Risk of losing context when opening a catalog card. | Opens on the same route with usage, trust, official-source action, and advanced metadata in place. |
| About/trust | Understand product boundaries | Multiple truths could compete with the next action. | Product purpose, limits, disclaimer, then one primary guided-start action. |
| Loading/error/empty | Recover or continue | Loading copy and recovery affordances vary by route. | Final state pass must normalize messages, recovery actions, focus, and duration behavior. |
| Global header/menu/footer | Know where you are and move predictably | Group labels and persistent header can hide destination meaning or cover jumped content. | Active section and header-safe offsets implemented; final mobile and keyboard audit remains. |

## Completion gate

The overhaul is not complete until every row above has a loaded desktop and compact rendered check, a keyboard path, no document-level horizontal overflow, no header-covered target, and no critical or serious automated accessibility finding. Loading, empty, no-result, missing-record, and unavailable-data states must each explain what happened and give a useful next action.
