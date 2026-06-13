# Federal Sources and Evidence

`docs/FEDERAL_SOURCE_POLICY.md` is the canonical inclusion and exclusion policy. Issue 9 replaced the registry and generated contracts with the federal source, node, edge, evidence, and graph-health contracts defined in the architecture.

## Federal Provenance

Federal provenance is the primary user-facing trust model.

| Provenance class | Meaning |
| --- | --- |
| `mandated` | Required by federal law, regulation, policy, directive, contract clause, or authorization process |
| `federal_published` | Published by a U.S. federal entity |
| `federal_program` | Used by a federal program such as RMF, FedRAMP, CMMC, SCAP, NCP, or KEV |
| `federal_utilized` | Used in federal or federally sponsored cyber operations |
| `federal_referenced` | Non-federal content included only through an official federal reference |
| `inferred` | GovFrame-created edge candidate from transparent rules; never a source class |

`excluded` is an eligibility/status value, not a provenance class.

## Relationship Publication

Every displayable relationship must include:

- Semantic `relationship_type`.
- Federal `provenance_class`.
- Confidence.
- One or more evidence references.
- Display label and warning where needed.

Federal-published relationships and inferred candidates remain separate. Blocked relationships are recorded in `graph-health` and are never displayable graph edges.

## Evidence Quality

Evidence quality describes support for a claim, not federal provenance. The Issue 9 graph contract uses `primary`, `corroborating`, `contextual`, and `candidate`; legacy tier values are not part of the active contract.

## Release 1 Sources

Release 1 establishes:

- FIPS 199 categorization context.
- FIPS 200 minimum requirement context.
- NIST SP 800-37 Rev. 2 RMF lifecycle context.
- NIST SP 800-53 Rev. 5 controls and enhancements.
- NIST SP 800-53B baselines.
- NIST SP 800-53A Rev. 5 assessment objectives and procedures.
- OSCAL artifacts used to represent federal control, baseline, implementation, and assessment content.

Source versions, URLs, public access, licenses, and artifact availability must be revalidated against official sources during importer implementation.

## Lawful Access Boundary

- Import only public official releases or committed artifacts with documented provenance.
- Do not scrape around authentication.
- Do not redistribute restricted standards or source text without redistribution rights.
- Store references and metadata instead of restricted text where necessary.
