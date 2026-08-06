# Proposed React Router advisory exception

Status: **not accepted**. Owner approval is required before adding this to
`security/npm-audit-exceptions.json`.

`npm audit` reports GHSA-qwww-vcr4-c8h2 for `react-router` 7.18.0. The
advisory applies to React Server Components action handling. Control Atlas is a
static, hash-routed client SPA: its only `react-router-dom` use is browser
navigation in `src/ui/App.tsx`; it has no server renderer, route actions, RSC
entry point, or request handler. That makes the reported attack path
unreachable in this deployment.

The offered automated remediation downgrades the direct dependency from 7.18.0
to 7.11.0. Do not apply that downgrade as a security fix.

Proposed expiry: **2026-10-24**. At or before that date, re-run `npm audit`,
confirm the app remains static-only, and either upgrade to a non-affected
release or seek a renewed owner decision. This note is evidence for that
decision, not an approved exception.
