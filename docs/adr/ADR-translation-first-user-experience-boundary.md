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
