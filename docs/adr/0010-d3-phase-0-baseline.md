# ADR 0010: Reuse The Existing D3 Graph Engine For Phase 0

**Status:** Accepted

## Context

The current runtime already has a working D3-based relationship visualization foundation. The PRD allows future graph-library evaluation, but Phase 0 is focused on alignment and provenance-facing hardening.

## Decision

Reuse the existing D3 graph engine for Phase 0. Defer Cytoscape.js or any other graph-library migration until there is a concrete scale, accessibility, or maintenance reason supported by a separate plan.

## Consequences

Phase 0 shell and provenance work can proceed without destabilizing the runtime. Future graph-library changes must prove clear value over the existing D3 baseline.
