# ADR 0004: Client-Side Template Generation Only

**Status:** Accepted

## Context

Blank templates are useful, but server-side generation or storage would create a user-data processing path.

## Decision

Future templates are generated and exported locally in the browser from static public/reference data. Generated content is not transmitted or stored.

## Consequences

Templates must remain blank/reference-only, carry source metadata and disclaimers, and require no user/org/system data.
