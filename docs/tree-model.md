# The Control Atlas Tree Model

**Status: canonical. Owner-authored doctrine, 2026-07-26.**

This is the foundation of the data layer, the navigation model, and the product's
explanation of itself. The About page derives from it. `scripts/build-framework-data.mjs`
derives from it. Every surface derives from it. When something else in this repo
contradicts this document, this document wins and the other thing is a bug.

---

## 0. The one-sentence rule

**A tree for hierarchy, a graph for relationships.**

One primary tree for orientation, with overlays for threats, technology, evidence,
and lifecycle, so that many-to-many relationships stay honest.

Do not force every cybersecurity object into one literal hierarchy. Some
relationships are true parent-child containment; others are selections, mappings,
or implementation links. Present a simple tree first, then reveal the underlying
graph as the user goes deeper.

## 1. Why this model exists

The owner's framing, which is the product's actual thesis:

> A bunch of orgs and people made shit, wrote shit down, and then made others
> accountable for doing it.

Federal cybersecurity is not incoherent — it is *layered*, and nobody publishes the
map of the layers. Every requirement a practitioner is held to traces back to
somebody's authority, through somebody's risk process, into somebody's framework,
down to somebody's technical check. That chain exists. It is just never shown.

**Showing that chain is the product.** A gap in the chain is a defect to close, not
a limitation to report honestly. Reporting the gap is the same trap this product
exists to get people out of.

This is the cybersecurity-tree theory: context explains the conditions of the work;
roots explain why the work exists; the Cybersecurity trunk gives every area a common
orientation; and the branches, requirements, implementation, assurance, and reusable
work explain how it is carried out. The tree is deliberately not a claim that every
relationship is hierarchical. It is the stable mental model that lets a newcomer
orient themselves before seeing the crosswalks, selections, mappings, and other
many-to-many relationships that form the real graph.

Control Atlas exists to make that model public, useful, and easy to pass on: an
open, people-first common resource that practitioners recommend because it connects
the actual published material without hiding the source, the uncertainty, or the
decision still owned by a responsible person.

---

## 2. The tree

```text
SOIL / CONTEXT
Mission • Systems • Data • Environment • Threats
                         │
                         ▼
ROOTS — WHY
Authorities • Law • Policy • Standards • Source material
                         │
                         ▼
TRUNK
Cybersecurity
                         │
                         ▼
LIMBS — THE NINE DIVISIONS OF THE WORK
Governance · Risk · Compliance · Architecture · Implementation
· Assessment · Operations · Threats & Defense · Knowledge
                         │
                         ▼
BRANCHES — SECURITY DOMAINS
Functions, categories, domains, and control families
                         │
                         ▼
TWIGS — REQUIREMENTS
Controls, enhancements, practices, and assessment objectives
                         │
                         ▼
JUNCTIONS — CORRELATION
CCIs, crosswalks, mappings, and references
                         │
                         ▼
LEAVES — IMPLEMENTATION
SRGs, STIGs, rules, checks, procedures, and countermeasures
                         │
                         ▼
FRUIT — ASSURANCE
Evidence, assessments, findings, POA&Ms, and risk decisions
                         │
                         ▼
ACORNS — REUSABLE WORK
Templates, patterns, common controls, inheritance, and reciprocity
```

### Layer by layer

**SOIL / CONTEXT — the conditions around the tree.** Mission and business purpose,
system type and authorization boundary, information types and impact levels,
operational environment, technology and hosting model, threats and adversary
behavior.

These are **context filters, not parent records.** Control Atlas holds generic
public contexts only — Cloud SaaS, DoD enclave, federal civilian system, CUI
environment, FedRAMP cloud service, national security system. **This is where
Start Here belongs.**

**ROOTS — authority and provenance.** Answers: *why does this requirement exist,
and who says so?* Law (statute, regulation, executive order, contractual
requirement); government policy (OMB memoranda, DoD instructions, CNSSI, agency
policy, federal acquisition requirements); authoritative publications (NIST, DISA,
CISA, FedRAMP, DoD CIO, MITRE).

