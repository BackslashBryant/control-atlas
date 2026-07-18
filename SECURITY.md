# Security Policy

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating starter RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Product Security Boundary

Control Atlas is a static, public-data-only site. It has no backend, authentication, user upload, runtime user-data processing, or stored generated content.

Security-sensitive changes must preserve:

- Public and lawfully usable source inputs
- Build-time normalization and validation
- No user, organization, system, asset, package, finding, scan, or evidence data
- No operational-system connections
- No secrets in frontend assets
- No external transmission of generated template content

## Reporting

Report vulnerabilities privately through the repository owner's GitHub security-reporting channel. Do not include sensitive operational or personal data in an issue.

## Supported Version

The deployed `main` branch is the supported version.

## Supply Chain

Current, partial, and missing controls are tracked in `docs/SECDEVOPS_GAP_ANALYSIS.md`. Security controls should block release when they detect an unresolved high-impact issue.

Dependency audit policy is enforced by `npm run audit:deps`. Current approved exceptions are recorded in `security/npm-audit-exceptions.json` and must remain narrow, documented, and temporary.

## Framing Protection

Control Atlas deploys to GitHub Pages, which cannot set custom HTTP response headers, so the standard anti-framing defenses (`X-Frame-Options`, CSP `frame-ancestors`) are unavailable — and `frame-ancestors` is ignored when delivered via a `<meta>` CSP tag. As a best-effort mitigation, the app entry (`src/main.tsx`) runs a JavaScript frame-bust guard before any other work: when the site is embedded in another origin's frame it redirects the top-level window to itself, and if the embedder blocks that redirect (cross-origin `top` access throws) the document hides itself instead. This mitigation depends on JavaScript executing; a sandboxed frame without `allow-scripts` cannot run it, but such a frame also cannot render the app, which requires JavaScript to load.
