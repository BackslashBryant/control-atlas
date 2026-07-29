export const glossaryData = [
  {
    id: "ato",
    term: "ATO",
    expansion: "Authorization to Operate",
    definition: "The official management decision given by a senior federal official (the Authorizing Official) to authorize operation of an information system and to explicitly accept the risk to agency operations.",
    why_it_matters: "An ATO records who accepted the identified risk, for which system and operating conditions, and for what period.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle", "ato-vs-atc", "ato-vs-fedramp"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "atc",
    term: "ATC",
    expansion: "Authority to Connect",
    definition: "The management decision to allow an information system to connect to a specific network or enclave under stated security conditions.",
    why_it_matters: "An ATC covers connection permission; it is separate from any decision authorizing the system itself.",
    source: "DoDI 8510.01",
    related_patterns: ["ato-vs-atc", "boundary-patterns"],
    related_controls: ["CA-3", "CA-9"]
  },
  {
    id: "fedramp-authorization",
    term: "FedRAMP authorization",
    expansion: "Federal Risk and Authorization Management Program Authorization",
    definition: "A security authorization for a cloud offering based on FedRAMP requirements and review processes.",
    why_it_matters: "Agencies can review and reuse an existing FedRAMP authorization package, but each agency keeps its own use and risk decisions.",
    source: "FedRAMP Program Management Office",
    related_patterns: ["ato-vs-fedramp", "csp-inheritance"],
    related_controls: ["CA-2", "PL-2"]
  },
  {
    id: "rmf",
    term: "RMF",
    expansion: "Risk Management Framework",
    definition: "A structured process that integrates security, privacy, and cyber risk management activities into the system development life cycle.",
    why_it_matters: "RMF connects risk decisions, control selection, assessment, authorization, and monitoring across the system life cycle.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle", "poam-concepts"],
    related_controls: ["PL-2", "CA-2"]
  },
  {
    id: "stig",
    term: "STIG",
    expansion: "Security Technical Implementation Guide",
    definition: "A cybersecurity technical standard created by the Defense Information Systems Agency (DISA) to secure specific software, hardware, or network components.",
    why_it_matters: "A STIG gives administrators product-specific configuration requirements and checks that trace to broader requirements.",
    source: "DISA Cybersecurity Program",
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CM-6", "SI-2"]
  },
  {
    id: "srg",
    term: "SRG",
    expansion: "Security Requirements Guide",
    definition: "High-level security requirement standards published by DISA that define security criteria for a technology area (e.g., application server, OS).",
    why_it_matters: "An SRG supplies technology-area requirements and supports the development of product-specific STIG content.",
    source: "DISA Cybersecurity Program",
    related_patterns: ["evidence-patterns"],
    related_controls: ["CM-6"]
  },
  {
    id: "cci",
    term: "CCI",
    expansion: "Control Correlation Identifier",
    definition: "A standard identifier that decomposes high-level security controls (like NIST SP 800-53) into granular, low-level technical specifications.",
    why_it_matters: "A CCI connects technical requirements to the NIST control language they address; it is not proof that a control is satisfied.",
    source: "DISA Cybersecurity Program",
    related_patterns: ["evidence-patterns"],
    related_controls: ["CM-6"]
  },
  {
    id: "sar",
    term: "SAR",
    expansion: "Security Assessment Report",
    definition: "A document containing the results of testing and evaluating the security controls of an information system, detailing any vulnerabilities found.",
    why_it_matters: "The SAR records assessment results and residual risk information used in an authorization decision.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["boe-reuse", "reciprocity-basics"],
    related_controls: ["CA-2", "CA-5"]
  },
  {
    id: "sap",
    term: "SAP",
    expansion: "Security Assessment Plan",
    definition: "A document detailing the objectives, scope, methodology, schedule, and procedures to be used during the security control assessment.",
    why_it_matters: "The SAP fixes the assessment scope, methods, and responsibilities before testing begins.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CA-2"]
  },
  {
    id: "ssp",
    term: "SSP",
    expansion: "System Security Plan",
    definition: "A comprehensive description of a system's boundary, operational environment, and the controls implemented to meet compliance requirements.",
    why_it_matters: "The SSP records the system boundary, environment, implementation statements, and supporting context that reviewers assess.",
    source: "NIST SP 800-18 Rev. 1",
    related_patterns: ["rmf-lifecycle", "shared-responsibility"],
    related_controls: ["PL-2"]
  },
  {
    id: "poam",
    term: "POA&M",
    expansion: "Plan of Action and Milestones",
    definition: "A document that identifies tasks to be accomplished to remediate vulnerabilities or compliance gaps identified during assessments.",
    why_it_matters: "A POA&M gives each unresolved weakness an action, owner, milestone, and status.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["poam-concepts", "rmf-lifecycle"],
    related_controls: ["CA-5", "PM-4"]
  },
  {
    id: "boe",
    term: "BoE",
    expansion: "Body of Evidence",
    definition: "The collective set of document and system artifacts (SSPs, logs, policies, test results) demonstrating that security controls are properly implemented.",
    why_it_matters: "A body of evidence gives reviewers the artifacts behind implementation and assessment claims; it does not establish compliance by itself.",
    source: "DoDI 8510.01",
    related_patterns: ["boe-reuse", "evidence-patterns"],
    related_controls: ["CA-2", "CA-5"]
  },
  {
    id: "reciprocity",
    term: "reciprocity",
    expansion: "Reciprocity",
    definition: "The mutual agreement to accept another organization's security assessment results, reducing redundant testing and accelerating authorizations.",
    why_it_matters: "Reciprocity can reduce repeated work when the receiving authority accepts the source package's scope, evidence, freshness, and risk conditions.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["reciprocity-basics", "reciprocity-failures", "boe-reuse"],
    related_controls: ["CA-2", "SA-9"]
  },
  {
    id: "inheritance",
    term: "inheritance",
    expansion: "Control Inheritance",
    definition: "The capability of a system to inherit security controls implemented by an external provider or hosting platform, reducing local implementation effort.",
    why_it_matters: "Inheritance separates a provider or common-control implementation from the work and evidence that remain with the system.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["control-inheritance", "common-control-provider", "csp-inheritance", "enterprise-inheritance"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "common-control",
    term: "common control",
    expansion: "Common Control",
    definition: "A security control that is inherited by multiple information systems and managed by a centralized common control provider.",
    why_it_matters: "A common control can serve multiple systems when its provider, scope, implementation, and evidence are explicitly defined.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["common-control-provider", "control-inheritance"],
    related_controls: ["PL-2"]
  },
  {
    id: "shared-responsibility",
    term: "shared responsibility",
    expansion: "Shared Responsibility Model",
    definition: "A model that assigns security responsibilities between a service provider and the customer or system owner.",
    why_it_matters: "The model makes provider and customer responsibilities visible so work and evidence are not assigned to the wrong party.",
    source: "FedRAMP Customer Responsibility Matrix guidance",
    related_patterns: ["shared-responsibility", "control-inheritance", "csp-inheritance"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "isso",
    term: "ISSO",
    expansion: "Information System Security Officer",
    definition: "An individual responsible for ensuring that the appropriate operational security posture is maintained for an information system.",
    why_it_matters: "The ISSO often coordinates day-to-day security records and operating follow-through for a system; exact duties vary by organization.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "issm",
    term: "ISSM",
    expansion: "Information System Security Manager",
    definition: "A senior role responsible for managing an organization's overall cybersecurity program and supervising Information System Security Officers.",
    why_it_matters: "The ISSM coordinates security management across a program or organization; exact authority varies by organization.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "sca",
    term: "SCA",
    expansion: "Security Control Assessor",
    definition: "An independent individual or team responsible for testing, evaluating, and determining the effectiveness of security controls.",
    why_it_matters: "Independent assessment separates control evaluation from the team responsible for implementation.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CA-2"]
  },
  {
    id: "ao",
    term: "AO",
    expansion: "Authorizing Official",
    definition: "A senior federal official with the authority to formally assume responsibility for operating an information system at an acceptable level of risk.",
    why_it_matters: "The AO owns the decision to accept system risk and the terms attached to that decision.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle", "ato-vs-fedramp", "ato-vs-atc"],
    related_controls: ["PL-2"]
  },
  {
    id: "aodr",
    term: "AODR",
    expansion: "Authorizing Official Designated Representative",
    definition: "An individual designated by the Authorizing Official to carry out necessary tasks and duties associated with security authorization activities.",
    why_it_matters: "An AODR performs duties delegated by the AO; the delegation defines what the representative may decide.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "boundary",
    term: "boundary",
    expansion: "Authorization Boundary",
    definition: "The set of system components, services, interfaces, and data flows included in an authorization decision.",
    why_it_matters: "The boundary identifies which components, data flows, services, and responsibilities are included in the authorization scope.",
    source: "NIST SP 800-37 Rev. 2",
    related_patterns: ["boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "overlay",
    term: "overlay",
    expansion: "Security Control Overlay",
    definition: "A specification of security controls, enhancements, and guidance tailored for a specific technology area, industry, or operational mission.",
    why_it_matters: "An overlay records control selections and guidance for a stated community, technology, or mission context; it does not apply itself to a system.",
    source: "NIST SP 800-53 Rev. 5",
    related_patterns: ["boundary-patterns", "reciprocity-basics"],
    related_controls: ["PL-2"]
  },
  {
    id: "baseline",
    term: "baseline",
    expansion: "Security Control Baseline",
    definition: "A published starting set of security or privacy controls selected from a catalog for a stated purpose or impact level.",
    why_it_matters: "A baseline is a published control selection from a catalog. The responsible program or authority decides whether and how to use it for a system.",
    source: "NIST SP 800-53 Rev. 5",
    related_patterns: ["rmf-lifecycle", "boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "profile",
    term: "profile",
    expansion: "Security Control Profile",
    definition: "A stated selection or tailoring of catalog material for a particular mission, technology, community, or regulatory purpose.",
    why_it_matters: "A profile records a stated selection or tailoring of catalog material for a particular purpose; it is not a separate framework.",
    source: "NIST SP 800-53 Rev. 5",
    related_patterns: ["boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "continuous-monitoring",
    term: "continuous monitoring",
    expansion: "Continuous Monitoring",
    definition: "The ongoing assessment and report of security control effectiveness and system posture to support authorization decisions.",
    why_it_matters: "Continuous monitoring supplies current information for ongoing risk and authorization decisions; it does not extend an authorization by itself.",
    source: "NIST SP 800-137",
    related_patterns: ["conmon-cadence", "rmf-lifecycle"],
    related_controls: ["CA-7"]
  },
  {
    id: "li-saas",
    term: "LI-SaaS",
    expansion: "Low-Impact Software as a Service",
    definition: "A streamlined FedRAMP baseline for cloud services that handle low-risk, publicly available data and meet a narrow set of usage criteria (no PII beyond login data, no CUI).",
    why_it_matters: "LI-SaaS has specific eligibility conditions. The applicable agency or FedRAMP process determines whether a cloud service may use that path.",
    source: "FedRAMP Program Management Office",
    related_patterns: ["ato-vs-fedramp"],
    related_controls: ["CA-2"]
  },
  {
    id: "cui",
    term: "CUI",
    expansion: "Controlled Unclassified Information",
    definition: "Information the government creates or possesses that requires safeguarding under law, regulation, or policy, but is not classified national security information.",
    why_it_matters: "CUI handling requirements depend on the information, contract, system scope, and governing program; the label alone does not let Control Atlas decide applicability.",
    source: "32 CFR Part 2002 (ISOO CUI Program)",
    related_patterns: ["reciprocity-basics"],
    related_controls: ["AC-2"]
  },
  {
    id: "csp",
    term: "CSP",
    expansion: "Cloud Service Provider",
    definition: "A company that offers cloud computing services (infrastructure, platform, or software) that a federal system may run on or consume.",
    why_it_matters: "The CSP's documented responsibilities and evidence help separate provider work from customer and system-specific work; inheritance still requires review.",
    source: "FedRAMP Program Management Office",
    related_patterns: ["csp-inheritance", "shared-responsibility"],
    related_controls: ["SA-9"]
  }
];
