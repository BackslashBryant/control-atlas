# Content Style Guide

Build for translation, not complexity.

Write for the newcomer first. Put technical detail on demand.

## Voice

Calm, direct, grounded, and task-focused. Sound like a useful public reference,
not a campaign, institution, or software architecture diagram.

## Page copy

- Give each major page one useful task sentence.
- Use sentence capitalization for sentence-like headlines and Title Case for
  section labels.
- Do not use institutional “we.”
- Use source-native nouns such as control, requirement, technique, practice, or
  procedure. Use record only as an umbrella term.
- Name a map, publisher, source, provenance, or mapping only when it is the real
  feature, fact, or relationship being shown.
- Use the Atlas metaphor literally. Do not use landscape, drill in, drill down,
  navigate the terrain, or similar metaphorical prose.
- Make product claims about research only. Never imply that Control Atlas proves
  or achieves compliance, authorization, or security.

## Actions and states

Use specific actions: `Open record`, `Clear filters`, `Download document`,
`View official source`, and `See connections`.

Errors and empty states should say what happened and give the next useful action:

- `Record not found. Try another identifier or keyword.`
- `Nothing matches these filters. Clear one and try again.`

## Record presentation

- Title records as publisher + source-native family or category + official
  identifier: `NIST AC-2`, `NIST AC 3.1.1`, `MITRE Initial Access T1195.002`,
  or `DISA Policy CCI-000001`.
- Show the publisher-authored name beneath the identity when it adds information.
  Omit it when it only repeats the identifier.
- Lead with the complete publisher text. Preserve its meaning and wording; only
  normalize safe whitespace, lists, sections, and parameters.
- Use type-specific source headings: `Control Statement`, `Requirement`,
  `Discussion`, `Check`, `Fix`, `Technique Description`, or
  `Assessment Procedure`.
- Never derive a record name from body text.
- Never manufacture generic explanation, implementation advice, or action copy.
  Interpretation may appear only from a separately authored and reviewed field.
- Put classification and publication facts under `About This Record`.
- Render `Crosswalks` only when formal crosswalk records exist.

## Source and classification truth

- Publisher text is authoritative and remains unchanged.
- Product-authored interpretation must be visibly separate from publisher text.
- Classification tags are neutral. Area uses only its small colored dot outside
  the Atlas map.
- Explain derived category tags accessibly: `Referenced category.` or
  `Inferred category.`
- Keep detailed publication status and provenance on the Sources route.

## Acronyms

Acronyms may remain compact when users search by them. Provide the meaning through
an accessible hover, focus, and tap tooltip. Do not force expanded forms into
headlines when the acronym is the clearer identifier.

## Avoid

- architecture-first or schema-first narration
- slogans, brochure cadence, and abstract noun stacks
- labels that sound like database columns
- unexplained acronyms
- generic advice or placeholder summaries
- repeated claims about sources, publishers, maps, or mappings
