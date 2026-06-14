# ADR 0001: Static-First GitHub Pages Architecture

**Status:** Accepted

## Context

Control Atlas serves public reference data and browser-local exports. The existing repository already deploys a static application to GitHub Pages.

## Decision

Retain GitHub Pages and the static JavaScript application. Public data is prepared at build time and delivered as static bundles. No backend, database, or authentication is required for MVP.

## Consequences

Runtime capabilities must work from static assets. Features requiring server-side state or processing are out of scope.
