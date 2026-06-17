# Product Requirements Document
# Control Atlas

**Public product name:** Control Atlas
**Campaign line:** Ctrl+Alt+Comply
**Primary tagline:** The public map for federal cyber compliance.
**Supporting line:** Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates â€” no login, no evidence upload, no organizational data required.

**Primary platform:** GitHub Pages / static site
**Primary users:** Federal/DoD auditors, assessors, ISSOs, ISSMs, engineers, compliance managers, contractors, CSPs, and RMF/ATO practitioners
**Document version:** 2.1
**Status:** Ready for MVP planning

---

## Repository Implementation Baseline

This PRD defines product intent and scope. The existing Control Atlas static JavaScript application, D3 force-directed graph engine, build-time public-data pipeline, source registry schema, and generated federal graph contracts are adopted as the implementation starting point.

The Phase 0 sprint (see Section 19) establishes the completed Control Atlas rename, staged static build path, and baseline hardening before any new feature work begins. No framework migration is required before continuing the Control Atlas roadmap, and the package rename plus deployment-path change are now part of the Epic 0 baseline.

---

## 1. Executive Summary

Control Atlas is an open-source, public-data-only reference workbench for federal and DoD cybersecurity compliance. It helps practitioners understand how public controls, baselines, STIGs, SRGs, CCIs, MITRE frameworks, FedRAMP materials, RMF concepts, inheritance patterns, reciprocity concepts, and authorization templates relate to each other.

Control Atlas is **not** a GRC system, evidence processor, eMASS replacement, scanner parser, compliance scoring engine, or authorization package manager.

The core product value:

> Help practitioners navigate federal cyber compliance using public mappings, provenance-aware relationships, reusable reference views, and blank templates â€” without collecting user, system, organizational, or evidence data.

---

## 2. Product Vision

Control Atlas should become the public reference layer practitioners wish existed before starting RMF, ATO, FedRAMP, STIG, reciprocity, inheritance, and audit-prep work.

The site should answer questions like:

- What public controls, baselines, STIGs, SRGs, CCIs, and MITRE references relate to this topic?
- What is the difference between NIST Moderate and FedRAMP Moderate?
- Which STIG/SRG requirements appear to support a NIST control?
- What evidence is typically expected for a control or STIG rule?
- What are common inheritance and reciprocity patterns?
- What blank templates can I generate to help structure my work?
- Which mappings are official, public, community-sourced, or inferred?
- Where do I even start given my system type and data sensitivity?

### 2.1 Design principles

