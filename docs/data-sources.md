# Data Sources And Evidence

`data/source-registry.json` is the source policy contract.

- Gold sources are official issuing-authority artifacts and decide canonical truth.
- Silver sources are credible maintained crosswalks or alternate representations.
- Bronze sources support discovery and corroboration.
- Gold-supported claims may publish with visible silver or bronze evidence gaps.
- Missing or conflicting gold evidence blocks a mapping.

Every published assertion records a source artifact, locator, snapshot date, agreement status, and evidence gaps.

## Catalog Scope

- NIST SP 800-53 Rev. 5, NIST SP 800-171 Rev. 3, NIST CSF 2.0, NIST AI RMF Playbook, NIST SSDF tasks, and DISA CCIs are normalized from official machine-readable artifacts.
- FedRAMP publishes four official Rev. 5 baseline identities. GovFrame does not claim that these identities are complete baseline control profiles.
- CMMC publishes the three official program levels from 32 CFR 170.14. GovFrame does not substitute NIST SP 800-171 Rev. 3 for CMMC Level 2's referenced Revision 2 requirements.
- DoD RAI publishes the eleven publicly described toolkit focus principles and SHIELD activities.
- Items remain searchable even when no gold-supported direct mapping exists.

## CCI Source Contract

Control Correlation Identifiers are imported from the official DISA CCI List as their own complete catalog. CCI-to-NIST SP 800-53 Revision 5 mappings are derived from references inside that list. STIG catalogs are neither required for those mappings nor treated as a synonym for CCI.
