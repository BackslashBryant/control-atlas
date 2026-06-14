# ADR 0005: Separate Relationship Type And Provenance Class

**Status:** Accepted

## Context

Control Atlas and Ctrl+Alt+Comply need user-facing provenance clarity. Relationship meaning and trust basis answer different questions and must not be conflated.

## Decision

`relationship_type` describes what a relationship means. `provenance_class` describes why it may be trusted. Confidence and evidence quality remain separate fields.

## Consequences

Validators and UI labels preserve all dimensions. Inferred candidates cannot appear as published relationships, and blocked relationships remain graph-health findings. Public product copy should refer to provenance consistently while preserving the underlying runtime contract.
