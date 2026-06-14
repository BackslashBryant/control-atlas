# Product Requirements Document

# Control Atlas

**Product Name:** Control Atlas
**Tagline:** Public maps and templates for federal cyber compliance.
**Product Type:** Open-source static reference and template workbench
**Primary Platform:** GitHub Pages / static `.io` site
**Primary Users:** Federal/DoD auditors, assessors, ISSOs, ISSMs, engineers, compliance managers, contractors, CSPs, and RMF/ATO practitioners
**Document Version:** 1.0
**Prepared For:** Development Team
**Status:** Ready for MVP planning

---

## Repository Implementation Baseline

This PRD defines product intent and scope. For this repository, the existing static JavaScript application, build-time public-data pipeline, source registry schema `4.0`, and generated federal graph contracts are adopted implementation decisions.

Where later sections present recommended technologies, repository layouts, source vocabularies, or open choices that conflict with the working implementation, the adopted repository architecture and ADRs take precedence. A framework, TypeScript, schema-vocabulary, repository-name, package-name, import-path, or deployment-path migration requires a separate approved plan. No such migration is required before continuing the Control Atlas roadmap.

---

## 1. Executive Summary

Control Atlas is an open-source, public-data-only reference workbench for federal and DoD cybersecurity compliance. It helps practitioners understand how public controls, baselines, STIGs, SRGs, CCIs, MITRE frameworks, FedRAMP materials, RMF concepts, inheritance patterns, reciprocity concepts, and authorization templates relate to each other.

Control Atlas is **not** a GRC system, evidence processor, eMASS replacement, scanner parser, compliance scoring engine, or authorization package manager.

The core product value is:

> Help practitioners navigate federal cyber compliance using public mappings, provenance-aware relationships, reusable reference views, and blank templates without collecting user, system, organizational, or evidence data.

---

## 2. Product Vision

Control Atlas should become the public reference layer people wish existed before starting RMF, ATO, FedRAMP, STIG, reciprocity, inheritance, and audit-prep work.

The site should answer questions like:

* What public controls, baselines, STIGs, SRGs, CCIs, and MITRE references relate to this topic?
* What is the difference between NIST Moderate and FedRAMP Moderate?
* Which STIG/SRG requirements appear to support a NIST control?
* What evidence is typically expected for a control or STIG rule?
* What are common inheritance and reciprocity patterns?
* What blank templates can I generate to help structure my work?
* Which mappings are official, public, community-sourced, or inferred?

---

## 3. Product Boundary

### 3.1 In Scope

Control Atlas may:

* Use public federal, DoD, NIST, DISA, MITRE, CISA, FedRAMP, and open-source data.
* Normalize public source data at build time.
* Display public control catalogs, baselines, STIGs, SRGs, CCIs, mappings, and source metadata.
* Generate blank templates locally in the browser.
* Export blank or public-reference templates as Markdown, CSV, JSON, YAML, or OSCAL-style skeletons.
* Show relationship graphs between public control/reference objects.
* Label source provenance, mapping confidence, and relationship type.
* Provide generic reciprocity, inheritance, shared-responsibility, and RMF/ATO pattern guidance.
* Provide reference-only evidence expectation matrices.

### 3.2 Out of Scope

Control Atlas must not:

* Ingest user evidence.
* Upload, store, parse, or process user SSPs, SARs, SAPs, POA&Ms, ACAS scans, STIG results, SCAP results, CKLs, CKLBs, XCCDF result files, or eMASS exports.
* Connect to eMASS, Xacta, Archer, ServiceNow GRC, Tenable, ACAS, SCC, STIG Manager, or other operational systems.
* Track real asset compliance.
* Determine whether a system is compliant.
* Score an organization, system, package, or authorization boundary.
* Recommend authorization decisions.
* Store user profiles, organization names, system names, boundary descriptions, assets, findings, weaknesses, milestones, or evidence artifacts.
* Require login.
* Provide workflow/task management for real authorization packages.
* Generate completed compliance artifacts from user system data.
* Imply official federal, DoD, DISA, NIST, FedRAMP, MITRE, or CISA endorsement.

### 3.3 Product Disclaimer

The site must display a disclaimer in the footer, About page, and template export metadata:

> Control Atlas is an open-source reference and template-generation tool based on public sources. It is not an official government system and does not make authorization, compliance, assessment, or risk acceptance decisions. Mappings and templates are reference aids only. Official decisions remain with the applicable Authorizing Official, agency, assessor, program office, or governing authority.

---

## 4. Target Users and Personas

### 4.1 ISSO / ISSM

**Needs:**

* Quickly understand control relationships.
* Build blank planning worksheets.
* Explain inheritance, reciprocity, evidence expectations, and control intent.
* Prepare for assessment discussions.

**Pain Points:**

* Repetitive documentation.
* Unclear control relationships.
* Stale inheritance assumptions.
* Tool-specific confusion.
* Ambiguous evidence expectations.

### 4.2 Assessor / Auditor / SCA

**Needs:**

* Trace STIG/SRG/CCI/control relationships.
* Understand public baseline differences.
* Create assessment planning templates.
* Reference evidence expectations without asking for user data.

**Pain Points:**

* Inconsistent implementation statements.
* Poorly structured artifacts.
* False positives and unclear rationale.
* Vague inherited-control claims.

### 4.3 Engineer / System Integrator

**Needs:**

* Understand which controls and STIGs affect technical implementation.
* Translate control language into expected technical evidence.
* See relationship between hardening references and control families.
* Avoid late surprises during ATO package review.

**Pain Points:**

* Compliance language is hard to connect to real implementation.
* STIGs and controls feel disconnected.
* Control inheritance and shared responsibility are often unclear.

### 4.4 Program Manager / Compliance Manager

