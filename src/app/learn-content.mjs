/**
 * Practitioner guides follow the directory contract in docs/PAGE_CONTRACTS.md.
 * Each answers a real federal-cybersecurity-work
 * question, not a product-interface question. `explanation` states only
 * well-established, citable fact about the concept; `limitations` states
 * what Control Atlas does not decide. Every citation points to the same
 * publication already ingested as that concept's own Catalog entry, so the
 * guide never asserts anything beyond what the cited, published source says.
 */
export const practitionerGuides = Object.freeze([
  {
    id: "starting-an-authorization",
    kind: "practitioner",
    title: "Starting an authorization",
    summary: "What has to happen before any control gets implemented.",
    whereItSits: "SP 800-37 Rev. 2's Prepare, Categorize, and Select steps; FIPS 199/200 and SP 800-53B feed Categorize and Select.",
    whenItMatters: "Before system-specific work begins — this is organizational and system preparation, not implementation.",
    explanation: "An authorization begins with organization- and system-level preparation, categorizing the system's impact level, and selecting a control baseline. NIST SP 800-37 Rev. 2 defines these as the RMF's Prepare, Categorize, and Select steps, completed before Implement.",
    limitations: "Control Atlas shows the published framework steps and baseline structure. It does not determine your system's impact level, select your baseline, or substitute for your authorizing official's risk decision.",
    nextAction: { label: "Browse SP 800-37 in Catalog", view: "catalog-detail", patch: { catalog: "nist-800-37" } },
    citations: [
      { sourceId: "nist-800-37-rev2", role: "official-subject-source", label: "SP 800-37 Rev. 2 — Risk Management Framework for Information Systems", url: "https://csrc.nist.gov/pubs/sp/800/37/r2/final", supports: "Defines the RMF steps this guide describes." },
    ],
    templates: [],
  },
  {
    id: "understanding-rmf",
    kind: "practitioner",
    title: "Understanding RMF",
    summary: "The seven steps and what each one produces for the next.",
    whereItSits: "SP 800-37 Rev. 2 is the RMF's own publication.",
    whenItMatters: "As the organizing sequence for every other guide on this page — each one maps to a step.",
    explanation: "The Risk Management Framework is NIST's seven-step process for managing information security and privacy risk: Prepare, Categorize, Select, Implement, Assess, Authorize, and Monitor. Each step's output is the next step's input.",
    limitations: "Control Atlas surfaces the published step structure and the records tied to each step. It does not run the process or make step decisions for you.",
    nextAction: { label: "Browse SP 800-37 in Catalog", view: "catalog-detail", patch: { catalog: "nist-800-37" } },
    citations: [
      { sourceId: "nist-800-37-rev2", role: "official-subject-source", label: "SP 800-37 Rev. 2 — Risk Management Framework for Information Systems", url: "https://csrc.nist.gov/pubs/sp/800/37/r2/final", supports: "The seven-step framework this guide summarizes." },
    ],
    templates: [],
  },
  {
    id: "selecting-controls",
    kind: "practitioner",
    title: "Selecting controls",
    summary: "Starting from a published baseline instead of a blank list.",
    whereItSits: "SP 800-53B publishes the Low/Moderate/High federal control baselines; FedRAMP and CMMC publish their own baselines built on SP 800-53.",
    whenItMatters: "RMF's Select step — after categorization, before implementation.",
    explanation: "Control selection starts from a published baseline (Low, Moderate, or High for federal systems, or a program-specific baseline such as FedRAMP or CMMC), then tailors it with scoping decisions and documented compensating controls where justified.",
    limitations: "Control Atlas shows published baseline membership for each control. It does not choose your baseline or approve a tailoring decision.",
    nextAction: { label: "Browse SP 800-53B in Catalog", view: "catalog-detail", patch: { catalog: "nist-800-53b" } },
    citations: [
      { sourceId: "nist-800-53b-baselines", role: "official-subject-source", label: "SP 800-53B — Control Baselines for Information Systems and Organizations", url: "https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final", supports: "Publishes the baselines this guide describes." },
    ],
    templates: [],
  },
  {
    id: "implementing-controls",
    kind: "practitioner",
    title: "Implementing controls",
    summary: "Turning a selected control into a technical or procedural setting.",
    whereItSits: "DISA STIGs and SRGs publish concrete technical implementation, check, and fix guidance for many controls' technical requirements.",
    whenItMatters: "RMF's Implement step.",
    explanation: "Implementation turns a selected control into system-specific settings, configurations, and technical or procedural measures. Where a technology-specific STIG or SRG exists, it publishes the exact setting, check, and fix text; other controls are implemented through organizational policy and procedure.",
    limitations: "Control Atlas shows published STIG/SRG check and fix text where it exists. It does not verify your system's actual configuration or confirm implementation is complete.",
    nextAction: { label: "Browse DISA STIG in Catalog", view: "catalog-detail", patch: { catalog: "disa-stig" } },
    citations: [
      { sourceId: "disa-stig-library", role: "official-subject-source", label: "DISA Security Technical Implementation Guides (STIGs)", url: "https://www.cyber.mil/stigs/", supports: "Publishes the technical implementation, check, and fix guidance this guide describes." },
    ],
    templates: [],
  },
  {
    id: "preparing-evidence",
    kind: "practitioner",
    title: "Preparing evidence",
    summary: "What an assessor actually examines, interviews, or tests.",
    whereItSits: "SP 800-53A publishes each control's own assessment objectives, methods, and objects.",
    whenItMatters: "Before an assessment starts — evidence is gathered against a published, control-specific expectation, not assembled generically.",
    explanation: "Assessment evidence is what an assessor examines, interviews about, or tests to determine whether a control is implemented as described. SP 800-53A publishes the assessment objectives, methods, and objects each control's own assessment procedure expects.",
    limitations: "Control Atlas surfaces the published objectives and methods on each control's assessment-procedure record. It does not generate evidence or determine whether your evidence is sufficient.",
    nextAction: { label: "Browse SP 800-53A in Catalog", view: "catalog-detail", patch: { catalog: "nist-800-53a" } },
    citations: [
      { sourceId: "nist-800-53a-assessment-procedures", role: "official-subject-source", label: "SP 800-53A Rev. 5 — Assessing Security and Privacy Controls", url: "https://csrc.nist.gov/pubs/sp/800/53/a/r5/final", supports: "Publishes the assessment objectives and methods this guide describes." },
    ],
    templates: [],
  },
  {
    id: "conducting-assessments",
    kind: "practitioner",
    title: "Conducting assessments",
    summary: "Applying published methods against a control's stated objectives.",
    whereItSits: "SP 800-53A's examine, interview, and test methods, applied per control.",
    whenItMatters: "RMF's Assess step, producing the security assessment report the authorizing official reviews.",
    explanation: "An assessment applies SP 800-53A's published methods — examine, interview, test — against each control's stated objectives, and the results feed the security assessment report.",
    limitations: "Control Atlas shows the published objectives and methods for a control's own assessment procedure. It does not perform the assessment or produce a report.",
    nextAction: { label: "Browse SP 800-53A in Catalog", view: "catalog-detail", patch: { catalog: "nist-800-53a" } },
    citations: [
      { sourceId: "nist-800-53a-assessment-procedures", role: "official-subject-source", label: "SP 800-53A Rev. 5 — Assessing Security and Privacy Controls", url: "https://csrc.nist.gov/pubs/sp/800/53/a/r5/final", supports: "Publishes the assessment methods this guide describes." },
    ],
    templates: [],
  },
  {
    id: "managing-findings",
    kind: "practitioner",
    title: "Managing findings",
    summary: "Tracking a gap from finding to remediation to re-assessment.",
    whereItSits: "A Plan of Action and Milestones (POA&M) register, the standing FedRAMP/OMB pattern for tracking open findings.",
    whenItMatters: "After an assessment identifies a control that isn't satisfied — remediation is tracked, not silent.",
    explanation: "A finding from an assessment that a control isn't satisfied becomes a Plan of Action and Milestones (POA&M) entry: tracked, remediated on a schedule, and re-assessed to close it out.",
    limitations: "Control Atlas provides a POA&M working-register starter document. It does not track your live remediation status or close findings for you.",
    nextAction: { label: "Open the POA&M Working Register", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "fedramp-rev5", role: "official-subject-source", label: "FedRAMP Assessment and Authorization Artifacts", url: "https://www.fedramp.gov/documents-templates/", supports: "Documents the POA&M pattern this guide describes." },
    ],
    templates: [],
  },
  {
    id: "continuous-monitoring",
    kind: "practitioner",
    title: "Continuous monitoring",
    summary: "What keeps an authorization current after it's granted.",
    whereItSits: "SP 800-37 Rev. 2's Monitor step — the last of the seven, and the only one that doesn't end.",
    whenItMatters: "After authorization, on the cadence your organization's continuous monitoring strategy sets.",
    explanation: "Monitor is RMF's ongoing step: tracking control effectiveness, system changes, and vulnerability status after authorization, on the cadence the organization's continuous monitoring strategy defines.",
    limitations: "Control Atlas provides a delivery-calendar starter document for scheduling monitoring deliverables. It does not perform monitoring or assess control effectiveness.",
    nextAction: { label: "Open the Continuous Monitoring Delivery Calendar", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "nist-800-37-rev2", role: "official-subject-source", label: "SP 800-37 Rev. 2 — Risk Management Framework for Information Systems", url: "https://csrc.nist.gov/pubs/sp/800/37/r2/final", supports: "Defines the Monitor step this guide describes." },
    ],
    templates: [],
  },
  {
    id: "inheritance-and-common-controls",
    kind: "practitioner",
    title: "Inheritance and common controls",
    summary: "Why the same control doesn't get assessed twice.",
    whereItSits: "FedRAMP baselines and provider authorization packages document which controls a cloud service inherits versus implements itself.",
    whenItMatters: "When a system relies on infrastructure or a service someone else already authorized.",
    explanation: "A common control is implemented and assessed once by a provider, then inherited by every system that relies on it, avoiding duplicate assessment work. FedRAMP baselines and a provider's own package document what's inherited versus customer-implemented.",
    limitations: "Control Atlas provides an inheritance worksheet starter document. It does not verify a specific provider's inheritance claims or confirm what your system actually inherits.",
    nextAction: { label: "Open the Inheritance Worksheet", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "fedramp-rev5", role: "official-subject-source", label: "FedRAMP Rev. 5 Security Controls Baselines", url: "https://www.fedramp.gov/documents-templates/", supports: "Documents the baseline structure inheritance is scoped against." },
    ],
    templates: [],
  },
  {
    id: "reciprocity",
    kind: "practitioner",
    title: "Reciprocity",
    summary: "Reusing an existing assessment instead of starting over.",
    whereItSits: "FedRAMP's program is built around federal agencies reusing one provider's existing authorization.",
    whenItMatters: "When another organization already assessed or authorized the same system, service, or control set you need.",
    explanation: "Reciprocity means accepting another organization's existing assessment or authorization instead of re-assessing from scratch, when the same risk basis still applies. FedRAMP's authorization model exists specifically so federal agencies can reuse one cloud provider's authorization.",
    limitations: "Control Atlas provides a reciprocity package review starter document. It does not determine whether a specific existing authorization is valid for your use case.",
    nextAction: { label: "Open the Reciprocity Package Review", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "fedramp-rev5", role: "official-subject-source", label: "FedRAMP Rev. 5 Security Controls Baselines", url: "https://www.fedramp.gov/documents-templates/", supports: "Represents the FedRAMP program this guide's reciprocity example describes." },
    ],
    templates: [],
  },
  {
    id: "cloud-and-shared-responsibility",
    kind: "practitioner",
    title: "Cloud and shared responsibility",
    summary: "Who owns which control depends on the service model.",
    whereItSits: "FedRAMP is the federal program for authorizing cloud services and documenting each offering's shared-responsibility split.",
    whenItMatters: "Whenever a system runs on infrastructure, a platform, or software someone else operates.",
    explanation: "Cloud shared responsibility splits security obligations between the cloud service provider and the customer. Exactly which controls each side owns depends on the service model — IaaS, PaaS, or SaaS — and is documented per offering, not assumed.",
    limitations: "Control Atlas shows the published FedRAMP baseline a cloud offering is assessed against. It does not state a specific provider's shared-responsibility split — read that provider's own documentation.",
    nextAction: { label: "Browse FedRAMP Rev. 5 in Catalog", view: "catalog-detail", patch: { catalog: "fedramp-rev5" } },
    citations: [
      { sourceId: "fedramp-rev5", role: "official-subject-source", label: "FedRAMP Rev. 5 Security Controls Baselines", url: "https://www.fedramp.gov/documents-templates/", supports: "The federal cloud-authorization baseline this guide references." },
    ],
    templates: [],
  },
  {
    id: "stig-lifecycle",
    kind: "practitioner",
    title: "STIG lifecycle",
    summary: "From technology-class requirement to product-specific rule to retirement.",
    whereItSits: "DISA publishes Security Requirements Guides (SRGs, technology-class) and STIGs (product-specific), revising both on a recurring schedule.",
    whenItMatters: "When implementing or auditing a specific product — the STIG version and its revision date determine which rules apply.",
    explanation: "A STIG moves from a Security Requirements Guide (SRG, a technology-class baseline) to a product-specific STIG, gets periodically revised as DISA reassesses risk, and is retired or superseded when a newer version or the product itself is deprecated.",
    limitations: "Control Atlas shows the published STIG/SRG rule text and revision from the cited public source. It does not track whether a newer revision has since been released — check the DISA library directly for currency.",
    nextAction: { label: "Browse DISA STIG in Catalog", view: "catalog-detail", patch: { catalog: "disa-stig" } },
    citations: [
      { sourceId: "disa-stig-library", role: "official-subject-source", label: "DISA Security Technical Implementation Guides (STIGs)", url: "https://www.cyber.mil/stigs/", supports: "Publishes the STIG/SRG lifecycle this guide describes." },
    ],
    templates: [],
  },
]);

