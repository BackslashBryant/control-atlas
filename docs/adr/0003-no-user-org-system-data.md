# ADR 0003: No User, Organization, Or System Data

**Status:** Accepted

## Context

Collecting operational context would create privacy, security, workflow, and authorization-system responsibilities outside the product mission.

## Decision

Control Atlas collects and stores no user, organization, system, asset, package, finding, scan, or evidence data. It requires no login.

## Consequences

Saved workspaces, real status tracking, scoring, and organization-specific decisions are prohibited. Tests enforce the absence of upload and storage mechanisms.