**Needs:**

* Understand process patterns.
* Generate planning templates.
* Compare baselines.
* Communicate scope, boundary, reciprocity, and evidence expectations.

**Pain Points:**

* Authorization timelines are opaque.
* Reciprocity is often misunderstood.
* Package reuse is difficult to explain.
* Stakeholders confuse FedRAMP authorization, agency ATO, DoD authorization, and local risk acceptance.

### 4.5 Contractor / CSP / Small Vendor

**Needs:**

* Learn what public sources apply.
* Build starter templates before engaging consultants or assessors.
* Understand FedRAMP, RMF, STIG, reciprocity, inheritance, and shared responsibility concepts.

**Pain Points:**

* High cost of entry.
* Confusing source ecosystem.
* Unclear relationship between public baselines and real authorization work.

---

## 5. Core Product Principles

1. **Public data only.**
   Control Atlas uses public sources and build-time data imports only.

2. **No user/org/system data.**
   The product must not require or retain organizational context.

3. **Reference before automation.**
   The site clarifies, maps, compares, and templates. It does not certify, assess, or authorize.

4. **Provenance is mandatory.**
   Every source, relationship, and generated template section must trace back to public source metadata or be labeled as inferred.

5. **Relationship meaning and trust must stay separate.**
   `relationship_type` describes what the relationship means.
   `provenance_class` describes why it should be trusted.

6. **Client-side generation only.**
   Templates are generated locally in the browser from static public data.

7. **No dark patterns.**
   No login wall, no telemetry on generated content, no hidden data collection.

8. **Practitioner-first language.**
   Content should be useful to operators, technicians, assessors, auditors, and ISSOs. Avoid unnecessary academic or corporate language.

---

## 6. Product Information Architecture

Control Atlas should use five top-level sections.

```text
1. Library
2. Crosswalks
3. Patterns
4. Templates
5. Sources
```

### 6.1 Library

Purpose: Browse public reference content.

Includes:

* NIST controls
* NIST baselines
* FedRAMP baselines
* DISA STIG/SRG content
* CCIs
* MITRE ATT&CK / D3FEND relationships
* CISA references where applicable
* RMF/ATO/ATC glossary
* Public-source metadata

### 6.2 Crosswalks

Purpose: Explore relationships between public frameworks and references.

Includes:

* NIST control to FedRAMP baseline mapping
* NIST control to STIG/SRG/CCI mapping
* STIG/SRG to CCI to NIST mapping
* ATT&CK to D3FEND to control mapping
* Baseline comparison views
* Relationship graph
* Source/provenance labels
* Mapping confidence labels

### 6.3 Patterns

Purpose: Explain common authorization and audit patterns.

Includes:

* RMF lifecycle reference
* ATO/ATC reference
* Reciprocity reference
* Inheritance models
* Shared responsibility models
* Common control provider patterns
* FedRAMP reuse concepts
* DoD reciprocity friction
* Boundary and scope patterns
* Common failure modes
* Evidence expectation patterns

### 6.4 Templates

Purpose: Generate blank, reference-driven planning templates.

Includes:

* Security Plan Starter
* Control Implementation Statement Worksheet
* Evidence Expectation Matrix
* STIG Evidence Checklist
* Inheritance Worksheet
* Reciprocity Checklist
* Shared Responsibility Matrix Starter
* POA&M Starter
* Assessment Planning Worksheet
* Continuous Monitoring Calendar

### 6.5 Sources

Purpose: Show trust, provenance, version, and source metadata.

Includes:

* Source registry
* Source class
* Source owner
* Source URL
* Source version
* Last checked date
* License/use notes
* Data parser status
* Normalization status
* Mapping status
* Deprecated/superseded source flag

---

## 7. MVP Scope

### 7.1 MVP Goal

Deliver a static, searchable, public reference site that provides:

1. Source registry
2. NIST control browser
3. FedRAMP/NIST baseline browser
4. STIG/SRG reference browser
5. STIG → CCI → NIST crosswalk
6. Baseline comparison
7. Evidence Expectation Matrix generator
8. Security Plan Starter generator
9. POA&M Starter generator
10. Inheritance and Reciprocity Worksheet generator
11. Public relationship graph
12. Provenance/confidence labeling

### 7.2 MVP Non-Goals

The MVP will not include:

* Backend database
* User accounts
* Authentication
* Saved workspaces
* Scan ingestion
* Evidence upload
* eMASS import/export
* STIG checklist ingestion
* Completed SSP generation
* Compliance scoring
* Operational dashboards
* Workflow management

---

## 8. Feature Requirements

## 8.1 Feature: Source Registry

### Description

The Source Registry is the trust backbone of Control Atlas. It catalogs all public sources used by the system.

### Functional Requirements

* Display all sources in a searchable/filterable table.
* Show source owner, source class, status, version, URL, last checked date, parser status, and use in Control Atlas.
* Support source classes:

  * `federal_authoritative`
  * `dod_authoritative`
  * `nist_authoritative`
  * `disa_authoritative`
  * `fedramp_authoritative`
  * `mitre_published`
  * `cisa_published`
  * `federal_utilized`
  * `community_open_source`
  * `inferred`
  * `deprecated`
* Every normalized node must reference a `source_id`.
* Every normalized edge must reference one or more `source_refs`.

### Acceptance Criteria

* User can view all source records.
* User can filter by source class.
* User can distinguish official/federal/public/community/inferred material.
* Every displayed mapping has a visible source or is clearly labeled as inferred.
* Deprecated or superseded sources are visually labeled.

---

## 8.2 Feature: Library Browser

### Description

The Library provides searchable public reference content.

### Functional Requirements