**Every record must be traceable downward to implementation and upward to one or
more roots.**

**TRUNK — Cybersecurity.** The trunk is now literally the discipline itself, not a
process. It carries no content of its own; it exists so that every limb has one
visible common ancestor. The RMF lifecycle (Prepare → Categorize → Select →
Implement → Assess → Authorize → Monitor) and the cross-cutting concepts — system
boundary, roles and responsibilities, common controls, control inheritance, shared
responsibility, reciprocity, continuous monitoring, risk acceptance, authorization
— are not the spine; they move **into the Governance limb as content.**

> **Vocabulary boundary (2026-08-02).** Trunk, limb, twig and acorn are how we
> reason about the corpus. They are **not** words the product says. Every
> surface calls a limb an **area** ("Cybersecurity, in nine areas"), and the
> ban is enforced by `tests/content-review.test.mjs` — "the internal tree
> vocabulary never reaches rendered copy". Internal identifiers
> (`atlas:LIMB-*`, `ancestor_path`, class names) keep the model's names.
>
> **No area is ever shown empty.** An area whose content is not a published
> catalog names the surface that holds it, via `areaDestinations` in
> `data/curated/tree-spine.json` (Operations → Build's tasks, Knowledge → the
> resource directory). A catalog whose records are parented elsewhere — CCIs
> under the control they cite, procedures under the control they assess — gets
> a browsable root that owns no children (`attachRecords: false`), so browsing
> works without flattening the record's chain to the trunk.

**LIMBS — the nine divisions of the work.** The limbs replace the old TRUNK
(governance/RMF) and MAJOR BRANCHES (frameworks) tiers with a single tier of nine:
Governance, Risk, Compliance, Architecture, Implementation, Assessment, Operations,
Threats & Defense, and Knowledge. Every published catalog attaches to exactly one
limb (see `data/curated/tree-spine.json` and Part A.1 of
`docs/plans/cybersecurity-trunk-and-voice-2026-07-31.md`).

Frameworks and programs are not all the same kind of object, and the product must
say so. This classification is preserved unchanged — it now lives inside the
Compliance and Implementation limbs rather than as its own tier. Classify every
one:

| Type | Examples |
|---|---|
| Control catalog | NIST SP 800-53 |
| Risk framework | NIST RMF |
| Outcome framework | NIST CSF |
| Authorization program | FedRAMP |
| Certification program | CMMC |
| Control-selection method | CNSSI 1253 |
| Implementation standard | DISA SRG / STIG |
| Threat knowledge base | MITRE ATT&CK |
| Defensive knowledge base | MITRE D3FEND |

This classification is load-bearing: without it users assume FedRAMP, RMF, CMMC,
and a STIG are interchangeable frameworks. They are not.

**BRANCHES — internal framework structure. Preserve each source's native
hierarchy. Do not make every source pretend to follow the NIST control-family
model.**

```text
NIST SP 800-53   family → control → enhancement
NIST CSF         function → category → subcategory
CMMC             domain → practice → assessment objective
MITRE ATT&CK     tactic → technique → sub-technique
DISA             SRG → requirement → STIG → rule
```

**TWIGS — atomic requirements.** Controls, enhancements, practices, requirements,
organization-defined parameters, discussion elements, assessment objectives,
determination statements. The lowest level that is still about *what must happen*
rather than which technology does it.

**JUNCTIONS — correlation.** CCIs, crosswalks, mappings, references. See §4.

**LEAVES — implementation.** SRG requirements, STIG rules, benchmark
recommendations, check procedures, fix procedures, configuration settings,
administrative procedures, technical countermeasures, operational processes. One
requirement has many leaves, because Windows, Linux, databases, cloud services,
and applications implement the same requirement differently.

**FRUIT — assurance.** Configuration output, screenshots, logs, policy documents,
account listings, scan results, interview responses, test results, findings,
vulnerabilities, POA&M entries, residual-risk statements, authorization decisions.

