# ADR 0002: Public-Data-Only Product Boundary

**Status:** Accepted

## Context

The product must remain a trusted open reference rather than an operational compliance system.

## Decision

Control Atlas uses public, lawfully usable sources only. It does not ingest evidence, scans, packages, or operational exports and does not connect to operational systems.

## Consequences

Source access, provenance, version, and license/use metadata are mandatory. Restricted and user-provided data cannot enter runtime bundles.