* Search by control ID, STIG ID, CCI ID, keyword, baseline, family, source, and source class.
* Display normalized records for:

  * NIST controls
  * Control families
  * Baselines/profiles
  * FedRAMP overlays/baselines
  * STIG rules
  * SRG requirements
  * CCIs
  * MITRE ATT&CK techniques
  * MITRE D3FEND countermeasures
* Support deep links for each object.
* Support copyable object IDs.
* Support object detail pages with:

  * title
  * source
  * version
  * description
  * related objects
  * provenance
  * relationship graph subset
  * template actions where applicable

### Acceptance Criteria

* User can search `AC-2` and see the control detail page.
* User can search a STIG rule identifier and see related CCIs and controls.
* User can search `account management` and see controls, STIGs, and references.
* User can copy a stable link to any object page.

---

## 8.3 Feature: Crosswalk Workbench

### Description

The Crosswalk Workbench shows how public sources relate to each other.

### Functional Requirements

* Display relationship tables with:

  * source object
  * target object
  * relationship type
  * provenance class
  * confidence
  * rationale
  * source references
* Support relationship types:

  * `maps_to`
  * `supports`
  * `implements`
  * `overlaps`
  * `references`
  * `derived_from`
  * `supersedes`
  * `related_to`
* Support provenance classes:

  * `official`
  * `federal_published`
  * `dod_published`
  * `nist_published`
  * `disa_published`
  * `fedramp_published`
  * `mitre_published`
  * `community_open_source`
  * `inferred`
* Support confidence values:

  * `high`
  * `medium`
  * `low`
* Allow filtering by framework, source class, relationship type, and confidence.
* Provide export of visible crosswalks to CSV/JSON/Markdown.

### Acceptance Criteria

* User can view STIG → CCI → NIST relationships.
* User can distinguish official mappings from inferred mappings.
* User can export visible mappings.
* User can filter to only official/federal-published mappings.
* User can filter to include inferred mappings.

---

## 8.4 Feature: Baseline Comparator

### Description

The Baseline Comparator helps users compare public baselines and profiles.

### Functional Requirements

* Compare selected baselines:

  * NIST Low/Moderate/High
  * FedRAMP Low/Moderate/High
  * Additional public baselines as available
* Display:

  * controls included in both
  * controls only in baseline A
  * controls only in baseline B
  * parameterized controls
  * enhancements added/removed
  * source and version
* Export comparison to CSV/Markdown/JSON.

### Acceptance Criteria

* User can compare NIST Moderate to FedRAMP Moderate.
* User can see deltas between selected baselines.
* User can export the comparison.
* Comparison output clearly states source versions.

---

## 8.5 Feature: STIG/SRG Rule Browser

### Description

The STIG/SRG browser provides a reference-only view of public STIG/SRG data.

### Functional Requirements

* Browse public STIGs/SRGs by product, platform, severity, title, CCI, control reference, and keyword.
* Display:

  * STIG ID
  * Rule ID
  * Vulnerability ID
  * severity/CAT
  * title
  * discussion
  * check text
  * fix text
  * CCI references
  * NIST control references where available
  * source version
* Provide “Generate STIG Evidence Checklist” action.
* Provide “View related controls” action.

### Acceptance Criteria

* User can search for a STIG rule.
* User can see related CCI/control references.
* User can generate a blank evidence checklist for selected STIG rules.
* Site does not store or evaluate real STIG status.

---

## 8.6 Feature: Authorization Pattern Library

### Description

The Pattern Library provides generic, public-reference explanations of authorization concepts.

### Functional Requirements

Include pages for:

* RMF lifecycle
* ATO vs ATC
* ATO vs FedRAMP authorization
* Reciprocity basics
* Reciprocity failure patterns
* Control inheritance
* Common control provider model
* Shared responsibility model
* Cloud service provider inheritance
* Enterprise service inheritance
* Boundary and scope patterns
* Body of Evidence reuse
* POA&M and residual risk concepts
* Continuous monitoring artifact cadence
* Evidence expectation patterns

Each pattern page should include:

* Plain-language explanation
* Common practitioner friction
* Public source references
* Related controls
* Related templates
* “Do / Do Not” guidance
* Limitations and disclaimers

### Acceptance Criteria

* User can read a generic inheritance pattern page.
* User can generate an inheritance worksheet from the pattern page.
* Pattern pages do not ask for organization/system details.
* Pattern pages do not make authorization recommendations.

---

## 8.7 Feature: Template Factory

### Description

The Template Factory generates blank, reference-driven templates locally in the browser.

### Functional Requirements

Supported template outputs:

1. Security Plan Starter
2. Control Implementation Statement Worksheet
3. Evidence Expectation Matrix
4. STIG Evidence Checklist
5. Inheritance Worksheet
6. Reciprocity Checklist
7. Shared Responsibility Matrix Starter
8. POA&M Starter
9. Assessment Planning Worksheet
10. Continuous Monitoring Calendar

Supported output formats:

* Markdown
* CSV
* JSON
* YAML
* OSCAL-style skeleton where appropriate

Template selector fields:

* Artifact type
* Framework/source
* Baseline/profile
* Control family
* Selected controls
* Selected STIG/SRG references
* Environment archetype:

  * Generic
  * Cloud SaaS
  * Platform service
  * Enclave
  * On-premises system
  * Hybrid system
  * Enterprise service
* Include options:

  * implementation prompts
  * evidence expectations
  * inheritance prompts
  * reciprocity prompts
  * STIG references
  * source/provenance footnotes
  * placeholder fields
  * OSCAL-style structure

### Privacy Requirements

* All template generation occurs in the browser.
* Generated template contents are not sent to a server.
* No generated content is logged.
* No user data is stored in local storage unless explicitly required for UI state, and generated content must not be persisted by default.
* No analytics events may include generated template content.

