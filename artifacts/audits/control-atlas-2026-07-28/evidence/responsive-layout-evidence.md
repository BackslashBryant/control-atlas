# Responsive and layout evidence

## Page height and first-screen utility

Measurements are live rendered document/main heights and visual walkthrough observations, not design-token estimates.

| Surface | Desktop observation | Mobile 375px observation | Verdict |
|---|---|---|---|
| Home | Three equal cards precede Search; one-screen at roughly 944px | About 1,255px; Search below the three cards and below the initial viewport | Fail |
| Search AC-2 | Moderate density | About 2,545px | Needs consolidation |
| Explore AC-2 Map | Controls, Path/Map/List, filters, then neighborhood | About 3,206px | Fail |
| Catalog | Publisher-grouped wall about 2,545px | About 5,654px | Fail |
| AC-2 record | Large action/provenance/connection stack | About 4,535px | Fail |
| Compare | Five large intent cards; chosen intent does not progress | About 2,264px | Fail |
| Learn | 0 items, but substantial empty-product framing | About 2,104px | Fail |
| Build | Ten task cards before the useful document/resource depth | About 3,702px | Fail |
| Resources | Useful directory, but collections and filters create a long landing | About 5,318px | Fail |
| Sources | Sparse first screen and large footer | About 2,073px | Needs consolidation |

## Wasted-space and non-intuitive-layout findings

1. Home spends its highest-value area on three equal choices and rotating brand copy. Universal Search, the one action useful to the widest audience, appears later.
2. The shell repeats context, section label, route title, and page title in ways that consume height without improving orientation.
3. Catalog uses publisher as the page architecture. The result is a long series of cards with weak cross-publisher scanning and no first-screen inventory search.
4. Record pages allocate first-screen space to back/context buttons, action buttons, badges, and a large description card before a compact identity block. On mobile, actions can displace the official text entirely.
5. The AC-2 record repeats connection count, provenance class, source type, trust level, and “no rationale” language across group summaries, cards, and the advanced table.
6. Compare gives five large cards to modes that should behave as a compact task selector. The selected mode does not replace the selector with the next required input.
7. Build uses ten task cards as the primary page even though users may already know they need a starter document or an external resource.
8. Resources presents valuable material but makes users traverse purpose categories, starter collections, trust language, and filters before reaching a dense, scannable directory.
9. Sources devotes prominent space to explaining that Resources is elsewhere. A trust register should lead with source search, status, publisher, coverage, and currentness.
10. The footer is large and repeats boundaries already stated in About and page-level disclaimers.

## Responsive defects

- At 768 by 1024, focused Explore Map controls extended to approximately x=980 while the document client width was approximately 753. The filter grid and a candidate toggle were clipped/offscreen.
- At 375px, no document-level horizontal overflow was measured on the ten sampled canonical routes, but vertical stacking often moved the useful outcome several screens down.
- A cold mobile DE.AE-08 record showed the loading skeleton followed immediately by the footer before the record content arrived. After data load, the record inserted above it, producing a material layout shift.
- The mobile record’s three actions consume most of a viewport before source truth.
- Presentation changes at 768 hide the desktop navigation. A mobile menu implementation exists, but the combination of long pages and a dialog menu does not solve in-page orientation.

## Orbital Archive fit

The strongest Orbital decisions are structural lines, restrained color, and clear source/provenance accents. The weakest are decorative background geometry, oversized gaps, all-caps microcopy, rotating Ctrl+Alt slogans, and repeated framed panels. The target keeps architectural identity while removing decoration that competes with Signal-layer action and Mission-layer calm.