**Control Atlas does not ingest organizational evidence.** It publishes evidence
*expectations*: example evidence types, validation questions, blank evidence
matrices, and links between requirements and expected proof. **It must never imply
that evidence exists or that a control is compliant.**

> **Decision, 2026-08-02 — those expectations are quoted, never authored.**
> Epic 5 removed product-authored guidance from records for good reason, and an
> evidence list we write ourselves is a determination wearing a different hat.
> The publisher already answers this: NIST SP 800-53A ships assessment
> objectives, methods (examine / interview / test) and objects per control, and
> all of it is already in the graph. Surface *that*, attributed to 800-53A.
> The related "why this exists" idea is closed the same way — the authority
> chain plus the publisher's own Discussion text, not a rationale we compose.
> See `docs/plans/full-records-2026-08-02.md` §1.

**ACORNS — reusable work.** Templates, control implementation patterns,
common-control packages, inheritance worksheets, shared-responsibility matrices,
reciprocity packages, assessment procedures, continuous-monitoring calendars,
reusable implementation examples, machine-readable exports. These seed the next
system, assessment, or organization.

---

## 3. Four relationship classes — keep them separate in data AND in the UI

This is the part most likely to be violated by accident. Conflating these is what
makes a graph unreadable and a hierarchy dishonest.

### Class 1 — Structural (real tree edges)

```text
contains · parent_of · decomposes_into
```

These and only these form the spine. They are what the breadcrumb walks.

### Class 2 — Applicability (selections and overlays)

```text
selected_by_baseline · included_in_profile · modified_by_overlay · applicable_to
```

**Render as badges or filters. Never as parent branches.** A FedRAMP baseline does
not *own* AC-2 — it selects and modifies requirements from a catalog. Putting
baselines in the spine misrepresents how control selection works.

### Class 3 — Correlation (graph edges)

```text
maps_to · implements · supports · references · overlaps
mitigates · assessed_by · evidenced_by · supersedes
```

CCIs, crosswalks, ATT&CK mappings, and framework equivalencies live here.

**Going *down* the tree and going *sideways* to another framework must never look
alike.**

### Class 4 — Organizing (Control Atlas's own structure — NOT publisher-declared)

```text
organizes
```

This is the trunk, the limbs, and every catalog→limb attachment. It is **not**
`contains` and must never be reported as publisher-declared. Every UI surface that
renders an `organizes` hop must visually mark it as Control Atlas's own organizing
layer (badge text: "Control Atlas structure", not a source name).

The two derived parentages introduced with the trunk spine (CCI→control,
assessment procedure→control) are also `organizes`, not `contains` — they are real
structural facts (the CCI already cites the control; the assessment procedure
already carries an `assesses` edge to it) but they are *derived*, not published as
containment by DISA or NIST, so they carry the same visible badge.

---

## 4. CCIs are junctions, not ordinary children

A CCI is the lowest-level decomposition layer used to normalize and correlate
individual requirements from RMF controls and other authoritative sources. It is
**a bridge in the middle, not the root of its own family tree.**

CCI identifiers encode no hierarchy. `CCI-000123` is not a child of `CCI-000122`,
and the number tells you nothing about family or control. The hierarchy lives
entirely in the CCI's references and mappings.

```text
Control or enhancement
        │
Assessment objective
        │
        ├──────── CCI ──────── SRG requirement
        │                         │
        │                         └── STIG rule
        │
        └──────── Other mappings or assessment content
```

**Do not render:**

```text
AC-2
└── CCI-000123        ← implies one permanent parent. Wrong.
```

**Render:**

```text
CCI-000123
Connected to:
├── AC-2
├── AC-2 assessment objective…
├── SRG requirement…
└── STIG rules…
```

A CCI page shows: the normalized requirement statement; authoritative source
references; related control or enhancement; related assessment objectives; SRGs
using it; STIG rules using it; version and status history; related evidence
expectations.