export const learnArticles = Object.freeze([
  {
    id: "hierarchy-and-relationships",
    title: "Hierarchy and relationships are different",
    summary: "Read structural ancestry separately from mappings, choices, evidence, and implementation links.",
    explanation:
      "A structural path follows only hierarchy declared by the publisher. Baselines select from a catalog; mappings correlate records; evidence and implementation resources support work. None of those becomes a structural parent.",
    limitations:
      "Control Atlas can show how records are grouped and linked. It cannot decide which baseline, mapping, or implementation applies to an organization.",
    nextAction: { label: "Open the Atlas", view: "atlas-map" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "The publisher-declared catalog and control hierarchy used in the example; it does not define Control Atlas navigation." },
    ],
    templates: [],
  },
  {
    id: "source-truth-and-notes",
    title: "Publisher text and Control Atlas notes",
    summary: "Distinguish publisher text and identity from navigation labels and product explanations.",
    explanation:
      "Official titles, identifiers, text, and publication links retain their source identity. Labels that explain navigation or relationship classes are Control Atlas explanations, not publisher language.",
    limitations:
      "A Control Atlas explanation is a reading aid. Use the cited publication and responsible authority for substantive decisions.",
    nextAction: { label: "Review Sources", view: "sources" },
    citations: [
      { sourceId: "nist-csf-2", role: "official-subject-source", label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20", supports: "The official publication identity and subject matter used in the example; it does not author Control Atlas notes." },
    ],
    templates: [],
  },
  {
    id: "search-eligibility-and-ranking",
    title: "How Search eligibility and ranking work",
    summary: "See why exact identifiers, ambiguous text, active filters, and zero results behave differently.",
    explanation:
      "Search first determines which records match the query and active filters. Exact identifiers may open one unique canonical record. Ambiguous text stays in Search, and ranking orders only eligible matches. A zero result remains zero.",
    limitations:
      "Search ranking does not establish importance, applicability, or authority for a particular system or program.",
    nextAction: { label: "Open Search", view: "search" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "Examples of published identifiers and titles searchable in Control Atlas; Search eligibility and ranking are Control Atlas behavior." },
    ],
    templates: [],
  },
  {
    id: "read-a-record",
    title: "How to read a record",
    summary: "Check the record ID, publisher text, publication details, and formal crosswalks.",
    explanation:
      "Start with the record ID and publisher-authored name. Read the complete publisher text, then check publication details and any formal crosswalks.",
    limitations:
      "A record page does not establish that the record applies, is implemented, or is satisfied.",
    nextAction: { label: "Open the Library", view: "catalog-detail" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "The official record identifiers, titles, and hierarchy used in the reading example." },
    ],
    templates: [],
  },
  {
    id: "published-mappings-in-compare",
    title: "Use published mappings in Compare",
    summary: "Treat a crosswalk as cited correlation evidence, not equivalence or a compliance conclusion.",
    explanation:
      "Compare displays mappings and other recorded relationships with their source, derivation, and confidence. Two records can be related without being equivalent, interchangeable, or sufficient for the same outcome.",
    limitations:
      "Control Atlas cannot infer an unmapped relationship or decide that one requirement satisfies another.",
    nextAction: { label: "Open Compare", view: "matrix" },
    citations: [
      { sourceId: "nist-olir-csf2-to-sp800-53", role: "official-subject-source", label: "NIST CSF 2.0 Concept Crosswalk to SP 800-53 5.2.0 (draft)", url: "https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/Cybersecurity_Framework_v2-0_Concept_Crosswalk_800-53_5_2_0_draft.xlsx", supports: "A published mapping source used by Compare; it does not establish equivalence or applicability." },
    ],
    templates: [],
  },
  {
    id: "starter-documents-and-judgment",
    title: "Starter documents preserve user judgment",
    summary: "Check required inputs, source citations, previews, downloads, and explicit unselected values.",
    explanation:
      "Starter documents use only the inputs selected in Build. Required inputs fail closed; optional values remain unselected. Preview and Download use the same validated snapshot and include cited source context and limitations.",
    limitations:
      "A generated starter document is not evidence, an authorization package, a compliance result, or an authorizing-authority decision.",
    nextAction: { label: "Open Starter documents", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "nist-ssdf", role: "official-subject-source", label: "NIST SP 800-218 SSDF Version 1.1", url: "https://csrc.nist.gov/pubs/sp/800/218/final", supports: "Subject matter that a starter document may cite; preview and download snapshot behavior is authored by Control Atlas." },
    ],
    templates: [],
  },
]);

export function learnArticleById(id) {
  return (
    practitionerGuides.find((article) => article.id === id) ||
    learnArticles.find((article) => article.id === id) ||
    null
  );
}
