export const patternsData = [
  {
    id: "rmf-lifecycle",
    title: "RMF Lifecycle Planning",
    summary: "Plan around public Risk Management Framework stages.",
    explanation: "The Risk Management Framework (RMF) describes a 7-step process (Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor) to manage security and privacy risks. Practitioners should align their system lifecycle with these stages to ensure continuous authorization.",
    friction: "Teams often treat RMF as a sequential, one-time paperwork exercise rather than an active, iterative engineering process.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2", "CA-2", "CA-7"],
    templates: ["security_plan_starter", "assessment_planning_worksheet", "conmon_calendar"],
    dos: [
      "Integrate RMF steps directly into your agile sprints and system architecture reviews.",
      "Engage the Authorizing Official (AO) early during the Categorize and Select steps."
    ],
    donts: [
      "Do not wait until the system is fully built to start document compilation and control selection.",
      "Do not bypass the Prepare step, as it sets the foundational organizational context."
    ],
    limitations: "RMF is an advisory risk management framework. Official authorization decisions remain solely with the Authorizing Official."
  },
  {
    id: "ato-vs-atc",
    title: "ATO vs. ATC",
    summary: "Distinguish between operational authority and network connection permission.",
    explanation: "An Authorization to Operate (ATO) accepts the risk of system operation, while an Authority to Connect (ATC) permits the system to connect to a specific network or enclave. An ATO is a prerequisite for an ATC, but having an ATO does not automatically grant network connection rights.",
    friction: "Practitioners confuse the two, assuming an ATO from one agency forces another agency to connect the system to their network.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-3", "CA-9"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Obtain your system ATO first before requesting interconnection permissions.",
      "Review the specific network connection requirements of the receiving enclave."
    ],
    donts: [
      "Do not assume network connection permission is guaranteed by your hosting platform's ATO.",
      "Do not connect systems without a formally signed Interconnection Security Agreement (ISA)."
    ],
    limitations: "This pattern represents general network governance practices. Individual agency connection rules override this guidance."
  },
  {
    id: "ato-vs-fedramp",
    title: "ATO vs. FedRAMP Authorization",
    summary: "Understand agency-specific ATOs versus FedRAMP cloud authorizations.",
    explanation: "An agency-specific ATO applies only to that particular agency's deployment, while a FedRAMP Authorization (Joint Authorization Board or Agency ATO) designates a cloud product as meeting federal standards for government-wide reuse.",
    friction: "Cloud Service Providers (CSPs) assume a single agency ATO is the same as a FedRAMP marketplace listing.",
    sources: ["FedRAMP PMO Guidelines"],
    controls: ["CA-2", "PL-2"],
    templates: ["reciprocity_checklist", "inheritance_worksheet"],
    dos: [
      "Use FedRAMP-authorized cloud services to inherit validated control implementations.",
      "Coordinate with the FedRAMP PMO if you plan to list your SaaS on the FedRAMP Marketplace."
    ],
    donts: [
      "Do not market an agency-only ATO as a government-wide FedRAMP authorization.",
      "Do not modify your cloud system boundary without notifying your authorizing agency or FedRAMP."
    ],
    limitations: "FedRAMP rules are governed by OMB policies. Official status must be verified through the FedRAMP Marketplace."
  },
  {
    id: "reciprocity-basics",
    title: "Reciprocity Basics",
    summary: "Leverage existing security assessments to avoid redundant testing.",
    explanation: "Reciprocity allows an agency to accept the security assessment results (SAR, SAP, SSP) of another federal entity, facilitating faster authorization and saving costs.",
    friction: "AOs are reluctant to accept other agencies' assessments due to a lack of visibility into original test evidence.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["CA-2", "SA-9"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Provide complete, unmodified assessment reports to the receiving agency to build trust.",
      "Align control definitions to standard frameworks like NIST SP 800-53."
    ],
    donts: [
      "Do not hide baseline deviations or system vulnerabilities from the receiving AO.",
      "Do not assume reciprocity is an automatic right; it is a risk-based decision by the receiving agency."
    ],
    limitations: "Reciprocity is voluntary. The receiving Authorizing Official has ultimate authority to reject or accept risk."
  },
  {
    id: "reciprocity-failures",
    title: "Reciprocity Failure Patterns",
    summary: "Identify common pitfalls that derail assessment reuse.",
    explanation: "Reciprocity failures typically stem from outdated documentation, mismatched control baselines, hidden POA&Ms, or insufficient assessor independence in the original package.",
    friction: "A package is submitted for reciprocity only to be rejected after a lengthy review because the baseline was out-of-date.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CA-5"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Ensure all system documentation (SSP, SAR, POA&M) is fresh and active.",
      "Clearly map the differences between the original baseline and the new agency's baseline."
    ],
    donts: [
      "Do not submit a package with open high-severity vulnerabilities without remediation plans.",
      "Do not use internal-only self-assessments when the receiving agency requires independent assessment."
    ],
    limitations: "This list represents common compliance friction points and does not substitute for official agency criteria."
  },
  {
    id: "control-inheritance",
    title: "Control Inheritance Model",
    summary: "Inherit security control implementations from a hosting provider.",
    explanation: "System owners can satisfy compliance requirements by inheriting controls implemented by their hosting infrastructure (e.g., physical security, hypervisor patching), reducing local effort.",
    friction: "System owners assume they inherit 100% of a control, neglecting their own customer-tier responsibilities.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "security_plan_starter"],
    dos: [
      "Clearly document where the provider's responsibility ends and yours begins.",
      "Verify that the provider's common controls are active and authorized."
    ],
    donts: [
      "Do not claim complete control inheritance without verifying customer-side configurations.",
      "Do not inherit controls from a provider that does not have an active ATO."
    ],
    limitations: "Inheritance status is dependent on the provider remaining compliant and maintaining a signed SLA."
  },
  {
    id: "common-control-provider",
    title: "Common Control Provider Model",
    summary: "Centralize control implementations for enterprise system consumption.",
    explanation: "A Common Control Provider (CCP) implements and manages security controls that can be inherited by multiple organizational systems. This standardizes security and reduces assessment costs.",
    friction: "Enterprise teams publish common controls but fail to document customer-tier obligations, leading to compliance gaps.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2"],
    templates: ["inheritance_worksheet"],
    dos: [
      "Provide a clear, detailed customer-responsibilities matrix for every inherited control.",
      "Notify customer systems of changes, failures, or updates to the common controls."
    ],
    donts: [
      "Do not implement common controls without a formal plan for continuous monitoring.",
      "Do not assume all customer systems have identical configurations or needs."
    ],
    limitations: "Common control designations must be formally approved by the organization's senior leadership."
  },
  {
    id: "shared-responsibility",
    title: "Shared Responsibility Model",
    summary: "Cooperate with your provider to fulfill control requirements.",
    explanation: "Many security controls (e.g., Account Management, Incident Response) require both the hosting platform and the hosted application to implement specific parts of the control.",
    friction: "Auditors reject plans that list controls as simply 'inherited' when application-level configuration is also needed.",
    sources: ["Practitioner-consensus"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "evidence_expectation_matrix"],
    dos: [
      "Break down shared controls into specific tasks (e.g., provider hosts the DB; customer encrypts the tables).",
      "Draft clear implementation statements for your system's share of the control."
    ],
    donts: [
      "Do not leave the customer portion of a shared control undocumented.",
      "Do not duplicate implementation statements; keep the division of labor clear."
    ],
    limitations: "Shared models vary by cloud service type (IaaS vs. PaaS vs. SaaS) and require provider agreement."
  },
  {
    id: "csp-inheritance",
    title: "Cloud Service Provider Inheritance",
    summary: "Leverage commercial cloud platform ATOs for your SaaS/PaaS.",
    explanation: "Hosted systems inherit physical and network security from Cloud Service Providers (CSPs). A SaaS developer hosting on AWS or Azure can inherit significant chunks of NIST SP 800-53 controls.",
    friction: "SaaS developers assume hosting on a FedRAMP-authorized cloud automatically makes their application FedRAMP-compliant.",
    sources: ["FedRAMP System Owner Guide"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "evidence_expectation_matrix"],
    dos: [
      "Obtain the CSP's customer package and CRM (Customer Responsibility Matrix).",
      "Map your customer-responsibility controls to the exact CRM requirements."
    ],
    donts: [
      "Do not assume the CSP manages application-level firewalls, OS patching, or user accounts.",
      "Do not claim inheritance for controls outside the CSP's boundary (e.g., local laptops)."
    ],
    limitations: "CSP inheritance applies only to the infrastructure services formally included in their authorization boundary."
  },
  {
    id: "enterprise-inheritance",
    title: "Enterprise Service Inheritance",
    summary: "Inherit identity, logging, and SOC services from your agency.",
    explanation: "Systems can inherit identity management (e.g., CAC/PIV authentication) and monitoring (e.g., enterprise SOC log collection) from agency-wide shared services.",
    friction: "Hosted systems fail to send logs in the correct format, breaking the inheritance chain with the enterprise SOC.",
    sources: ["Practitioner-consensus"],
    controls: ["IA-2", "AU-6", "PL-2"],
    templates: ["inheritance_worksheet"],
    dos: [
      "Coordinate with the enterprise service desk to ensure correct log configuration.",
      "Audit your authentication flow to confirm PIV/CAC enforcement."
    ],
    donts: [
      "Do not assume enterprise SOC monitoring covers application-level auditing automatically.",
      "Do not implement custom user directories when an enterprise IDP is available."
    ],
    limitations: "Service SLA and uptime remain the responsibility of the enterprise provider, not the local system owner."
  },
  {
    id: "boundary-patterns",
    title: "Boundary and Scope Patterns",
    summary: "Establish clear authorization boundaries to prevent scope creep.",
    explanation: "The authorization boundary defines the set of resources under the direct management of the system owner. A clear boundary prevents auditors from expanding scope into external platforms or corporate networks.",
    friction: "Systems include corporate email, developer workstations, or external databases in their boundary, overcomplicating the assessment.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2"],
    templates: ["security_plan_starter"],
    dos: [
      "Draw a clear network and data flow diagram showing exactly where data enters and leaves.",
      "Isolate the compliance-relevant system from general corporate networks where possible."
    ],
    donts: [
      "Do not include systems you do not own, manage, or assess in your compliance boundary.",
      "Do not leave data interconnections undocumented."
    ],
    limitations: "Boundary definitions are subject to Authorizing Official and assessor review and approval."
  },
  {
    id: "boe-reuse",
    title: "Body of Evidence Reuse",
    summary: "Package assessment artifacts for easy sharing and reuse.",
    explanation: "Organize system artifacts (SSP, policies, procedures, logs) into a modular Body of Evidence (BoE) that can be easily reviewed by multiple agencies or during audits.",
    friction: "Teams scatter evidence across multiple wikis, emails, and folders, slowing down the audit process.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CA-5"],
    templates: ["reciprocity_checklist", "evidence_expectation_matrix"],
    dos: [
      "Maintain a single, version-controlled evidence registry linked to control IDs.",
      "Automate the collection of technical screenshots or configuration exports."
    ],
    donts: [
      "Do not mix organizational draft documents with final, signed assessment evidence.",
      "Do not upload operational system data or PII into public or unclassified registries."
    ],
    limitations: "BoE format should match the standards requested by the lead assessing office."
  },
  {
    id: "poam-concepts",
    title: "POA&M and Residual Risk",
    summary: "Track compliance deficiencies and manage risk acceptance.",
    explanation: "A Plan of Action and Milestones (POA&M) tracks security gaps, planned remediations, and scheduled completion dates. Deficiencies that cannot be fixed must be formally accepted as residual risk by the AO.",
    friction: "Vulnerabilities remain open indefinitely without active milestones, leading to ATO expiration or rejection.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["CA-5", "PM-4"],
    templates: ["poam_starter"],
    dos: [
      "Set realistic remediation dates and document intermediate milestones.",
      "Coordinate with system engineers to align remediation plans with release cycles."
    ],
    donts: [
      "Do not create fake POA&Ms to hide critical vulnerabilities from the assessor.",
      "Do not assume open POA&Ms block an ATO; AOs can authorize systems with managed risks."
    ],
    limitations: "Risk acceptance remains the sole authority of the Authorizing Official."
  },
  {
    id: "conmon-cadence",
    title: "Continuous Monitoring Cadence",
    summary: "Establish review intervals for ongoing security control compliance.",
    explanation: "Information Security Continuous Monitoring (ISCM) defines when controls must be re-evaluated (e.g., daily vulnerability scans, monthly access reviews, annual policy updates) to maintain authorization status.",
    friction: "Teams perform compliance checks only once a year before the audit, leading to configuration drift.",
    sources: ["NIST SP 800-137"],
    controls: ["CA-7"],
    templates: ["conmon_calendar"],
    dos: [
      "Automate frequency-based checks (like logging and vulnerability scanning).",
      "Assign explicit operational roles for manual reviews (like access log audits)."
    ],
    donts: [
      "Do not let monitoring intervals lapse; document any skipped reviews with justifications.",
      "Do not rely solely on automated scans when manual controls (like training) require review."
    ],
    limitations: "Continuous monitoring strategies must align with the organization's risk tolerance policy."
  },
  {
    id: "evidence-patterns",
    title: "Evidence Expectation Patterns",
    summary: "Define acceptable artifact types for control validation.",
    explanation: "Assessors require specific evidence types (logs, screenshots, configuration files, policies) to validate control implementation. Knowing what assessors expect prevents test failures.",
    friction: "System owners submit generic narrative statements instead of concrete technical evidence, causing delays.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CM-6"],
    templates: ["evidence_expectation_matrix", "stig_evidence_checklist"],
    dos: [
      "Align evidence with SP 800-53A assessment methods (Test, Examine, Interview).",
      "Ensure logs and screenshots show timestamps and clear system identifiers."
    ],
    donts: [
      "Do not submit outdated or cropped screenshots that hide essential context.",
      "Do not write subjective implementation statements without supporting artifacts."
    ],
    limitations: "The final determination of evidence adequacy rests with the Lead Assessor (SCA)."
  }
];