One CCI appears in many SRGs, STIGs, rules, and technologies. One STIG rule may
reference many CCIs. The relationship is many-to-many and must stay that way.

---

## 5. The chain the product teaches

```text
Mission and system context
        ↓
Law, regulation, and government policy
        ↓
Risk-management framework
        ↓
Control catalog or compliance program
        ↓
Baseline, profile, or overlay selection
        ↓
Family, domain, function, or category
        ↓
Control, practice, or requirement
        ↓
Enhancement or subrequirement
        ↓
Assessment objective
        ↕
CCI correlation junction
        ↕
SRG requirement
        ↓
STIG rule
        ↓
Check, fix, procedure, or countermeasure
        ↓
Expected evidence
        ↓
Assessment result or finding
        ↓
POA&M and residual-risk treatment
        ↓
Authorization and continuous monitoring
```

Baselines, profiles, CCIs, and crosswalks appear as **selection or connection
layers**, never forced into the parent-child spine.

---

## 6. How the surfaces map to the tree

Navigation keeps professional, plain-language labels. **The tree metaphor lives
inside Atlas — it is not the nav vocabulary.** Roots/Twigs/Acorns never appear as
menu items.

| Surface | Job | Tree relationship |
|---|---|---|
| **Start Here** | Situation → what applies to you | SOIL / CONTEXT layer |
| **Atlas** | Understand the whole tree | The tree itself, through lenses |
| **Limb assignment** | Every published catalog belongs to exactly one limb | see `docs/plans/cybersecurity-trunk-and-voice-2026-07-31.md` Part A.1 |
| **Library** | Find any object | The complete object catalog |
| **Compare** | See across branches | Class-3 correlation edges |
| **Commons** | External ecosystem | Supporting resources *linked to* tree nodes, never members of the tree |
| **Guides** | Explain how the forest works | Process layer over the trunk |
| **Documents** | Produce fruit and acorns | FRUIT + ACORNS layers |

> **Naming note.** This document is a doctrine call, not a naming and branding
> call (owner, 2026-07-26). The user-facing labels are decided separately; see
> `docs/plans/sprint-handoff-2026-07-26.md` §10. The *jobs* above are doctrine and
> do not change with the labels.

### Atlas lenses — the same records, viewed differently

Atlas opens by asking what the user is trying to understand:

```text
1. Why does this requirement exist?
2. What applies to my type of system?
3. What does a framework require?
4. How is a control implemented?
5. How is something assessed?
6. What document or evidence do I need?
```

Then offers lenses over one canonical dataset — **additional lenses, never
separate datasets**:

- **Structure**: Authority → Framework → Domain/family → Requirement → Implementation → Assurance
- **RMF**: Prepare → Categorize → Select → Implement → Assess → Authorize → Monitor
- **Implementation**: Control → Assessment objective ↔ CCI → SRG → STIG → Rule → Check/fix
- **Threat and defense**: ATT&CK tactic → technique → sub-technique ↔ D3FEND countermeasure ↔ Control ↔ Implementation guidance
- **Artifact**: RMF activity → Required work product → Inputs → Owner → Template → Validation → Related controls

### Documents organizes by the work, not by the publisher

Lead with *what are you trying to produce?* Framework selection comes after.

```text
Plan       — security plan, system boundary worksheet, roles and responsibilities
Implement  — control implementation statements, inheritance matrix, shared-responsibility matrix
Assess     — assessment plan, evidence expectation matrix, STIG evidence checklist, test worksheet
Remediate  — POA&M, risk statement, exception request
Monitor    — continuous-monitoring strategy, monitoring calendar, change-impact worksheet
```

### Guides organizes by practitioner question, not by publication

Starting an authorization · Understanding RMF · Selecting controls · Implementing
controls · Preparing evidence · Conducting assessments · Managing findings ·
Continuous monitoring · Inheritance and common controls · Reciprocity · Cloud and
shared responsibility · STIG lifecycle.

Each guide: what this means → where it sits in the tree → when it matters →
common mistakes → what good looks like → related tree nodes → related documents →
authoritative sources → next action.