Control Atlas must **build for translation, not documentation** — plain operational language first, traceable connections, and clear next steps for small teams. Canonical guidance: [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

---

## 3. Product Boundary

### 3.1 In Scope

Control Atlas may:

- Use public federal, DoD, NIST, DISA, MITRE, CISA, FedRAMP, and open-source data
- Normalize public source data at build time
- Display public control catalogs, baselines, STIGs, SRGs, CCIs, mappings, and source metadata
- Generate blank templates locally in the browser
- Export blank or public-reference templates as Markdown, CSV, JSON, or YAML
- Show relationship graphs between public control/reference objects
- Label source provenance, mapping confidence, and relationship type
- Provide generic reciprocity, inheritance, shared-responsibility, and RMF/ATO pattern guidance
- Provide reference-only evidence expectation matrices
- Provide a guided "where do I start?" entry point based on system type and data sensitivity

### 3.2 Out of Scope

Control Atlas must not:

- Ingest user evidence
- Upload, store, parse, or process user SSPs, SARs, SAPs, POA&Ms, ACAS scans, STIG results, SCAP results, CKLs, CKLBs, XCCDF result files, or eMASS exports
- Connect to eMASS, Xacta, Archer, ServiceNow GRC, Tenable, ACAS, SCC, STIG Manager, or other operational systems
- Track real asset compliance
- Determine whether a system is compliant
- Score an organization, system, package, or authorization boundary
- Recommend authorization decisions
- Store user profiles, organization names, system names, boundary descriptions, assets, findings, weaknesses, milestones, or evidence artifacts
- Require login
- Provide workflow/task management for real authorization packages
- Generate completed compliance artifacts from user system data
- Imply official federal, DoD, DISA, NIST, FedRAMP, MITRE, or CISA endorsement

### 3.3 Product Disclaimer

The following disclaimer must appear in the footer, About page, and template export metadata:

> Control Atlas is an open-source reference tool. It is not an official government system and does not make compliance, authorization, or risk decisions. All mappings and templates are reference aids based on public sources. Official decisions remain with the applicable Authorizing Official, agency, or program office.

---

## 4. Target Users and Personas

### 4.1 ISSO / ISSM

**Needs:** Quickly understand control relationships. Build blank planning worksheets. Explain inheritance, reciprocity, evidence expectations, and control intent. Prepare for assessment discussions.

**Pain points:** Repetitive documentation. Unclear control relationships. Stale inheritance assumptions. Tool-specific confusion. Ambiguous evidence expectations.

### 4.2 Assessor / Auditor / SCA

**Needs:** Trace STIG/SRG/CCI/control relationships. Understand public baseline differences. Create assessment planning templates. Reference evidence expectations without asking for user data.

**Pain points:** Inconsistent implementation statements. Poorly structured artifacts. False positives and unclear rationale. Vague inherited-control claims.

### 4.3 Engineer / System Integrator

**Needs:** Understand which controls and STIGs affect technical implementation. Translate control language into expected technical evidence. See relationship between hardening references and control families. Avoid late surprises during ATO package review.

**Pain points:** Compliance language is hard to connect to real implementation. STIGs and controls feel disconnected. Control inheritance and shared responsibility are often unclear.

### 4.4 Program Manager / Compliance Manager

**Needs:** Understand process patterns. Generate planning templates. Compare baselines. Communicate scope, boundary, reciprocity, and evidence expectations.

**Pain points:** Authorization timelines are opaque. Reciprocity is often misunderstood. Package reuse is difficult to explain. Stakeholders confuse FedRAMP authorization, agency ATO, DoD authorization, and local risk acceptance.

### 4.5 Contractor / CSP / Small Vendor

**Needs:** Learn what public sources apply. Build starter templates before engaging consultants or assessors. Understand FedRAMP, RMF, STIG, reciprocity, inheritance, and shared responsibility concepts. Know where to start.

**Pain points:** High cost of entry. Confusing source ecosystem. Unclear relationship between public baselines and real authorization work.

---

## 5. Core Product Principles

1. **Public data only.** Control Atlas uses public sources and build-time data imports only.
2. **No user, org, or system data.** The product must not require or retain organizational context.
3. **Reference before automation.** The site clarifies, maps, compares, and templates. It does not certify, assess, or authorize.
4. **Provenance is mandatory.** Every source, relationship, and generated template section must trace back to public source metadata or be labeled as inferred.
5. **Relationship meaning and trust are separate fields.** `relationship_type` describes what the relationship means. `provenance_class` describes why it should be trusted.
6. **Client-side generation only.** Templates are generated locally in the browser from static public data.
7. **No dark patterns.** No login wall, no telemetry on generated content, no hidden data collection.
8. **Practitioner-first language.** Content is useful to operators, technicians, assessors, auditors, and ISSOs. No unnecessary academic or corporate framing.

---

## 6. Information Architecture

Control Atlas uses six top-level sections:

```
1. Library
2. Crosswalks
3. Patterns
4. Templates
5. Provenance
6. Start Here
```

### 6.1 Library

Browse public reference content: NIST controls, NIST baselines, FedRAMP baselines, DISA STIG/SRG content, CCIs, MITRE ATT&CK/D3FEND relationships, CISA references, RMF/ATO glossary, and public-source metadata.

### 6.2 Crosswalks

Explore relationships between public frameworks: NIST to FedRAMP, NIST to STIG/SRG/CCI, STIG to CCI to NIST, ATT&CK to D3FEND to control, baseline comparison views, relationship graphs, and source/provenance/confidence labels.

### 6.3 Patterns

Plain-language explanations of common authorization and audit patterns: RMF lifecycle, ATO/ATC reference, reciprocity, inheritance models, shared responsibility, common control provider patterns, FedRAMP reuse, DoD reciprocity friction, boundary and scope patterns, common failure modes, and evidence expectation patterns.

### 6.4 Templates

Generate blank, reference-driven planning templates locally in the browser:

- Security Plan Starter
- Control Implementation Statement Worksheet
- Evidence Expectation Matrix
- STIG Evidence Checklist
- Inheritance Worksheet
- Reciprocity Checklist
- POA&M Starter
- Assessment Planning Worksheet
- Continuous Monitoring Calendar

> Note: The Shared Responsibility Matrix Starter is deferred to Phase 5. It is the most context-dependent template and will be more useful after the Patterns section is complete and can contextualize it.

### 6.5 Provenance

Source trust, version, and lineage metadata. Renamed from "Sources" to reinforce that this surface answers "why should I trust this mapping?" â€” not just "where did this come from?"

Includes: source registry, source class, source owner, source URL, version, last checked date, license/use notes, parser status, normalization status, mapping status, and deprecated/superseded flags.

### 6.6 Start Here

A guided entry point for practitioners who don't know where to begin. A short client-side question flow (system type, data sensitivity, operational environment) that outputs a suggested framework and baseline starting point, links to relevant library objects, and surfaces applicable templates.

No data is stored. No profile is created. The output is a reference recommendation, not a compliance determination.

---

## 7. MVP Scope

### 7.1 MVP Goal

Deliver a static, searchable, public reference site providing:

1. Provenance registry (formerly Source Registry)
2. NIST control browser
3. FedRAMP/NIST baseline browser
4. STIG/SRG reference browser
5. STIG â†’ CCI â†’ NIST crosswalk
6. Baseline comparator
7. Evidence Expectation Matrix generator
8. Security Plan Starter generator
9. POA&M Starter generator
10. Inheritance and Reciprocity Worksheet generators
11. Public relationship graph (D3 baseline)
12. Provenance/confidence labeling
13. Glossary
14. Start Here entry point

### 7.2 MVP Non-Goals

The MVP will not include:

- Backend database
- User accounts or authentication
- Saved workspaces
- Scan ingestion
- Evidence upload
- eMASS import/export
- STIG checklist ingestion
- Completed SSP generation
- Compliance scoring
- Operational dashboards
- Workflow management
- Shared Responsibility Matrix Starter template

---

## 8. Feature Requirements

### 8.1 Feature: Provenance Registry

**Description:** The trust backbone of Control Atlas. Catalogs all public sources used by the system and makes their lineage, class, and status visible to users.

**Functional requirements:**

- Display all sources in a searchable/filterable table
- Show source owner, source class, status, version, URL, last checked date, parser status, and use in Control Atlas
- Support source classes: `federal_authoritative`, `dod_authoritative`, `nist_authoritative`, `disa_authoritative`, `fedramp_authoritative`, `mitre_published`, `cisa_published`, `federal_utilized`, `community_open_source`, `inferred`, `deprecated`
- Every normalized node must reference a `source_id`
- Every normalized edge must reference one or more `source_refs`

**Acceptance criteria:**

- User can view all source records
- User can filter by source class
- User can distinguish official/federal/public/community/inferred material
- Every displayed mapping has a visible source or is clearly labeled as inferred
- Deprecated/superseded sources display a clear visual warning

---

### 8.2 Feature: Library Browser

**Description:** Searchable public reference content across all normalized objects.

**Functional requirements:**

- Search by control ID, STIG ID, CCI ID, keyword, baseline, family, source, and source class
- Display normalized records for: NIST controls, control families, baselines/profiles, FedRAMP overlays/baselines, STIG rules, SRG requirements, CCIs, MITRE ATT&CK techniques, MITRE D3FEND countermeasures
- Support deep links for each object
- Support copyable object IDs
- Object detail pages include: title, source, version, description, related objects, provenance, relationship graph subset, and template actions where applicable

**Acceptance criteria:**

- User can search `AC-2` and see the control detail page
- User can search a STIG rule identifier and see related CCIs and controls
- User can search `account management` and see controls, STIGs, and references
- User can copy a stable link to any object page

---

### 8.3 Feature: Crosswalk Workbench

**Description:** Relationship tables between public sources, with filtering, provenance labeling, and export.

**Functional requirements:**

- Display relationship tables with: source object, target object, relationship type, provenance class, confidence, rationale, and source references
- Support relationship types: `maps_to`, `supports`, `implements`, `overlaps`, `references`, `derived_from`, `supersedes`, `related_to`
- Support provenance classes: `official`, `federal_published`, `dod_published`, `nist_published`, `disa_published`, `fedramp_published`, `mitre_published`, `community_open_source`, `inferred`
- Support confidence values: `high`, `medium`, `low`
- Allow filtering by framework, source class, relationship type, and confidence
- Export visible crosswalks to CSV/JSON/Markdown

**Acceptance criteria:**

- User can view STIG â†’ CCI â†’ NIST relationships
- User can distinguish official mappings from inferred mappings
- User can export visible mappings
- User can filter to only official/federal-published mappings
- User can filter to include inferred mappings

---

### 8.4 Feature: Baseline Comparator

**Description:** Side-by-side comparison of public baselines and profiles.

**Functional requirements:**

- Compare selected baselines: NIST Low/Moderate/High, FedRAMP Low/Moderate/High, additional public baselines as available
- Display: controls in both, controls only in A, controls only in B, parameterized controls, enhancements added/removed, source and version
- Export comparison to CSV/Markdown/JSON

**Acceptance criteria:**

- User can compare NIST Moderate to FedRAMP Moderate
- User can see deltas between selected baselines
- User can export the comparison
- Comparison output clearly states source versions

---

### 8.5 Feature: STIG/SRG Rule Browser

**Description:** Reference-only view of public STIG/SRG data.

**Functional requirements:**

- Browse public STIGs/SRGs by product, platform, severity, title, CCI, control reference, and keyword
- Display: STIG ID, Rule ID, Vulnerability ID, severity/CAT, title, discussion, check text, fix text, CCI references, NIST control references, source version
- Provide "Generate STIG Evidence Checklist" action
- Provide "View related controls" action

**Acceptance criteria:**

- User can search for a STIG rule
- User can see related CCI/control references
- User can generate a blank evidence checklist for selected STIG rules
- Site does not store or evaluate real STIG status

---

### 8.6 Feature: Start Here

**Description:** A guided entry point for practitioners who don't know which framework or baseline applies to their situation.

**Functional requirements:**

- Short client-side question flow (no data stored, no profile created):
  - System type (cloud SaaS, platform service, enclave, on-premises, hybrid, enterprise service)
  - Data sensitivity / classification
  - Operational environment (federal civilian, DoD, contractor, CSP)
- Output: suggested framework(s) and baseline(s), links to relevant library objects, links to applicable templates, links to relevant pattern pages
- Output is a reference recommendation only â€” not a compliance determination
- No free-text input required

**Acceptance criteria:**

- User can complete the flow in under 60 seconds
- Output clearly states it is a reference recommendation
- No user input is stored or transmitted
- Output links directly to relevant Library and Template surfaces

---

### 8.7 Feature: Glossary

**Description:** Searchable, provenance-labeled definitions for federal/DoD compliance terminology.

**Functional requirements:**

- Terms include at minimum: ATO, ATC, FedRAMP authorization, RMF, STIG, SRG, CCI, SAR, SAP, SSP, POA&M, BoE, reciprocity, inheritance, common control, shared responsibility, ISSO, ISSM, SCA, AO, AODR, boundary, overlay, baseline, profile, continuous monitoring
- Each term links to related Library objects and Pattern pages where applicable
- Each term cites its public source or is labeled as practitioner-consensus
- Glossary is searchable from the main search bar

**Acceptance criteria:**

- User can search "reciprocity" and find the definition, a link to the reciprocity pattern page, and related templates
- User can distinguish formally defined terms (NIST-sourced) from practitioner-consensus definitions
- Glossary terms are accessible from object detail pages where relevant

---

### 8.8 Feature: Authorization Pattern Library

**Description:** Generic, public-reference explanations of authorization and audit concepts.

**Functional requirements:**

Pattern pages include:
- RMF lifecycle
- ATO vs. ATC
- ATO vs. FedRAMP authorization
- Reciprocity basics
- Reciprocity failure patterns
- Control inheritance
- Common control provider model
- Shared responsibility model
- Cloud service provider inheritance
- Enterprise service inheritance
- Boundary and scope patterns
- Body of Evidence reuse
- POA&M and residual risk concepts
- Continuous monitoring artifact cadence
- Evidence expectation patterns

Each pattern page includes:
- Plain-language explanation
- Common practitioner friction
- Public source references
- Related controls
- Related templates
- Do / Do Not guidance
- Limitations and disclaimers

**Acceptance criteria:**

- User can read a generic inheritance pattern page
- User can generate an inheritance worksheet from the pattern page
- Pattern pages do not ask for organization/system details
- Pattern pages do not make authorization recommendations

---

### 8.9 Feature: Template Factory

**Description:** Blank, reference-driven templates generated locally in the browser.

**Functional requirements:**

Supported templates:
1. Security Plan Starter
2. Control Implementation Statement Worksheet
3. Evidence Expectation Matrix
4. STIG Evidence Checklist
5. Inheritance Worksheet
6. Reciprocity Checklist
7. POA&M Starter
8. Assessment Planning Worksheet
9. Continuous Monitoring Calendar

Supported output formats: Markdown, CSV, JSON, YAML

Template selector leads with **artifact type first**, then framework/baseline selection. Most practitioners arrive with a deliverable in mind, not a framework selection intent.

Environment archetype options:
- Generic
- Cloud SaaS
- Platform service
- Enclave
- On-premises system
- Hybrid system
- Enterprise service

Optional include flags:
- Implementation prompts
- Evidence expectations
- Inheritance prompts
- Reciprocity prompts
- STIG references
- Source/provenance footnotes
- Placeholder fields

**Privacy requirements:**

- All generation occurs in the browser
- Generated content is not sent to any server
- No generated content is logged
- Generated content is not persisted to local storage by default

**Acceptance criteria:**

- User can generate a blank SSP starter for NIST Moderate
- User can generate a POA&M starter table without entering system data
- User can generate an Evidence Expectation Matrix for selected controls
- User can download output as Markdown and CSV
- Generated artifacts include source/version metadata
- Generated artifacts include required disclaimer language
- Templates are reachable in three interactions or fewer after landing on the Templates section

---

### 8.10 Feature: Relationship Graph

**Description:** Visualization of public relationships between controls, STIGs, CCIs, baselines, techniques, defenses, and sources. Built on the adopted D3 baseline.

**Migration note:** The adopted D3 force-directed graph baseline remains in place for Epic 0. Phase 0 extends the node/edge schema to add `provenance_class`, `confidence`, `relationship_type`, and `source_refs` fields. The graph renderer is updated to surface those as visual filters and provenance-color-coded edges. This is primarily a data layer task, not a full UI rebuild.

**Functional requirements:**

Graph nodes: controls, baselines, STIG rules, SRG requirements, CCIs, ATT&CK techniques, D3FEND countermeasures, templates, sources

Graph edges carry: relationship type, provenance class, confidence

User can filter by: node type, source, relationship type, confidence, provenance

Accessible fallback table view required. Graph supports deep links.

**Acceptance criteria:**

- User can open graph from a control detail page
- User can see related STIGs, CCIs, baselines, and templates
- User can filter out inferred relationships
- User can switch to table view
- Edge colors match provenance color tokens (with text/icon labels â€” color is never the only indicator)

---

## 9. Data Sources

### 9.1 MVP Source Priority

| Priority | Source Type                   | Use                                                           |
|---------:|-------------------------------|---------------------------------------------------------------|
| 1        | NIST OSCAL catalogs/baselines | Control catalog, baselines, templates                         |
| 2        | DISA STIG/SRG public content  | STIG/SRG browser, check/fix reference, evidence prompts       |
| 3        | CCI references                | STIG/SRG to NIST bridge                                       |
| 4        | FedRAMP baselines/templates   | Baseline comparison, template structure                       |
| 5        | MITRE ATT&CK                  | Threat technique relationships                                |
| 6        | MITRE D3FEND                  | Defensive countermeasure relationships                        |
| 7        | ComplianceAsCode              | Public SCAP/XCCDF/OVAL pattern reference                      |
| 8        | PowerSTIG                     | Organizational setting/deviation/template concepts            |
| 9        | STIG Manager                  | STIG assessment data model concepts                           |
| 10       | Vulnerator                    | Practitioner source vocabulary and report-aggregation lessons |

### 9.2 Source Handling Rules

- Public sources are imported only at build time
- All imported source files must be versioned or hashed
- Every normalized object must retain source traceability
- Every mapping must show whether it is official, published, community, or inferred
- Inferred relationships must include rationale
- Deprecated sources remain visible only when relevant and clearly marked
- Build fails if required source fields are missing

---

## 10. Normalized Data Model

### 10.1 Node Schema

```yaml
control_atlas_node:
  id: string
  type:
    - control
    - control_family
    - baseline
    - profile
    - stig_rule
    - srg_requirement
    - cci
    - attack_technique
    - defend_countermeasure
    - template
    - source
  canonical_id: string
  title: string
  description: string
  source_id: string
  source_class: string
  version: string
  status:
    - active
    - deprecated
    - superseded
    - draft
    - unknown
  external_refs:
    - label: string
      url: string
  tags:
    - string
  raw_ref: string
  normalized_at: string
```

### 10.2 Edge Schema

```yaml
control_atlas_edge:
  id: string
  from: string
  to: string
  relationship_type:
    - maps_to
    - supports
    - implements
    - overlaps
    - references
    - derived_from
    - supersedes
    - related_to
  provenance_class:
    - official
    - federal_published
    - dod_published
    - nist_published
    - disa_published
    - fedramp_published
    - mitre_published
    - community_open_source
    - inferred
  confidence:
    - high
    - medium
    - low
  rationale: string
  source_refs:
    - source_id: string
      ref_type: string
      locator: string
  created_by:
    - parser
    - curator
    - inference_rule
  review_status:
    - unreviewed
    - reviewed
    - disputed
  normalized_at: string
```

### 10.3 Source Schema

```yaml
control_atlas_source:
  source_id: string
  name: string
  owner: string
  source_class: string
  source_url: string
  license_or_use: string
  version: string
  status:
    - active
    - deprecated
    - superseded
    - draft
  formats:
    - xml
    - json
    - yaml
    - csv
    - xlsx
    - pdf
    - html
  parser:
    name: string
    version: string
    status:
      - implemented
      - planned
      - manual
      - not_applicable
  last_checked: string
  last_imported: string
  hash: string
  notes: string
```

### 10.4 Template Schema

```yaml
control_atlas_template:
  template_id: string
  name: string
  artifact_type:
    - security_plan_starter
    - implementation_statement_worksheet
    - evidence_expectation_matrix
    - stig_evidence_checklist
    - inheritance_worksheet
    - reciprocity_checklist
    - poam_starter
    - assessment_planning_worksheet
    - conmon_calendar
  supported_formats:
    - markdown
    - csv
    - json
    - yaml
  input_options:
    - framework
    - baseline
    - control_family
    - selected_controls
    - selected_stigs
    - environment_archetype
  source_refs:
    - source_id
  disclaimer_required: true
```

---

## 11. Template Specifications

### 11.1 Security Plan Starter

Must include: title page placeholder, document metadata, disclaimer, system overview placeholder, authorization boundary placeholder, system environment placeholder, data types placeholder, user roles placeholder, interconnections placeholder, control baseline table, control implementation statement prompts, inheritance prompts, evidence expectation table, revision history, source metadata.

Must not include: real system name, real organization name, real asset list, actual implementation claims, compliance status.

### 11.2 Evidence Expectation Matrix

Columns: Control ID, Control title, Control family, Related STIG/SRG references, Related CCIs, Evidence type, Example artifact names, Suggested evidence owner role, Suggested review cadence, Notes, Source/provenance, Confidence.

Evidence types include: Policy, Procedure, Configuration screenshot, System-generated report, Access review, Scan output, Interview, Architecture diagram, Change record, Training record, Incident record, Log sample, Inventory export, Exception/deviation memo.

### 11.3 POA&M Starter

Columns: Weakness ID, Source of discovery, Related control, Related STIG/SRG, Weakness description, Risk statement, Severity, Planned remediation, Milestone, Scheduled completion date, Responsible role, Status, Deviation/exception reference, Risk acceptance reference, Evidence needed for closure, Notes.

Generated template is blank.

### 11.4 Inheritance Worksheet

Columns: Control ID, Control title, Inheritance type, Common control provider, Provider responsibility, Customer/system responsibility, Shared responsibility notes, Evidence dependency, Artifact freshness concern, Local delta review needed, Source/provenance, Notes.

### 11.5 Reciprocity Checklist

Sections: Granting authorization/package reference placeholder, Receiving organization placeholder, Body of Evidence checklist, Boundary comparison prompts, Control delta prompts, POA&M review prompts, Risk acceptance prompts, Artifact freshness prompts, AO decision prompts, Local implementation responsibility prompts, Caveats and limitations.

### 11.6 STIG Evidence Checklist

Columns: STIG title, STIG ID, Rule ID, Vulnerability ID, Severity, Requirement title, Check text summary, Fix text summary, CCI references, Related controls, Evidence expectation, Validation method, Not Applicable justification prompt, Deviation/exception prompt, Notes.

---

## 12. UX Requirements

### 12.1 General UX

- Fast static site with no login
- No modal-heavy interface
- Clear top navigation with six sections
- Search must be central and accessible from every page
- Control IDs and STIG IDs must be copyable
- Every source/mapping must have visible provenance
- Every graph view must have an accessible table fallback
- Templates must be reachable in three interactions or fewer
- Avoid language implying official authorization or certification
- Template selector leads with artifact type, not framework

### 12.2 Homepage

**Hero structure (top to bottom):**

1. **Product name** â€” "Control Atlas" in `--ca-font-display`, large, full weight
2. **Rotating tagline** â€” `Ctrl+Alt+[word]` per Section 13.1. Static prefix in `--ca-text-muted`, rotating word in `--ca-secondary`. Fixed-width container sized to `Crosswalk` (longest word) to prevent layout shift.
3. **Static subtagline** â€” "The public map for federal cyber compliance." in `--ca-text-muted`, smaller weight
4. **Subtext** â€” "Explore public controls, baselines, STIGs, and compliance patterns â€” and generate blank RMF/ATO templates without uploading data or creating an account."
5. **CTAs** â€” Start Here Â· Explore Library Â· Generate Template

**Pillars** (below hero): Library Â· Crosswalks Â· Patterns Â· Templates Â· Provenance Â· Start Here

**Reduced motion fallback:** Rotating tagline shows "Ctrl+Alt+Comply" statically. All other hero content unchanged.

### 12.3 Accessibility

- WCAG 2.1 AA minimum
- Keyboard navigation required throughout
- Color is never the only status or provenance indicator â€” text/icon labels required alongside all color coding
- Contrast requirements met in dark theme
- Table views are screen-reader usable
- Graphs require accessible table fallback
- Reduced motion respected

---

## 13. Branding

### 13.1 Name and Campaign

**Product name:** Control Atlas

**Hero tagline (rotating):** `Ctrl+Alt+[word]` â€” displayed directly beneath the product name on the homepage hero. The prefix `Ctrl+Alt+` is static; the final word rotates through a curated list on a timed loop. This is the signature hero element, not a campaign line.

**Rotating word list (in display order):**

```
Comply
Map
Assess
Crosswalk
Navigate
Inherit
Audit
Authorize
```

Each word is chosen to reflect a real action the tool supports. The rotation uses a typewriter-style fade or slide transition â€” one word visible at a time, cycling every 2.5 seconds. The full phrase reads naturally as a keyboard shortcut metaphor that practitioners will recognize.

**Implementation requirements:**

- Static text: `Ctrl+Alt+` rendered in `--ca-font-mono`, muted color (`--ca-text-muted`)
- Rotating word: rendered in `--ca-font-mono`, primary accent color (`--ca-secondary: #22D3EE`)
- Transition: CSS fade (opacity 0â†’1 over 300ms) â€” no JavaScript animation libraries
- `prefers-reduced-motion`: rotation stops; first word (`Comply`) displays statically
- Screen readers: the full phrase is announced once as "Ctrl Alt Comply" using a static `aria-label` on the element; the rotation is `aria-hidden` to avoid repetitive announcements
- The rotating element must not cause layout shift â€” reserve fixed width for the longest word (`Crosswalk`)

**Secondary tagline (static, below the rotating line):**

> The public map for federal cyber compliance.

### 13.2 Visual Direction

**Theme:** Dark cartographic atlas. The signature element is a coordinate-grid overlay on key surfaces â€” contour lines, grid graticules, and provenance labels styled as map legend markers. This creates visual distinctiveness without breaking federal credibility. Blueprint blue as the primary interactive color; amber as the inferred/warning accent.

The identity should read like a technical instrument â€” not a marketing site, not a fake government portal.

### 13.3 Design Tokens

```css
:root {
  /* Backgrounds */
  --ca-bg: #0B1020;
  --ca-surface: #111827;
  --ca-surface-raised: #1E293B;
  --ca-border: #334155;

  /* Text */
  --ca-text: #F8FAFC;
  --ca-text-muted: #CBD5E1;

  /* Interactive */
  --ca-primary: #2563EB;       /* Primary actions, links */
  --ca-secondary: #22D3EE;     /* Secondary actions, NIST-published */

  /* Provenance accents â€” never use color as sole indicator */
  --ca-provenance-official:    #2563EB;   /* Blue: official/authoritative */
  --ca-provenance-dod:         #4F46E5;   /* Indigo: DoD-published */
  --ca-provenance-nist:        #22D3EE;   /* Cyan: NIST-published */
  --ca-provenance-disa:        #1E40AF;   /* Navy: DISA-published */
  --ca-provenance-fedramp:     #0D9488;   /* Teal: FedRAMP-published (distinct from primary blue) */
  --ca-provenance-mitre:       #7C3AED;   /* Violet: MITRE-published */
  --ca-provenance-community:   #64748B;   /* Slate: community/open-source */
  --ca-provenance-inferred:    #F59E0B;   /* Amber: inferred */
  --ca-provenance-deprecated:  #DC2626;   /* Red: deprecated */
  --ca-provenance-active:      #16A34A;   /* Green: active */

  /* Semantic */
  --ca-success: #16A34A;
  --ca-warning: #F59E0B;
  --ca-danger:  #DC2626;

  /* Typography */
  --ca-font-display: "Space Grotesk", system-ui, sans-serif;
  --ca-font-body:    "Public Sans",   system-ui, sans-serif;
  --ca-font-mono:    "JetBrains Mono", monospace;
}
```

**Note on FedRAMP color:** FedRAMP uses `--ca-provenance-fedramp: #0D9488` (Teal/Emerald), not blue, to avoid collision with `--ca-primary` interactive blue. This is a WCAG risk mitigation as much as a design decision.

All provenance colors require accompanying text or icon labels. Color is never the sole differentiator.

---

## 14. Technical Architecture

### 14.1 Architecture

```
Public Sources
      â†“
Build-Time Importers
      â†“
Raw Source Cache
      â†“
Normalization Pipeline
      â†“
Schema Validation (Zod + JSON Schema export)
      â†“
Relationship Builder
      â†“
Static Data Bundles (chunked JSON/JSONL)
      â†“
Static Web App (Control Atlas src base)
      â†“
Client-Side Search (MiniSearch) / Template Generation / Export
```

### 14.2 Runtime Requirements

- GitHub Pages static hosting
- No backend API for MVP
- No database for MVP
- No authentication
- No server-side template generation or logging
- No user-uploaded files
- Static JSON/JSONL data bundles generated during build
- Large datasets use chunked JSON with lazy loading

### 14.3 Technology Decisions

These are decisions, not options. Deviation requires an ADR.

| Layer           | Decision                                             | Rationale                                                              |
|-----------------|------------------------------------------------------|------------------------------------------------------------------------|
| Graph           | D3.js (Epic 0 baseline)                             | Preserve the adopted renderer while adding provenance-aware filtering and accessible fallbacks |
| Search          | MiniSearch                                           | Field-weighted search, serializes well for static bundles, handles ID + keyword mixed queries |
| Data validation | Zod (runtime) + JSON Schema export                   | TypeScript-native runtime validation with schema portability           |
| Data format     | JSON/JSONL runtime, YAML for curated registry        | JSON performance for client, YAML readability for human-edited sources |
| Template output | Markdown-first, CSV/JSON/YAML export                 | Markdown is most portable for practitioner use                         |
| Analytics       | None for MVP                                         | Privacy principle; no analytics that could capture generated content   |
| Frontend        | Control Atlas static JS in `src/` (no framework migration) | Repurpose-first; framework migration requires separate approved plan |
| CI/CD           | GitHub Actions                                       | Active staged-build, verification, and Pages deploy path               |
| Security scan   | CodeQL + Dependabot + npm audit + secret scanning    | Supply chain baseline                                                  |
| SBOM            | CycloneDX                                            | Widely supported, GitHub-native                                        |

### 14.4 Repository Structure

```
control-atlas/
  README.md
  LICENSE
  SECURITY.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  docs/
    adr/
    prd/
    architecture/
    data-sources/
  src/
    app/
    components/
    routes/
    templates/
    search/
    graph/
    styles/
  data/
    sources/
      registry/
      raw/
      normalized/
      generated/
    schemas/
    fixtures/
  tools/
    importers/
    normalizers/
    validators/
    relationship-builders/
    exporters/
  tests/
    unit/
    integration/
    e2e/
    fixtures/
  .github/
    workflows/
    ISSUE_TEMPLATE/
    PULL_REQUEST_TEMPLATE.md
```

---

## 15. SecDevOps Requirements

### 15.1 Security Principles

- Static-first design
- No secrets in the frontend
- No user data collection
- No generated artifact storage
- No server-side execution path for user input
- No third-party analytics capturing generated template content
- Strict dependency hygiene
- Supply chain controls in CI/CD
- Security checks block release

### 15.2 CI/CD Pipeline

```
1.  Checkout
2.  Install dependencies
3.  Dependency audit (npm audit)
4.  License check
5.  Secret scan (GitHub secret scanning)
6.  Lint (ESLint + Prettier)
7.  Type check
8.  Unit tests (Vitest)
9.  Data schema validation (Zod)
10. Source registry validation
11. Relationship validation
12. Build static site
13. Accessibility smoke tests
14. Playwright E2E tests
15. Generate SBOM (CycloneDX)
16. Publish preview artifact
17. Deploy to GitHub Pages on protected branch
```

### 15.3 Security Acceptance Criteria

- No high/critical dependency vulnerabilities at release unless explicitly risk-accepted in repo
- No secrets detected
- No generated template data transmitted to external services
- No runtime dependency on unauthorized external scripts
- Content Security Policy defined
- Static deployment reproducible from source
- Source registry validation passes
- All data files pass schema validation

---

## 16. Privacy Requirements

Control Atlas avoids privacy risk by not collecting the data that would create the risk.

- No login, account creation, org profile, or system profile
- No evidence upload or artifact upload
- No template content telemetry
- No saving generated content to remote systems
- No server-side processing of generated content
- Optional UI preferences may be stored locally; generated template content must not be persisted by default
- No analytics for MVP

---

## 17. Agile Delivery Model

Solo maintainer with AI tooling (Codex, Cursor, Claude). Delivery follows a loose Scrumban approach with two-week sprints. No formal role separation â€” all roles collapse to the maintainer.

**Definition of Ready:** User value is clear. Acceptance criteria are written. Data source dependency is known. Privacy/scope boundary is clear. Security concerns are identified. Test approach is defined.

**Definition of Done:** Code is merged. Acceptance criteria pass. Unit tests pass. Lint/type checks pass. Data schema validation passes. Accessibility checks pass where applicable. Provenance labels are displayed. No new high/critical security findings. Feature does not violate the no-user-data boundary.

---

## 18. Product Backlog

### Epic 0: Control Atlas Full Rename and Phase 0 Baseline

**Goal:** Complete the Control Atlas rename, staged static-build migration, and baseline hardening before any new feature work.

#### Story 0.1 â€” Fork and Rename Repository

Acceptance criteria:
- Repository renamed to `control-atlas`
- All active GovFrame branding removed from codebase
- README updated to reflect Control Atlas product identity
- GitHub Pages deployment confirmed working post-rename

#### Story 0.2 â€” Apply Control Atlas Design Tokens

Acceptance criteria:
- CSS design tokens from Section 13.3 implemented
- Space Grotesk, Public Sans, and JetBrains Mono loaded
- Dark theme renders correctly in all existing views
- No active GovFrame visual identity remains

#### Story 0.3 â€” Extend Node/Edge Schema for Provenance

Acceptance criteria:
- Node schema extended to match Section 10.1
- Edge schema extended to include `provenance_class`, `confidence`, `relationship_type`, `source_refs`, `created_by`, `review_status`
- Schema validation tests written
- Build fails on invalid node/edge data
- Existing runtime data preserved through build-time defaults and schema-safe backfills

#### Story 0.4 â€” Update Graph Renderer

Acceptance criteria:
- Graph edge colors use provenance color tokens
- All provenance colors have accompanying text/icon labels
- User can filter graph by relationship type, provenance, and confidence
- Table fallback view exists and is accessible
- Existing five-artifact D3 graph functionality preserved

#### Story 0.5 â€” Establish CI/CD Pipeline

Acceptance criteria:
- GitHub Actions pipeline matches Section 15.2 stages
- Lint, type check, unit tests, schema validation, and build all pass
- CodeQL and secret scanning enabled
- Dependabot enabled
- Static deployment from protected branch confirmed

---

### Epic 1: Source / Provenance Registry

**Goal:** Build the trust backbone.

#### Story 1.1 â€” Define Source Schema

Acceptance criteria:
- Zod schema exists matching Section 10.3
- Validation fails on missing source_id, owner, class, URL, status, or version
- JSON Schema export generated from Zod schema

#### Story 1.2 â€” Seed MVP Source Registry

Acceptance criteria:
- Registry includes all 10 MVP public sources from Section 9.1
- Each source has source class, status, last checked date, and use notes

#### Story 1.3 â€” Provenance Registry UI

Acceptance criteria:
- User can browse all sources
- User can filter by source class
- User can open source detail page
- Deprecated sources display clear visual warning with text label

---

### Epic 2: Data Normalization Pipeline

**Goal:** Convert public source data into normalized Control Atlas nodes and edges.

#### Story 2.1 â€” NIST OSCAL Importer

Acceptance criteria:
- Build-time importer reads public NIST OSCAL catalog/baseline data
- Controls normalized as nodes with full schema compliance
- Baselines/profiles normalized as nodes
- Control-to-baseline relationships normalized as edges with provenance
- Source metadata retained

#### Story 2.2 â€” STIG/SRG Importer

Acceptance criteria:
- Build-time importer reads public STIG/SRG data
- Rules normalized as nodes with severity, rule ID, vuln ID, title, check text, fix text, references
- Source metadata retained

#### Story 2.3 â€” CCI Mapping Importer

Acceptance criteria:
- CCI records normalized
- CCI-to-control relationships created where public source data supports them
- STIG/SRG-to-CCI relationships created where available
- All relationships include provenance class and confidence

#### Story 2.4 â€” Relationship Builder

Acceptance criteria:
- Official mappings marked correctly with `provenance_class`
- Inferred mappings require non-empty `rationale`
- Confidence required on every edge
- Relationship type and provenance class are separate fields
- Validation blocks malformed relationships

---

### Epic 3: Library Browser

**Goal:** Searchable public reference objects with stable deep links.

#### Story 3.1 â€” Search Index (MiniSearch)

Acceptance criteria:
- Static MiniSearch index generated at build time
- Search supports IDs and keywords with field weighting
- Results show object type and source
- Search accessible from every page

#### Story 3.2 â€” Object Detail Pages

Acceptance criteria:
- Each object has a stable deep-link route
- Page shows title, ID, source, version, description, related objects, and source links
- Control pages show related baselines/STIGs/CCIs
- STIG pages show related CCIs/controls

#### Story 3.3 â€” Library Filters

Acceptance criteria:
- Filter by object type, source class, family/severity
- Filters update results without page reload

---

### Epic 4: Crosswalk Workbench

**Goal:** Relationship tables, STIG â†’ CCI â†’ NIST crosswalk, and baseline comparator.

#### Story 4.1 â€” Relationship Table

Acceptance criteria:
- Table shows from, to, relationship type, provenance, confidence, rationale, source references
- Filter by relationship type, provenance, confidence
- Export to CSV, Markdown, JSON

#### Story 4.2 â€” STIG â†’ CCI â†’ NIST Crosswalk

Acceptance criteria:
- User can select STIG/SRG source
- Related CCIs and controls displayed
- Export works
- Inferred relationships labeled

#### Story 4.3 â€” Baseline Comparator

Acceptance criteria:
- Select baseline A and B
- Shows overlap and deltas
- Export to CSV and Markdown
- Source versions displayed

---

### Epic 5: Template Factory

**Goal:** Client-side blank template generation with download.

#### Story 5.1 â€” Template Engine

Acceptance criteria:
- Templates generated client-side only
- No generated content transmitted
- Markdown, CSV, JSON, YAML export all work
- All templates include disclaimer and source metadata
- Template selector leads with artifact type

#### Story 5.2 â€” Security Plan Starter

Acceptance criteria:
- User chooses framework and baseline
- Output includes SSP-style sections, implementation prompts, blank control table, evidence expectation prompts
- No user/system/org data required

#### Story 5.3 â€” Evidence Expectation Matrix

Acceptance criteria:
- User selects control family or controls
- Output includes evidence types, example artifact names, owner role, cadence, notes, source/provenance
- Export works

#### Story 5.4 â€” POA&M Starter

Acceptance criteria:
- Blank POA&M table generated
- All columns from Section 11.3 present
- No findings generated, no scoring included

#### Story 5.5 â€” Inheritance Worksheet

Acceptance criteria:
- Generates worksheet with provider/customer/shared responsibility prompts
- Includes artifact freshness and local delta prompts
- Does not determine inheritance applicability

#### Story 5.6 â€” Reciprocity Checklist

Acceptance criteria:
- Generates checklist with all sections from Section 11.5
- Does not recommend approval or acceptance

---

### Epic 6: Pattern Library

**Goal:** Public-reference authorization guidance with consistent structure.

#### Story 6.1 â€” Pattern Page Template

Acceptance criteria:
- Consistent structure across all pages
- Related controls/templates/sources linked
- Disclaimer shown
- Pages indexed in search

#### Story 6.2 â€” Inheritance Pattern Pages

Acceptance criteria:
- Common control provider, CSP/shared responsibility, enterprise service inheritance covered
- Links to Inheritance Worksheet

#### Story 6.3 â€” Reciprocity Pattern Pages

Acceptance criteria:
- Conceptual explanation and failure patterns covered
- Generic checklist included
- No package-specific claims

#### Story 6.4 â€” RMF/ATO/ATC Pattern Pages

Acceptance criteria:
- Process roles and lifecycle explained
- ATO, ATC, FedRAMP authorization, and local risk acceptance distinguished
- Links to relevant templates

---

### Epic 7: Start Here + Glossary

**Goal:** Entry point for new practitioners and terminology reference.

#### Story 7.1 â€” Start Here Flow

Acceptance criteria:
- Question flow completes in under 60 seconds
- Output is a reference recommendation with links to Library and Templates
- No data stored or transmitted
- Output clearly labeled as reference-only

#### Story 7.2 â€” Glossary

Acceptance criteria:
- All terms from Section 8.7 present
- Terms link to related Library objects and Pattern pages
- Glossary searchable from main search bar
- Source/consensus label on each term

---

### Epic 8: QA, Accessibility, and Release Hardening

#### Story 8.1 â€” E2E Test Suite (Playwright)

Acceptance criteria:
- Tests cover: homepage, Start Here flow, search, provenance registry, object detail page, crosswalk, baseline comparison, template generation, graph and table fallback
- Tests run in CI

#### Story 8.2 â€” Accessibility Pass

Acceptance criteria:
- Keyboard navigation works throughout
- Screen-reader labels present
- Color is never sole indicator â€” text/icon labels verified
- Contrast passes in dark theme

#### Story 8.3 â€” Content Review

Acceptance criteria:
- Pattern pages reviewed for accuracy
- Template language reviewed
- Disclaimers present on all surfaces
- No prohibited claims (compliance determination, authorization recommendation)

#### Story 8.4 â€” Release Candidate

Acceptance criteria:
- All MVP epics complete
- CI/CD green
- No high/critical vulnerabilities
- Data validation green
- Static deployment successful
- Versioned release tag created

---

## 19. Roadmap

Given solo-maintainer pace:

| Phase | Focus                                      | Sprints |
|-------|--------------------------------------------|---------|
| 0     | Control Atlas full rename, staged build, schema extension, CI | 1       |
| 1     | Data backbone (importers, normalization)   | 2â€“3     |
| 2     | Library browser, object pages, search      | 2       |
| 3     | Crosswalks, baseline comparator, export    | 2       |
| 4     | Template Factory (all MVP templates)       | 2â€“3     |
| 5     | Pattern Library, Start Here, Glossary      | 2       |
| 6     | QA, accessibility, hardening, launch       | 1       |

---

## 20. Engineering Metrics

- Build success rate
- Data validation failure count
- Test coverage trend
- Accessibility issue count
- Dependency vulnerability count
- Source freshness
- Parser failure rate

No user content or behavior tracking.

---

## 21. Risk Register

| Risk                                              | Impact | Likelihood | Mitigation                                             |
|---------------------------------------------------|--------|------------|--------------------------------------------------------|
| Scope creep into GRC/evidence tooling             | High   | High       | Maintain explicit product boundary; non-goals in README |
| Inferred mappings mistaken as official            | High   | Medium     | Mandatory provenance/confidence labels with text labels |
| Public source changes break importers             | Medium | High       | Schema validation, source snapshots, parser tests      |
| Users assume templates guarantee compliance       | High   | Medium     | Prominent disclaimers; careful language review         |
| Large datasets slow static site                   | Medium | Medium     | Chunked JSON, MiniSearch static index, lazy loading    |
| Graph unusable at scale                           | Medium | Medium     | Object-local graph views, table fallback required      |
| Accessibility gaps in graph UI                    | Medium | High       | Table fallback required before graph ships             |
| License/source use ambiguity                      | High   | Medium     | Provenance registry license/use notes per source       |
| Supply chain dependency vulnerability             | High   | Medium     | Dependabot, CodeQL, npm audit, SBOM, branch protection |
| Deprecated sources visible without context        | Medium | Medium     | Deprecation status and version warnings in UI          |
| Solo maintainer pace vs. scope                    | Medium | High       | Shared Responsibility Matrix deferred; Start Here and Glossary are low build cost relative to value |

---

## 22. MVP Acceptance Criteria

The MVP is acceptable when:

1. Site deploys publicly as a static site from GitHub Pages
2. No login or backend required
3. Provenance Registry is live and searchable
4. NIST controls are browsable with deep links
5. STIG/SRG references are browsable
6. CCI/control relationships are visible where public data supports them
7. Crosswalk table exists and is exportable
8. Baseline comparator works for MVP baselines
9. Template Factory generates: Security Plan Starter, Evidence Expectation Matrix, POA&M Starter, Inheritance Worksheet, Reciprocity Checklist
10. Generated templates include source metadata and disclaimer
11. No generated content leaves the browser
12. Provenance and confidence labels are visible with text/icon labels (not color alone)
13. Relationship type and provenance class are separate fields on every edge
14. Glossary is searchable and linked from object pages
15. Start Here flow produces a reference recommendation without storing data
16. Site passes CI/CD, security, and accessibility checks
17. README clearly states product boundary and non-goals
18. FedRAMP provenance color is teal, not blue, to avoid collision with interactive primary

---

## 23. README Summary


# Control Atlas

The public map for federal cyber compliance.

Control Atlas is an open-source reference workbench for RMF, ATO, FedRAMP,
STIG, SRG, CCI, reciprocity, inheritance, and control-mapping work. It uses
public federal, DoD, NIST, DISA, MITRE, CISA, FedRAMP, and open-source
materials to generate reference views, crosswalks, relationship maps, and
blank planning templates.

Control Atlas does not ingest evidence, process authorization packages,
store organizational data, connect to eMASS, track system compliance, or
make authorization decisions.

## Core Features

- Provenance registry with source class, version, and trust metadata
- Control and baseline library
- STIG/SRG reference browser
- STIG â†’ CCI â†’ NIST crosswalks
- Baseline comparisons
- Relationship graph with provenance-coded edges
- Reciprocity and inheritance pattern library
- Glossary of federal compliance terminology
- Start Here guided entry point
- Blank template generator (Markdown / CSV / JSON / YAML)

## Product Boundary

Control Atlas is not an official government system. It does not certify,
authorize, assess, score, or approve any system. All mappings and templates
are reference aids based on public sources.

## What This Is Not

- Not eMASS, Xacta, STIG Manager, Vulnerator, or any GRC system
- Not an evidence processor or compliance scoring engine
- Not an authorization package workflow tool
```
