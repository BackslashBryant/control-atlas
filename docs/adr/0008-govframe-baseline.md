# ADR 0008: GovFrame Navigator As The Control Atlas Implementation Baseline

**Status:** Accepted

## Context

The v2.1 PRD adopts the existing GovFrame Navigator static JavaScript application, build-time public-data pipeline, and generated runtime contracts as the starting point for Control Atlas.

## Decision

Use the current GovFrame Navigator implementation as the baseline for Phase 0 and early product execution. Reuse the existing shell, runtime APIs, public-data importers, and generated graph artifacts unless a later ADR approves a targeted migration.

## Consequences

The repo can move forward without a framework rewrite or package rename. Historical GovFrame identifiers remain internally until a separate safe migration is justified.