---

## 7. Record page anatomy — every record, same shape

```text
1.  What this is
2.  Where it sits in the tree          ← persistent, always visible
3.  Why it exists
4.  Where it applies
5.  What it requires
6.  What decomposes beneath it
7.  What implements it
8.  How it is assessed
9.  What evidence normally supports it
10. Related frameworks and threats
11. What to do next
12. Official text, provenance, and version
```

**Items 3 and 9 are closed as of 2026-08-02, and closed as publisher-sourced
content — never as Control Atlas authored guidance.** Epic 5 (2026-07-28)
deliberately deleted the curated 800-53 translation dataset and its generator
specifically to keep records source-first; a per-record "why it exists"
rationale or "what evidence supports it" list authored by Control Atlas would
rebuild exactly what that epic removed, and `PRODUCT_DECISION_BOUNDARY` treats
"what evidence supports this control" as a determination in all but name when
we author it. Both reader needs turned out to already be answerable from
publisher text already in the pipeline, just not surfaced:

- **Item 3, "why it exists"**: the "Where this sits" rail (item 2) plus a new
  **Discussion** section carrying the publisher's own explanatory prose —
  NIST calls this "Discussion" in SP 800-53/800-171/800-172. It was being
  ingested and then discarded: the OSCAL normalizer walked both the
  `statement` and `guidance` parts of a control into one blended, 1,200-char-
  capped `description` field. `tools/normalizers/oscal-normalize.mjs` now
  keeps them as two distinct fields (`description`, `metadata.discussion`)
  with no length cap on either, and `ObjectDetailPage.tsx` renders Discussion
  as its own card, attributed to the publisher.
- **Item 9, "what evidence normally supports it"**: NIST SP 800-53A's
  assessment objectives, methods (EXAMINE/INTERVIEW/TEST), and objects were
  already being parsed per control (`buildAssessmentMetadata`) and already
  powered a separate `assessment_procedure` node — but nothing rendered its
  content anywhere, including on its own record page. `ObjectDetailPage.tsx`
  now renders it in a "What evidence normally supports it" card on the
  control's own page (duplicated onto the control node's own metadata, not
  looked up cross-shard, because `src/app/atlas-neighborhood.mjs` only ships
  a compact id/type/title tuple for a record's connected counterparts) and on
  the assessment_procedure's own page.
- **Item 6, "what decomposes beneath it"**: a control's published
  `decomposes_into` edges render in a distinct **Decomposes into** block beside
  the record heading. They are compact, keyboard-operable record links and are
  excluded from the generic Connections groups, preserving the Class-1
  structural/correlation boundary.

Do not reopen these as authoring tasks. If a future reader need surfaces here
again, the fix is finding or ingesting more of the publisher's own text, not
writing Control Atlas's own explanation or evidence list.

Item 2 is the **"Where this sits" tree path** — the single most important
addition to the current record pages:

```text
NIST › SP 800-53 Rev. 5 › Access Control › AC-2 Account Management
      › AC-2(1) Automated System Account Management
```

Underneath it, the three relationship classes, visually distinct:

```text
Selected by        [Moderate] [High] [FedRAMP Moderate]      ← applicability
Correlated through [CCI-xxxxxx] [CCI-yyyyyy]                 ← correlation
Implemented by     [Windows STIG] [Linux STIG] [App SRG]     ← correlation
Assessed through   [Assessment objectives] [Evidence expectations]
```

---

## 8. The disclosure order — every surface, every time

```text
Tree path → plain explanation → nearby connections → implementation
          → evidence → source detail
```

This is the existing translation-first rule (intent, meaning, relationships,
trust, action, then raw detail) and the existing Shallow → Wading → Deep
constraint, expressed as one sequence. A newcomer gets a stable mental model; a
practitioner is not misled about how the data actually relates.

The canonical data remains one node-and-edge graph. The user experiences it as a
tree with overlays. **Both statements must stay true at once** — that is the whole
design.
