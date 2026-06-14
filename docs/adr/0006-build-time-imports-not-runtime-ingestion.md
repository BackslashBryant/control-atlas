# ADR 0006: Build-Time Public Imports, Not Runtime Ingestion

**Status:** Accepted

## Context

Public sources need normalization and validation, while runtime ingestion would violate the product boundary.

## Decision

Approved public sources are imported, normalized, validated, and related at build time. The browser reads validated static bundles only.

## Consequences

Runtime upload, parsing, write APIs, and operational integrations are prohibited. Importers must be reproducible and fail closed on invalid or non-public data.