### Acceptance Criteria

* User can generate a blank SSP starter for NIST Moderate.
* User can generate a POA&M starter table without entering system data.
* User can generate an evidence expectation matrix for selected controls.
* User can download output as Markdown and CSV.
* Generated artifacts include source/version metadata.
* Generated artifacts include disclaimer language.

---

## 8.8 Feature: Relationship Graph

### Description

The Relationship Graph visualizes public relationships between controls, STIGs, CCIs, baselines, techniques, defenses, and sources.

### Functional Requirements

* Graph nodes:

  * controls
  * baselines
  * STIG rules
  * SRG requirements
  * CCIs
  * ATT&CK techniques
  * D3FEND countermeasures
  * templates
  * sources
* Graph edges:

  * relationship type
  * provenance class
  * confidence
* User can filter graph by:

  * node type
  * source
  * relationship type
  * confidence
  * provenance
* Graph must have accessible fallback table view.
* Graph should support deep links.

### Acceptance Criteria

* User can open graph from a control detail page.
* User can see related STIGs, CCIs, baselines, and templates.
* User can filter out inferred relationships.
* User can switch to table view.

---

## 9. Data Sources

### 9.1 MVP Source Priority

| Priority | Source Type                   | Use                                                           |
| -------: | ----------------------------- | ------------------------------------------------------------- |
|        1 | NIST OSCAL catalogs/baselines | Control catalog, baselines, templates                         |
|        2 | DISA STIG/SRG public content  | STIG/SRG browser, check/fix reference, evidence prompts       |
|        3 | CCI references                | STIG/SRG to NIST bridge                                       |
|        4 | FedRAMP baselines/templates   | Baseline comparison, template structure                       |
|        5 | MITRE ATT&CK                  | Threat technique relationships                                |
|        6 | MITRE D3FEND                  | Defensive countermeasure relationships                        |
|        7 | ComplianceAsCode              | Public SCAP/XCCDF/OVAL pattern reference                      |
|        8 | PowerSTIG                     | Organizational setting/deviation/template concepts            |
|        9 | STIG Manager                  | STIG assessment data model concepts                           |
|       10 | Vulnerator                    | Practitioner source vocabulary and report-aggregation lessons |

### 9.2 Source Handling Rules

* Public sources are imported only at build time.
* All imported source files must be versioned or hashed.
* Every normalized object must retain source traceability.
* Every mapping must show whether it is official, published, community, or inferred.
* Inferred relationships must include rationale.
* Deprecated sources must remain visible only when relevant and clearly marked.
* Build should fail if required source fields are missing.

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
    - shared_responsibility_matrix
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

## 11. Template Requirements

### 11.1 Security Plan Starter

Must include:

* Title page placeholder
* Document metadata
* Disclaimer
* System overview placeholder
* Authorization boundary placeholder
* System environment placeholder
* Data types placeholder
* User roles placeholder
* Interconnections placeholder
* Control baseline table
* Control implementation statement prompts
* Inheritance prompts
* Evidence expectation table
* Revision history
* Source metadata

Must not include:

* Real system name
* Real organization name
* Real asset list
* Actual implementation claims
* Compliance status

### 11.2 Evidence Expectation Matrix

Columns:

* Control ID
* Control title
* Control family
* Related STIG/SRG references
* Related CCIs
* Evidence type
* Example artifact names
* Suggested evidence owner role
* Suggested review cadence
* Notes
* Source/provenance
* Confidence

Example evidence types:

* Policy
* Procedure
* Configuration screenshot
* System-generated report
* Access review
* Scan output
* Interview
* Architecture diagram
* Change record
* Training record
* Incident record
* Log sample
* Inventory export
* Exception/deviation memo

### 11.3 POA&M Starter

Columns:

* Weakness ID
* Source of discovery
* Related control
* Related STIG/SRG
* Weakness description
* Risk statement
* Severity
* Planned remediation
* Milestone
* Scheduled completion date
* Responsible role
* Status
* Deviation/exception reference
* Risk acceptance reference
* Evidence needed for closure
* Notes

Generated template must be blank.

### 11.4 Inheritance Worksheet

Columns:

* Control ID
* Control title
* Inheritance type
* Common control provider
* Provider responsibility
* Customer/system responsibility
* Shared responsibility notes
* Evidence dependency
* Artifact freshness concern
* Local delta review needed
* Source/provenance
* Notes

### 11.5 Reciprocity Checklist

Sections:

* Granting authorization/package reference placeholder
* Receiving organization placeholder
* Body of Evidence checklist
* Boundary comparison prompts
* Control delta prompts
* POA&M review prompts
* Risk acceptance prompts
* Artifact freshness prompts
* AO decision prompts
* Local implementation responsibility prompts
* Caveats and limitations

### 11.6 STIG Evidence Checklist

Columns:

* STIG title
* STIG ID
* Rule ID
* Vulnerability ID
* Severity
* Requirement title
* Check text summary
* Fix text summary
* CCI references
* Related controls
* Evidence expectation
* Validation method
* Not Applicable justification prompt
* Deviation/exception prompt
* Notes

---

## 12. UX Requirements

### 12.1 General UX

* Fast static site.
* No login.
* No modal-heavy interface.
* Clear top navigation.
* Search must be central.
* Control IDs and STIG IDs must be copyable.
* Every source/mapping must have visible provenance.
* Every graph view must have table fallback.
* Templates must be generated in three clicks or fewer after selection.
* Avoid language implying official authorization or certification.

### 12.2 Homepage

Must include:

* Hero:

  * “Federal cyber compliance, mapped.”
* Subtext:

  * “Explore public controls, baselines, STIGs, reciprocity patterns, inheritance models, and blank RMF/ATO templates without uploading evidence or storing organizational data.”
