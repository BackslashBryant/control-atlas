# Control Atlas Record Architecture & Source-Fidelity Epic

Temporary active-plan authority for the record-fidelity epic. The source specification has SHA-256 `48f9d230e9d40604518c14a2d8f2bc452670b867f451084abcff7bc41f2fa9d5`. Reconcile it against current `main` before implementation claims, and delete it in the shipping change.

**Status:** Active

## Objective

Redesign Control Atlas record detail architecture so each published object is presented according to what it actually is, while preserving the exhaustive Atlas graph separately.

The finished system must answer, for every supported record type:

- What is this?
- Where does it sit?
- What did the publisher actually provide?
- What matters to the practitioner?
- What officially connects to it?
- Where can I go next?

This is not primarily a visual redesign. It is an end-to-end source fidelity, information architecture, relationship-governance, and record presentation effort.

## 1. First deliverable: end-to-end record-type audit

Create `docs/RECORD_TYPE_FIDELITY_AUDIT.md`.

Audit every currently supported record type using at least one representative real record.

For each type, trace:

```text
publisher source
-> importer/extractor
-> normalized record
-> generated node/runtime document
-> presentation profile
-> rendered page
```

The audit table must contain:

- Catalog
- Native record type
- Current runtime type
- Representative record
- Source artifact
- Source fields available
- Importer fields captured
- Normalized fields retained
- Runtime fields retained
- Fields rendered
- Lost fields
- Hidden fields
- Synthetic fields
- Hierarchy
- Relationship classes
- Current page role
- Recommended page role
- Status: `PASS` / `PRESENTATION LOSS` / `DATA LOSS` / `MODEL GAP`

Do not infer missing publisher fields.

Anything labeled as a loss must identify the exact pipeline stage where it disappears.

Required representative coverage:

- CSF Subcategory — PR.AA-01
- CSF Category — PR.AA
- NIST 800-53 control and enhancement
- NIST 800-53A assessment procedure
- DISA CCI
- DISA STIG rule
- DISA SRG requirement
- DISA benchmark
- CMMC level
- RMF step
- ATT&CK technique/sub-technique
- D3FEND countermeasure
- NIST Mobile threat
- IoT capability hierarchy
- Representative NIST/DoD Zero Trust records

All types currently declared in `SUPPORTED_RECORD_TYPES` must be covered.

## 2. Introduce semantic page roles

Do not create 43 unrelated page components.

Create a small set of semantic page roles and assign every catalog/type combination explicitly.

### A. Atomic record

For things such as:

- CSF Subcategory
- 800-53 Control
- 800-171 Requirement
- STIG Rule
- SRG Requirement
- ATT&CK Technique
- D3FEND Technique
- SSDF Practice

Core order:

```text
identity
-> source-native content
-> implementation/assessment material
-> important relationships
-> source facts
```

### B. Container

For:

- Function
- Category
- Family
- Benchmark
- Tactic
- Pillar
- Capability groups

Core order:

```text
identity
-> publisher description
-> hierarchy
-> child inventory
-> counts/facets
-> external relationships
```

A container page must not look like an atomic requirement.

### C. Publication/document

For:

- Catalog
- Zero Trust publication
- Zero Trust document
- Mapping document

Core order:

```text
publication identity
-> publisher/version/status
-> summary
-> structure/content
-> contained objects
-> related publications
```

### D. Entity/contributor

For:

- collaborator
- mapping contributor
- similar named organizations/products

Core order:

```text
entity identity
-> publisher context
-> participation/related objects
-> source
```

### E. Assessment/question

For:

- 800-53A procedure
- maturity questions

Core order:

```text
subject
-> procedure/question
-> objectives/options
-> methods
-> related requirement
```

### F. Implementation artifact

For:

- Zero Trust builds
- product components
- architecture components

Core order:

```text
what it implements
-> architecture/function
-> implementation guidance
-> mappings
-> source
```

Every supported catalog/type combination must explicitly resolve to one role.

No silent generic fallback.

## 3. Replace field lists with record presentation contracts

`src/shared/record-presentation.mjs` currently mostly determines which fields to print and what headings they get.

