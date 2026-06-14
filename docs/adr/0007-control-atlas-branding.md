# ADR 0007: Control Atlas Branding With Legacy GovFrame Identifiers

**Status:** Accepted

## Context

The public product direction changed to Control Atlas, while the existing repository, deployment URL, package name, and internal references use GovFrame.

## Decision

Use **Control Atlas** and **Public maps and templates for federal cyber compliance** in public-facing copy. Retain GovFrame as a legacy repository/internal/deployment identifier until a separately approved migration.

## Consequences

Avoid risky bulk renames. Future rename work must account for paths, imports, tests, workflows, links, and Pages deployment.
