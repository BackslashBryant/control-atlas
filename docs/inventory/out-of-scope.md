# Deprecated/Out-of-Scope Capability Inventory

## Product Boundary

Control Atlas is static and public-data-only. No login is allowed. No backend is allowed. No user, organization, or system data is allowed.

## Capabilities That Must Not Be Implemented

- Backend services, databases, authentication, accounts, profiles, or saved workspaces
- User, organization, system, boundary, asset, package, finding, weakness, milestone, scan, or evidence data collection
- Evidence uploads, artifact uploads, or evidence ingestion
- SSP, SAR, SAP, POA&M, checklist, scan, package, or eMASS export ingestion
- ACAS, Nessus, Tenable, STIG Manager, SCC, eMASS, Xacta, Archer, ServiceNow GRC, or other operational integrations
- Compliance scoring, certification, authorization recommendations, or risk-acceptance decisions
- Real asset, finding, package, authorization, or continuous-monitoring status tracking
- Completed compliance-artifact generation from user data
- Server-side template generation, storage, or processing

## Deprecated Positioning To Remove From Active Surfaces

- GovFrame or Federal Integration Directory as the public product name
- “GRC platform” positioning
- “Evidence processor” positioning
- “Scan parser” positioning
- “Authorization decision” positioning
- Any wording that implies real package management, scoring, or official approval

## Allowed Reference-Safe Capabilities

- Public sources
- Public mappings
- Provenance-aware relationships
- Framework tracing
- Blank templates
- Client-side generation
- Reference recommendations
- No login
- No upload
- No org data
- No evidence processing

Historical documents may name prohibited concepts to explain prior work or the boundary. Runtime, config, README, roadmap, shell copy, and active implementation guidance must not present those capabilities as current or planned product behavior.