Expand this into a real contract.

Conceptually:

- catalog
- record type
- page role
- identity fields
- hierarchy fields
- primary source sections
- secondary source sections
- metadata facts
- relationship policy
- required fields
- optional fields
- prohibited synthetic presentation

The contract must distinguish:

- required publisher fields
- optional publisher fields
- derived classification
- Control Atlas navigation metadata
- relationship data
- source metadata

A source-native field must not disappear simply because the UI profile omitted it.

## 4. Fix confirmed fidelity problems first

### CSF 2.0

The current CSF ingestion already captures Implementation Examples and Informative References from NIST's Reference Tool.

The current runtime build retains both fields.

But the CSF presentation override deliberately exposes only Outcome. That must change.

A CSF Subcategory page must provide, when published:

1. Outcome
2. Implementation Examples
3. Informative References
4. Native Function -> Category -> Subcategory location

CSF Category and Function pages must also be audited for publisher descriptions rather than relying solely on derived structural labels.

The graph already models Function -> Category -> Subcategory structurally.

### DISA STIG/SRG

The importer extracts, among other fields:

- Vuln ID
- Rule ID
- STIG ID
- severity
- benchmark identity
- discussion
- Check
- Fix
- CCI references

Audit and correct the normalization stage so publisher-native identifiers are retained.

At minimum, STIG rule pages should expose:

- Finding/Vuln ID
- Rule ID
- STIG ID
- Benchmark
- Version/release
- Severity
- Discussion
- Check
- Fix
- Published CCI references

The page must keep the containing benchmark explicit.

A rule should not require graph inference to tell the practitioner which STIG it belongs to.

## 5. Separate structural hierarchy from cross-publication relationships

Structural hierarchy and external correlation are different concepts.

Examples:

```text
CSF 2.0
  PROTECT
    PR.AA
      PR.AA-01
```

and:

```text
Ubuntu 24.04 STIG
  V-270645
```

are classification/hierarchy, not "related records."

The graph builder already has explicit structural tiers for CSF and DISA benchmarks.

Make that hierarchy first-class on the page.

## 6. Add relationship-display governance

Keep the Atlas exhaustive.

Do not remove valid edges simply because they clutter a detail page.

Instead create a presentation policy such as:

```text
record role
+ catalog
+ counterpart role/catalog
+ relationship type
-> presentation treatment
```

Allowed treatments:

- `PROMOTE`: Important enough for normal page content.
- `SUMMARIZE`: Show count/group with a few examples.
- `COLLAPSE`: Available behind disclosure.
- `ATLAS_ONLY`: Valid graph relationship, excluded from default detail page.

For example, a CSF Outcome should not automatically display a long list of STIG benchmarks merely because formal cross-catalog edges exist.

The existing relationship builder is already constrained to published cross-catalog correlation links.

The missing layer is practitioner relevance, not relationship validity.

Do not encode relevance by deleting or downgrading source relationships.

## 7. Remove generic relationship-derived prose

This current behavior should be removed or heavily constrained:

> Publishers define this record in a single official statement. Its N related records provide implementation detail, assessment criteria...

That sentence is generated from edge count, not publisher content.

Replace it with source-native material whenever available.

If a source genuinely contains only one statement, simply present that statement and its hierarchy/source context.

Do not manufacture importance from the number of graph neighbors.

## 8. Add explicit source-fidelity validation

Extend validation to test expected publisher-field retention.

For every catalog/type contract:

```text
source field captured
    ->
normalized field present
    ->
runtime field present
    ->
presentation disposition declared
```

Every captured substantive field must end in exactly one state:

- `rendered_primary`
- `rendered_secondary`
- `source_metadata`
- `relationship_evidence`
- `intentionally_hidden`

No unexplained field disappearance.

If `intentionally_hidden`, the contract must state why.

## 9. Add fixture-driven tests

Create a representative fixture manifest, for example `tests/fixtures/record-type-fixtures.json`.

Each supported role/type gets a real record.

Tests must verify four layers.

### ETL fidelity

Publisher-native expected fields survive normalization.

### Runtime fidelity

Expected normalized fields survive into runtime nodes/documents.