* CTAs:

  * Explore Library
  * Compare Crosswalks
  * Generate Template
* Product pillars:

  * Library
  * Crosswalks
  * Patterns
  * Templates
  * Sources

### 12.3 Accessibility

* Meet WCAG 2.1 AA or newer.
* Keyboard navigation required.
* Color cannot be the only status/provenance indicator.
* Provide text labels with icons/colors.
* Ensure contrast for dark theme.
* Table views must be screen-reader usable.
* Graphs require accessible fallback.

---

## 13. Branding Requirements

### 13.1 Name

Use:

> Control Atlas

### 13.2 Tagline

Use:

> Public maps and templates for federal cyber compliance.

### 13.3 Visual Direction

Theme:

* Dark technical blueprint
* Atlas/cartography
* Control graph
* Provenance labels
* Federal cyber credibility without looking like a fake government site

### 13.4 Color Tokens

```css
:root {
  --ca-bg: #0B1020;
  --ca-surface: #111827;
  --ca-surface-raised: #1E293B;
  --ca-border: #334155;

  --ca-text: #F8FAFC;
  --ca-text-muted: #CBD5E1;

  --ca-primary: #2563EB;
  --ca-secondary: #22D3EE;
  --ca-accent: #F59E0B;

  --ca-success: #16A34A;
  --ca-warning: #F59E0B;
  --ca-danger: #DC2626;

  --ca-font-display: "Space Grotesk", system-ui, sans-serif;
  --ca-font-body: "Public Sans", system-ui, sans-serif;
  --ca-font-mono: "JetBrains Mono", monospace;
}
```

### 13.5 Provenance Colors

| Meaning                  | Color  |
| ------------------------ | ------ |
| Official / authoritative | Blue   |
| DoD-published            | Indigo |
| NIST-published           | Cyan   |
| DISA-published           | Navy   |
| FedRAMP-published        | Blue   |
| MITRE-published          | Violet |
| Community                | Slate  |
| Inferred                 | Gold   |
| Deprecated               | Red    |
| Active                   | Green  |

All colors must have text/icon labels.

---

## 14. Technical Architecture

### 14.1 Architecture Style

Control Atlas should be a static-first site.

Recommended architecture:

```text
Public Sources
      ↓
Build-Time Importers
      ↓
Raw Source Cache
      ↓
Normalization Pipeline
      ↓
Schema Validation
      ↓
Relationship Builder
      ↓
Static Data Bundles
      ↓
Static Web App
      ↓
Client-Side Search / Template Generation / Export
```

### 14.2 Runtime Requirements

* Site hosted on GitHub Pages or equivalent static hosting.
* No backend API required for MVP.
* No database required for MVP.
* No authentication.
* No server-side template generation.
* No server-side logging of generated content.
* No user-uploaded files required.
* Static JSON/JSONL/YAML data bundles generated during build.

### 14.3 Recommended Tech Stack

| Layer             | Recommendation                                     |
| ----------------- | -------------------------------------------------- |
| Language          | TypeScript                                         |
| Frontend          | React, Vue, SvelteKit static, Astro, or equivalent |
| Build             | Vite or Astro                                      |
| Search            | MiniSearch, Lunr, Fuse, or static index            |
| Graph             | Cytoscape.js, Sigma.js, or D3 with table fallback  |
| Data validation   | JSON Schema, Zod, or TypeBox                       |
| Testing           | Vitest/Jest, Playwright                            |
| Linting           | ESLint, Prettier                                   |
| CI/CD             | GitHub Actions                                     |
| Hosting           | GitHub Pages                                       |
| Exports           | Browser-generated Markdown/CSV/JSON/YAML           |
| Security scanning | CodeQL, Dependabot, npm audit, secret scanning     |
| SBOM              | CycloneDX or Syft                                  |

### 14.4 Repository Structure

