# ADR 0009: Provenance Registry Naming Over Source Registry

**Status:** Accepted

## Context

The product needs public-facing language that answers why a mapping should be trusted, not only where a record came from. The current repository and data file still use `source-registry` naming internally.

## Decision

Use **Provenance Registry** as the public-facing product name. Keep `data/source-registry.json` and related internal identifiers unchanged during Phase 0 for compatibility.

## Consequences

Docs, shell copy, and roadmap language should use Provenance Registry. Internal file renames are deferred until they can be done safely without breaking scripts, tests, or deployment.
