export const glossaryData = [
  {
    id: "ato",
    term: "ATO",
    expansion: "Authorization to Operate",
    definition: "The official management decision given by a senior federal official (the Authorizing Official) to authorize operation of an information system and to explicitly accept the risk to agency operations.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle", "ato-vs-atc", "ato-vs-fedramp"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "atc",
    term: "ATC",
    expansion: "Authority to Connect",
    definition: "The official management decision to allow an information system to connect to a specific network or enclave based on compliance with security requirements.",
    source: "Practitioner-consensus",
    consensus: true,
    related_patterns: ["ato-vs-atc", "boundary-patterns"],
    related_controls: ["CA-3", "CA-9"]
  },
  {
    id: "fedramp-authorization",
    term: "FedRAMP authorization",
    expansion: "Federal Risk and Authorization Management Program Authorization",
    definition: "A government-wide program that provides a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services.",
    source: "FedRAMP Program Management Office",
    consensus: false,
    related_patterns: ["ato-vs-fedramp", "csp-inheritance"],
    related_controls: ["CA-2", "PL-2"]
  },
  {
    id: "rmf",
    term: "RMF",
    expansion: "Risk Management Framework",
    definition: "A structured process that integrates security, privacy, and cyber risk management activities into the system development life cycle.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle", "poam-concepts"],
    related_controls: ["PL-2", "CA-2"]
  },
  {
    id: "stig",
    term: "STIG",
    expansion: "Security Technical Implementation Guide",
    definition: "A cybersecurity technical standard created by the Defense Information Systems Agency (DISA) to secure specific software, hardware, or network components.",
    source: "DISA Cybersecurity Program",
    consensus: false,
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CM-6", "SI-2"]
  },
  {
    id: "srg",
    term: "SRG",
    expansion: "Security Requirements Guide",
    definition: "High-level security requirement standards published by DISA that define security criteria for a technology area (e.g., application server, OS).",
    source: "DISA Cybersecurity Program",
    consensus: false,
    related_patterns: ["evidence-patterns"],
    related_controls: ["CM-6"]
  },
  {
    id: "cci",
    term: "CCI",
    expansion: "Control Correlation Identifier",
    definition: "A standard identifier that decomposes high-level security controls (like NIST SP 800-53) into granular, low-level technical specifications.",
    source: "DISA Cybersecurity Program",
    consensus: false,
    related_patterns: ["evidence-patterns"],
    related_controls: ["CM-6"]
  },
  {
    id: "sar",
    term: "SAR",
    expansion: "Security Assessment Report",
    definition: "A document containing the results of testing and evaluating the security controls of an information system, detailing any vulnerabilities found.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["boe-reuse", "reciprocity-basics"],
    related_controls: ["CA-2", "CA-5"]
  },
  {
    id: "sap",
    term: "SAP",
    expansion: "Security Assessment Plan",
    definition: "A document detailing the objectives, scope, methodology, schedule, and procedures to be used during the security control assessment.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CA-2"]
  },
  {
    id: "ssp",
    term: "SSP",
    expansion: "System Security Plan",
    definition: "A comprehensive description of a system's boundary, operational environment, and the controls implemented to meet compliance requirements.",
    source: "NIST SP 800-18 Rev. 1",
    consensus: false,
    related_patterns: ["rmf-lifecycle", "shared-responsibility"],
    related_controls: ["PL-2"]
  },
  {
    id: "poam",
    term: "POA&M",
    expansion: "Plan of Action and Milestones",
    definition: "A document that identifies tasks to be accomplished to remediate vulnerabilities or compliance gaps identified during assessments.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["poam-concepts", "rmf-lifecycle"],
    related_controls: ["CA-5", "PM-4"]
  },
  {
    id: "boe",
    term: "BoE",
    expansion: "Body of Evidence",
    definition: "The collective set of document and system artifacts (SSPs, logs, policies, test results) demonstrating that security controls are properly implemented.",
    source: "Practitioner-consensus",
    consensus: true,
    related_patterns: ["boe-reuse", "evidence-patterns"],
    related_controls: ["CA-2", "CA-5"]
  },
  {
    id: "reciprocity",
    term: "reciprocity",
    expansion: "Reciprocity",
    definition: "The mutual agreement to accept another organization's security assessment results, reducing redundant testing and accelerating authorizations.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["reciprocity-basics", "reciprocity-failures", "boe-reuse"],
    related_controls: ["CA-2", "SA-9"]
  },
  {
    id: "inheritance",
    term: "inheritance",
    expansion: "Control Inheritance",
    definition: "The capability of a system to inherit security controls implemented by an external provider or hosting platform, reducing local implementation effort.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["control-inheritance", "common-control-provider", "csp-inheritance", "enterprise-inheritance"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "common-control",
    term: "common control",
    expansion: "Common Control",
    definition: "A security control that is inherited by multiple information systems and managed by a centralized common control provider.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["common-control-provider", "control-inheritance"],
    related_controls: ["PL-2"]
  },
  {
    id: "shared-responsibility",
    term: "shared responsibility",
    expansion: "Shared Responsibility Model",
    definition: "A compliance framework dividing security obligations between the infrastructure/platform provider and the customer system owner.",
    source: "Practitioner-consensus",
    consensus: true,
    related_patterns: ["shared-responsibility", "control-inheritance", "csp-inheritance"],
    related_controls: ["PL-2", "SA-9"]
  },
  {
    id: "isso",
    term: "ISSO",
    expansion: "Information System Security Officer",
    definition: "An individual responsible for ensuring that the appropriate operational security posture is maintained for an information system.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "issm",
    term: "ISSM",
    expansion: "Information System Security Manager",
    definition: "A senior role responsible for managing an organization's overall cybersecurity program and supervising Information System Security Officers.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "sca",
    term: "SCA",
    expansion: "Security Control Assessor",
    definition: "An independent individual or team responsible for testing, evaluating, and determining the effectiveness of security controls.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["evidence-patterns", "rmf-lifecycle"],
    related_controls: ["CA-2"]
  },
  {
    id: "ao",
    term: "AO",
    expansion: "Authorizing Official",
    definition: "A senior federal official with the authority to formally assume responsibility for operating an information system at an acceptable level of risk.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle", "ato-vs-fedramp", "ato-vs-atc"],
    related_controls: ["PL-2"]
  },
  {
    id: "aodr",
    term: "AODR",
    expansion: "Authorizing Official Designated Representative",
    definition: "An individual designated by the Authorizing Official to carry out necessary tasks and duties associated with security authorization activities.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["rmf-lifecycle"],
    related_controls: ["PL-2"]
  },
  {
    id: "boundary",
    term: "boundary",
    expansion: "Authorization Boundary",
    definition: "All components of an information system to be authorized for operation by an Authorizing Official, excluding external services.",
    source: "NIST SP 800-37 Rev. 2",
    consensus: false,
    related_patterns: ["boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "overlay",
    term: "overlay",
    expansion: "Security Control Overlay",
    definition: "A specification of security controls, enhancements, and guidance tailored for a specific technology area, industry, or operational mission.",
    source: "NIST SP 800-53 Rev. 5",
    consensus: false,
    related_patterns: ["boundary-patterns", "reciprocity-basics"],
    related_controls: ["PL-2"]
  },
  {
    id: "baseline",
    term: "baseline",
    expansion: "Security Control Baseline",
    definition: "A starting set of security and privacy controls designated for a system based on its impact level (Low, Moderate, High).",
    source: "NIST SP 800-53 Rev. 5",
    consensus: false,
    related_patterns: ["rmf-lifecycle", "boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "profile",
    term: "profile",
    expansion: "Security Control Profile",
    definition: "A customized set of security controls selected from a baseline to address specific mission objectives or regulatory requirements.",
    source: "NIST SP 800-53 Rev. 5",
    consensus: false,
    related_patterns: ["boundary-patterns"],
    related_controls: ["PL-2"]
  },
  {
    id: "continuous-monitoring",
    term: "continuous monitoring",
    expansion: "Continuous Monitoring",
    definition: "The ongoing assessment and report of security control effectiveness and system posture to support authorization decisions.",
    source: "NIST SP 800-137",
    consensus: false,
    related_patterns: ["conmon-cadence", "rmf-lifecycle"],
    related_controls: ["CA-7"]
  }
];