```text
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

* Static-first design.
* No secrets in the frontend.
* No user data collection.
* No generated artifact storage.
* No server-side execution path for user input.
* No third-party analytics that collect generated template content.
* Strict dependency hygiene.
* Supply chain controls in CI/CD.
* Security checks block release.

### 15.2 CI/CD Pipeline

Required GitHub Actions stages:

```text
1. Checkout
2. Install dependencies
3. Dependency audit
4. License check
5. Secret scan
6. Lint
7. Type check
8. Unit tests
9. Data schema validation
10. Source registry validation
11. Relationship validation
12. Build static site
13. Accessibility smoke tests
14. Playwright E2E tests
15. Generate SBOM
16. Publish preview artifact
17. Deploy to GitHub Pages on protected branch
```

### 15.3 Required Security Tooling

* GitHub Dependabot
* GitHub secret scanning
* CodeQL
* Dependency review
* npm/pnpm audit
* SBOM generation
* Branch protection
* Required PR reviews
* Signed commits preferred
* Protected release workflow

### 15.4 Security Acceptance Criteria

* No high/critical dependency vulnerabilities at release unless explicitly risk-accepted in repo.
* No secrets detected.
* No generated template data transmitted to external services.
* No runtime dependency on unauthorized external scripts.
* Content Security Policy defined.
* Static deployment reproducible from source.
* Source registry validation passes.
* All data files have schema validation.

---

## 16. Privacy Requirements

### 16.1 Privacy Position

Control Atlas is designed to avoid privacy risk by not collecting the data that would create the risk.

### 16.2 Requirements

* No login.
* No account creation.
* No org profile.
* No system profile.
* No evidence upload.
* No artifact upload.
* No template content telemetry.
* No saving generated content to remote systems.
* No server-side processing of generated content.
* Optional UI preferences may be stored locally, but not generated template content.

### 16.3 Analytics

If analytics are used, they must be privacy-preserving and must not capture:

* control selections tied to user identity
* generated template content
* entered free text
* downloaded template contents
* IP-linked behavior beyond basic aggregate telemetry

Preferred MVP approach: no analytics.

---

## 17. Agile Delivery Model

### 17.1 Delivery Method

Use Scrum or Scrumban with two-week sprints.

### 17.2 Recommended Roles

| Role                 | Responsibilities                                       |
| -------------------- | ------------------------------------------------------ |
| Product Owner        | Scope, roadmap, backlog priority, acceptance decisions |
| Tech Lead            | Architecture, code quality, technical direction        |
| Data Lead            | Source registry, parsers, normalization, provenance    |
| Frontend Lead        | UI, UX, accessibility, graph, search                   |
| SecDevOps Lead       | CI/CD, security checks, supply chain, deployment       |
| QA/Test Lead         | Acceptance criteria, automated tests, regression       |
| Content/SME Reviewer | RMF, ATO, STIG, evidence language accuracy             |

### 17.3 Definition of Ready

A story is ready when:

* User value is clear.
* Acceptance criteria are written.
* Data source dependency is known.
* Privacy/scope boundary is reviewed.
* Security concerns are identified.
* UX state is clear enough for implementation.
* Test approach is defined.

### 17.4 Definition of Done

A story is done when:

* Code is merged through PR.
* Acceptance criteria pass.
* Unit tests pass.
* Relevant integration/E2E tests pass.
* Lint/type checks pass.
* Data schema validation passes.
* Accessibility checks pass where applicable.
* Source/provenance labels are displayed.
* Documentation updated.
* No new high/critical security findings.
* Feature does not violate no-user-data boundary.

---

## 18. Product Backlog

## Epic 1: Project Foundation

### Goal

Establish repository, architecture, CI/CD, design tokens, and static deployment.

### Stories

#### Story 1.1 — Initialize Repository

As a developer, I need a structured repository so that the team can build consistently.

Acceptance criteria:

* Repo structure matches architecture.
* README exists.
* LICENSE exists.
* CONTRIBUTING.md exists.
* SECURITY.md exists.
* PR template exists.
* Issue templates exist.

#### Story 1.2 — Static Site Skeleton

As a user, I need a basic static site so that I can navigate Control Atlas.

Acceptance criteria:

* Site deploys to GitHub Pages.
* Top nav includes Library, Crosswalks, Patterns, Templates, Sources.
* Footer includes disclaimer.
* Dark theme tokens are implemented.
* Site passes basic accessibility checks.

#### Story 1.3 — CI/CD Pipeline

As a maintainer, I need automated checks so that the site remains secure and stable.

Acceptance criteria:

* GitHub Actions runs on PR.
* Lint/type/test/build steps pass.
* Dependency audit runs.
* CodeQL runs.
* Secret scanning enabled.
* Static site deploys from protected branch.

---

## Epic 2: Source Registry

### Goal

Create the public-source trust backbone.

### Stories

#### Story 2.1 — Define Source Schema

Acceptance criteria:

* JSON Schema or Zod schema exists.
* Required fields are enforced.
* Validation fails on missing source ID, owner, class, URL, status, or version.

#### Story 2.2 — Seed MVP Source Registry

Acceptance criteria:

* Registry includes MVP public sources.
* Each source has source class.
* Each source has status.
* Each source has last checked date.
* Each source has use notes.

#### Story 2.3 — Source Registry UI

Acceptance criteria:

* User can browse sources.
* User can filter by source class.
* User can open source detail page.
* Deprecated sources display clear warning.

---

## Epic 3: Data Normalization Pipeline

### Goal

Convert public source data into normalized Control Atlas nodes and edges.

### Stories

#### Story 3.1 — Define Node and Edge Schemas

Acceptance criteria:

* Node schema implemented.
* Edge schema implemented.
* Validation tests exist.
* Build fails on invalid node/edge data.

#### Story 3.2 — NIST OSCAL Importer

Acceptance criteria:

* Build-time importer reads public NIST OSCAL catalog/baseline data.
* Controls are normalized as nodes.
* Baselines/profiles are normalized as nodes.
* Control-to-baseline relationships are normalized as edges.
* Source metadata retained.

#### Story 3.3 — STIG/SRG Importer

Acceptance criteria:

* Build-time importer reads public STIG/SRG data.
* Rules are normalized as nodes.
* Severity, rule ID, vuln ID, title, check text, fix text, and references are retained.
* Source metadata retained.

#### Story 3.4 — CCI Mapping Importer

Acceptance criteria:

* CCI records are normalized.
* CCI-to-control relationships are created where public source data supports them.
* STIG/SRG-to-CCI relationships are created where available.
* All relationships include provenance.

#### Story 3.5 — Relationship Builder

Acceptance criteria:

* Official mappings are marked correctly.
* Inferred mappings require rationale.
* Confidence is required.
* Relationship type and provenance class are separate.
* Validation blocks malformed relationships.

---

## Epic 4: Library Browser

### Goal

Provide searchable public reference objects.

### Stories

#### Story 4.1 — Search Index

Acceptance criteria:

* Static search index generated at build time.
* Search supports IDs and keywords.
* Results show object type and source.
* Search performs acceptably on MVP dataset.

#### Story 4.2 — Object Detail Page

Acceptance criteria:

* Each object has stable route.
* Page shows title, ID, source, version, description, related objects, and source links.
* Control pages show related baselines/STIGs/CCIs where available.
* STIG pages show related CCIs/controls where available.

#### Story 4.3 — Library Filters

Acceptance criteria:

* User can filter by object type.
* User can filter by source class.
* User can filter by family/severity where applicable.
* Filters update results without page reload.

---

## Epic 5: Crosswalk Workbench

### Goal

Expose relationship tables and baseline comparisons.

### Stories

#### Story 5.1 — Relationship Table

Acceptance criteria:

* Table shows from, to, relationship type, provenance, confidence, rationale, and source references.
* User can filter by relationship type.
* User can filter by provenance.
* User can filter by confidence.
* User can export table.

#### Story 5.2 — STIG → CCI → NIST Crosswalk

Acceptance criteria:

* User can select a STIG/SRG source.
* User can view related CCIs and controls.
* User can export crosswalk.
* Inferred relationships are labeled.

#### Story 5.3 — Baseline Comparator

Acceptance criteria:

* User can select baseline A and baseline B.
* Comparator shows overlap and deltas.
* Export supports CSV and Markdown.
* Source versions are displayed.

---

## Epic 6: Template Factory

### Goal

Generate blank reference-driven templates locally in the browser.

### Stories

#### Story 6.1 — Template Engine

Acceptance criteria:

* Templates generated client-side.
* No generated content is transmitted.
* Markdown export works.
* CSV export works.
* JSON export works.
* Generated templates include disclaimer and source metadata.

#### Story 6.2 — Security Plan Starter

Acceptance criteria:

* User can choose framework and baseline.
* Output includes SSP-style sections and implementation prompts.
* Output includes blank control table.
* Output includes evidence expectation prompts.
* No user/system/org data required.

#### Story 6.3 — Evidence Expectation Matrix

Acceptance criteria:

* User can select control family or controls.
* Output includes evidence types, example artifact names, owner role, cadence, notes, source/provenance.
* Output is blank/reference-only.
* Export works.

#### Story 6.4 — POA&M Starter

Acceptance criteria:

* User can generate blank POA&M table.
* Table includes weakness, risk, milestone, owner role, status, evidence closure fields.
* No findings are generated.
* No scoring is included.

#### Story 6.5 — Inheritance Worksheet

Acceptance criteria:

* User can generate inheritance worksheet.
* Worksheet includes provider/customer/shared responsibility prompts.
* Worksheet includes artifact freshness and local delta prompts.
* Does not determine inheritance applicability.

#### Story 6.6 — Reciprocity Checklist

Acceptance criteria:

* User can generate reciprocity checklist.
* Checklist includes BoE, boundary, POA&M, artifact freshness, and AO decision prompts.
* Does not recommend approval or acceptance.

---

## Epic 7: Pattern Library

### Goal

Provide public-reference authorization guidance.

### Stories

#### Story 7.1 — Pattern Page Template

Acceptance criteria:

* Pattern pages use consistent structure.
* Related controls/templates/sources are linked.
* Disclaimer shown.
* Pages are searchable.

#### Story 7.2 — Inheritance Pattern Pages

Acceptance criteria:

* Includes common control provider pattern.
* Includes CSP/shared responsibility pattern.
* Includes enterprise service inheritance pattern.
* Links to inheritance worksheet.

#### Story 7.3 — Reciprocity Pattern Pages

Acceptance criteria:

* Explains reciprocity conceptually.
* Explains why reciprocity often fails.
* Includes generic checklist.
* Avoids package-specific claims.

#### Story 7.4 — RMF/ATO/ATC Pattern Pages

Acceptance criteria:

* Explains process roles and lifecycle.
* Distinguishes ATO, ATC, FedRAMP authorization, and local risk acceptance.
* Links to relevant templates.

---

## Epic 8: Relationship Graph

### Goal

Visualize public relationships.

### Stories

#### Story 8.1 — Graph Data API

Acceptance criteria:

* Static graph data generated at build time.
* Graph data references normalized nodes and edges.
* Filtering metadata included.

#### Story 8.2 — Graph UI

Acceptance criteria:

* User can view graph from object page.
* User can filter by relationship type, provenance, and confidence.
* Graph has table fallback.
* Graph is accessible enough for MVP with fallback.

---

## Epic 9: QA, Accessibility, and Release Hardening

### Goal

Ensure stable, accessible, secure public release.

### Stories

#### Story 9.1 — E2E Test Suite

Acceptance criteria:

* Tests cover homepage, search, source registry, object page, crosswalk, baseline comparison, and template generation.
* Tests run in CI.

#### Story 9.2 — Accessibility Pass

Acceptance criteria:

* Keyboard navigation works.
* Basic screen-reader labels exist.
* Color is not sole indicator.
* Contrast passes.

#### Story 9.3 — Content Review

Acceptance criteria:

* SME reviews pattern pages.
* SME reviews template language.
* Disclaimers reviewed.
* Prohibited claims removed.

#### Story 9.4 — Release Candidate

Acceptance criteria:

* All MVP epics complete.
* CI/CD green.
* No high/critical vulnerabilities.
* Data validation green.
* Static deployment successful.
* Versioned release tag created.

---

## 19. Roadmap

### Phase 0 — Foundation

Duration: 1 sprint

Deliverables:

* Repo setup
* CI/CD
* Static site shell
* Design tokens
* Source schema
* Node/edge schema
* Initial source registry

### Phase 1 — Data Backbone

Duration: 2–3 sprints

Deliverables:

* NIST OSCAL importer
* STIG/SRG importer
* CCI importer
* Normalized data bundles
* Source validation
* Relationship validation

### Phase 2 — Reference UI

Duration: 2 sprints

Deliverables:

* Library browser
* Object detail pages
* Search
* Source registry UI
* STIG/SRG browser

### Phase 3 — Crosswalks and Baselines

Duration: 2 sprints

Deliverables:

* Relationship table
* STIG → CCI → NIST crosswalk
* Baseline comparator
* Export functions

### Phase 4 — Template Factory

Duration: 2–3 sprints

Deliverables:

* Template engine
* SSP starter
* Evidence matrix
* POA&M starter
* Inheritance worksheet
* Reciprocity checklist
* STIG evidence checklist

### Phase 5 — Patterns and Graph

Duration: 2 sprints

Deliverables:

* Pattern library
* Relationship graph
* Accessible table fallback
* Source/provenance refinement

### Phase 6 — Public MVP Release

Duration: 1 sprint

Deliverables:

* QA pass
* Accessibility pass
* Content review
* Security hardening
* Release docs
* Public launch

---

## 20. Metrics

### 20.1 Product Metrics

Because privacy is a priority, metrics should avoid user/content tracking.

Recommended aggregate metrics if analytics are later approved:

* Page views by section
* Template type downloaded
* Export format selected
* Search result click rate
* Most viewed public controls
* Most viewed templates
* Broken source/link count
* Build/import failure count

Do not track:

* Generated template contents
* Free-text entered by users
* User identity
* Organization names
* System names
* Evidence contents
* Uploaded files

### 20.2 Engineering Metrics

* Build success rate
* Data validation failure count
* Test coverage trend
* Accessibility issue count
* Dependency vulnerability count
* Time to merge
* Source freshness
* Parser failure rate

---

## 21. Risk Register

| Risk                                                         | Impact | Likelihood | Mitigation                                        |
| ------------------------------------------------------------ | -----: | ---------: | ------------------------------------------------- |
| Scope creep into GRC/evidence tooling                        |   High |       High | Maintain explicit product boundary and non-goals  |
| Inferred mappings mistaken as official                       |   High |     Medium | Mandatory provenance/confidence labels            |
| Public source changes break importers                        | Medium |       High | Schema validation, source snapshots, parser tests |
| Users assume templates guarantee compliance                  |   High |     Medium | Prominent disclaimers and careful language        |
| Large datasets slow static site                              | Medium |     Medium | Chunked JSON, static search index, lazy loading   |
| Graph becomes unusable at scale                              | Medium |     Medium | Object-local graph views and table fallback       |
| Accessibility gaps in graph UI                               | Medium |       High | Table fallback required                           |
| License/source use ambiguity                                 |   High |     Medium | Source registry license/use notes                 |
| Supply chain dependency vulnerability                        |   High |     Medium | Dependabot, CodeQL, audits, SBOM                  |
| Old/deprecated public sources remain visible without context | Medium |     Medium | Deprecation status and version warnings           |

---

## 22. Open Decisions

| Decision           | Options                           | Recommendation                                                |
| ------------------ | --------------------------------- | ------------------------------------------------------------- |
| Frontend framework | Astro, React/Vite, Vue, SvelteKit | Astro or React/Vite                                           |
| Search engine      | MiniSearch, Lunr, Fuse            | MiniSearch for static index                                   |
| Graph library      | Cytoscape.js, D3, Sigma.js        | Cytoscape.js for graph relationships                          |
| Data validation    | JSON Schema, Zod, TypeBox         | Zod for TypeScript runtime validation plus JSON Schema export |
| Data format        | JSON, JSONL, YAML                 | JSON/JSONL for runtime, YAML for curated registry             |
| Template format    | Markdown-first vs JSON-first      | Markdown-first with CSV/JSON/YAML export                      |
| Analytics          | None vs privacy-preserving        | None for MVP                                                  |

---

## 23. MVP Acceptance Criteria

The MVP is acceptable when:

1. Site deploys publicly as a static site.
2. No login or backend is required.
3. Source Registry is live and searchable.
4. NIST controls are browsable.
5. STIG/SRG references are browsable.
6. CCI/control relationships are visible where public data supports them.
7. Crosswalk table exists and is exportable.
8. Baseline comparator works for MVP baselines.
9. Template Factory generates at least:

   * Security Plan Starter
   * Evidence Expectation Matrix
   * POA&M Starter
   * Inheritance Worksheet
   * Reciprocity Checklist
10. Generated templates include source metadata and disclaimer.
11. No generated content leaves the browser.
12. Provenance and confidence labels are visible.
13. Relationship type and provenance are separate fields.
14. Site passes CI/CD, security, and accessibility checks.
15. README clearly states product boundary and non-goals.

---

## 24. README Summary Draft

```markdown
# Control Atlas

