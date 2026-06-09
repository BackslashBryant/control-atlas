# Data Sources And Evidence

`data/source-registry.json` is the source policy contract.

- Gold sources are official issuing-authority artifacts and decide canonical truth.
- Silver sources are credible maintained crosswalks or alternate representations.
- Bronze sources support discovery and corroboration.
- Gold-supported claims may publish with visible silver or bronze evidence gaps.
- Missing or conflicting gold evidence blocks a mapping.

Every published assertion records a source artifact, locator, snapshot date, agreement status, and evidence gaps.

## CCI Source Contract

Control Correlation Identifiers are imported from the official DISA CCI List as their own complete catalog. CCI-to-NIST SP 800-53 Revision 5 mappings are derived from references inside that list. STIG catalogs are neither required for those mappings nor treated as a synonym for CCI.
