# Architecture

GovFrame is a static evidence-led framework mapper.

## Build Flow

1. Independent source adapters normalize source-specific framework records and assertions.
2. The reconciliation engine publishes assertions with non-conflicting gold evidence.
3. The path engine builds cycle-free calculated paths of at most three hops.
4. The build emits static generated catalogs, mappings, paths, evidence, and coverage.
5. The browser runtime queries those validated artifacts without a backend.

## Core Contracts

- Framework
- FrameworkItem
- MappingAssertion
- MappingEvidence
- CalculatedPath
- CoverageReport

Relationship types are `equivalent_to`, `maps_to`, `implements`, `supports`, `includes`, `inherits`, and `related_to`. Context-only `related_to` edges are excluded from calculated paths.