### Presentation contract

Every retained substantive field has a declared presentation disposition.

### Browser behavior

Representative record pages show the correct sections and hierarchy without unrelated relationship floods.

Do not write 43 giant Playwright tests.

Prefer:

- contract/unit tests for all types
- targeted E2E tests for representative semantic roles
- regression tests for known high-risk catalogs

## 10. Required page-specific outcomes

### CSF PR.AA-01

Above normal related-record content, the page must expose:

```text
PR.AA-01

Identities and credentials for authorized users, services, and hardware are managed by the organization.
```

Then Implementation Examples, followed by Informative References.

Its native location must be visibly understandable as:

```text
NIST CSF 2.0
-> PROTECT
-> PR.AA Identity Management, Authentication, and Access Control
-> PR.AA-01
```

STIGs, Zero Trust components, controls, etc. may appear afterward according to the relationship-display policy.

### CSF PR.AA

Must behave as a Category/container page.

Show `PR.AA - Identity Management, Authentication, and Access Control` with:

- parent Function: PROTECT
- publisher Category description if available
- contained Subcategories
- concise counts
- external mapping summary

Do not render it as an empty generic record.

### STIG rule

Must provide a practitioner-oriented Overview followed by Discussion, Check, and Fix.

The containing benchmark must be obvious.

Native DISA identifiers must survive ETL and be visible where the publisher provides them.

### STIG benchmark

Must behave as a benchmark/container.

Show:

- benchmark title
- version/release
- publication/current date where published
- rule count
- severity distribution if derivable directly from contained rules
- child rules
- source

Do not display all the benchmark's child findings as generic "related records."

## 11. Architecture constraint

Do not redesign the Atlas graph to solve a page-layout problem.

Preserve:

- publisher-native hierarchy
- relationship direction
- relationship evidence
- source metadata
- lifecycle/version data
- valid cross-catalog correlations

The change is primarily:

```text
raw source
   ->
lossless normalized domain model
   ->
runtime graph + documents
   ->
semantic record/page contract
   ->
practitioner-specific presentation
```

Not:

```text
graph edge
   ->
generic card
```

## Acceptance criteria

The epic is complete only when:

1. Every supported record type has a representative end-to-end fidelity audit.
2. Every catalog/type explicitly resolves to a semantic page role.
3. No substantive captured publisher field disappears without a declared disposition.
4. CSF Implementation Examples and Informative References appear on applicable Subcategory pages.
5. STIG native IDs and benchmark context survive source -> runtime and are presented correctly.
6. Container types no longer behave like atomic requirement pages.
7. Valid but low-value graph relationships can be Atlas-only without deleting the underlying edge.
8. Relationship counts no longer generate misleading generic explanatory prose.
9. Fixture/unit tests cover all supported types and E2E tests cover every semantic page role.
10. Build, validation, existing regression tests, and the new fidelity tests pass.
11. Generated artifacts reconcile with source records and no unrelated runtime records or edges disappear.
12. A before/after review of PR.AA-01, PR.AA, a STIG rule, a STIG benchmark, AC-2, an ATT&CK technique, and one Zero Trust artifact demonstrates the new architecture.

## Implementation sequence

1. Produce only the fidelity matrix. No product-code changes. This is the evidence gate.
2. Resolve confirmed ETL losses. STIG identifiers and any additional audit findings come before UI work.
3. Implement semantic page-role contracts and relationship-display policy.
4. Refactor `ObjectDetailPage` using a universal shell with role-specific content composition.
5. Add tests and perform the seven-record acceptance review.

## First task

Step 1 only: produce `docs/RECORD_TYPE_FIDELITY_AUDIT.md` by tracing every supported record type through:

```text
publisher source
-> importer/extractor
-> normalized record
-> generated runtime node/document
-> presentation profile
-> rendered page
```

Do not modify product code during this first task.

The audit must identify:

- where fields are preserved
- where fields are hidden
- where fields are lost
- where the runtime type is semantically wrong
- where hierarchy is missing or misrepresented
- which semantic page role each catalog/type should use

Do not infer missing source content.

Do not fabricate fields, mappings, hierarchy, or applicability.