Public maps and templates for federal cyber compliance.

Control Atlas is an open-source reference workbench for RMF, ATO, FedRAMP,
STIG, SRG, CCI, reciprocity, inheritance, and control-mapping work. It uses
public federal, DoD, NIST, DISA, MITRE, CISA, FedRAMP, and open-source
materials to generate reference views, crosswalks, relationship maps, and
blank planning templates.

Control Atlas does not ingest evidence, process authorization packages,
store organizational data, connect to eMASS, track system compliance, or
make authorization decisions.

## Core Features

- Public source registry
- Control and baseline library
- STIG/SRG reference browser
- STIG → CCI → NIST crosswalks
- Baseline comparisons
- Relationship graph
- Reciprocity and inheritance pattern library
- Blank template generator
- Markdown/CSV/JSON/YAML exports

## Product Boundary

Control Atlas is not an official government system and does not certify,
authorize, assess, score, or approve any system. All mappings and templates
are reference aids based on public sources.
```

---

## 25. Final Product Recommendation

Build Control Atlas as:

> A static, open-source, public cyber compliance atlas that combines source provenance, framework crosswalks, authorization patterns, and blank template generation.

The product should deliberately avoid becoming:

* eMASS-lite
* Xacta-lite
* STIG Manager-lite
* Vulnerator-lite
* ACAS parser
* Evidence processor
* Compliance scoring engine
* Authorization package workflow tool

The most valuable version of Control Atlas is the one that gives practitioners a reliable map before they begin the work, not another system where they have to upload and manage the work.
