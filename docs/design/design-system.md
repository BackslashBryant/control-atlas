# Control Atlas Design System

Build for translation, not complexity.

## Foundations

- Typography: Space Grotesk for display, Public Sans for body, JetBrains Mono for identifiers and the rotating flourish.
- Color: preserve the dark cartographic atlas identity, keep blue for primary action, teal for supporting emphasis, and reserve warning colors for risk or review states.
- Spacing: use shared spacing tokens and increase separation between unrelated sections.
- Elevation: use raised cards to separate tasks, summaries, and advanced disclosures.
- Radius: use medium and large radii for cards, inputs, and intent buttons.
- Focus: visible focus rings are a release gate, not an optional enhancement.
- Motion: use light motion for feedback and the brand flourish only; respect reduced-motion settings.
- Icons: use one consistent icon family and keep icon meaning obvious.

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
- CopyButton

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
