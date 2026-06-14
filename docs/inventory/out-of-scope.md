# Deprecated And Out-Of-Scope Capability Inventory

The following capabilities must not be implemented in Control Atlas:

- Backend services, databases, authentication, accounts, or saved workspaces
- User, organization, system, boundary, asset, package, finding, weakness, milestone, scan, or evidence data collection
- Evidence uploads or ingestion
- SSP, SAR, SAP, POA&M, checklist, scan, package, or eMASS export ingestion
- ACAS, Tenable, Nessus, STIG Manager, SCC, eMASS, Xacta, Archer, ServiceNow GRC, or other operational integrations
- Compliance scoring, certification, authorization recommendations, or risk-acceptance decisions
- Real asset, finding, package, authorization, or continuous-monitoring status tracking
- Completed compliance-artifact generation from user data
- Server-side template generation or storage

Historical documents may name these concepts to explain prior work or the boundary. Runtime/config surfaces must not implement them.

Blank/public-reference templates, evidence expectation references, public scan-format metadata, and public STIG/SRG/CCI references remain allowed when they require no user data and make no decision.
