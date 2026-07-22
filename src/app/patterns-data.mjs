export const patternsData = [
  {
    id: "rmf-lifecycle",
    title: "RMF Lifecycle Planning",
    summary: "Plan security work across the seven RMF steps instead of treating authorization as a final paperwork deadline.",
    explanation: "The Risk Management Framework (RMF) has seven steps: Prepare, Categorize, Select, Implement, Assess, Authorize, and Monitor. Use them to connect engineering decisions, evidence, and risk decisions throughout the system lifecycle.",
    friction: "The system is already being designed or built, but control selection, evidence planning, and authorization work are waiting until the end.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2", "CA-2", "CA-7"],
    templates: ["security_plan_starter", "assessment_planning_worksheet", "conmon_calendar"],
    dos: [
      "Tie RMF decisions and evidence to sprint planning, architecture reviews, and release gates.",
      "Bring the Authorizing Official into categorization and control-selection decisions early."
    ],
    donts: [
      "Do not wait until the system is built to choose controls or collect evidence.",
      "Do not skip Prepare; record the organizational assumptions and roles that shape later decisions."
    ],
    limitations: "RMF guides risk management work. The Authorizing Official still decides whether to accept the system's risk."
  },
  {
    id: "ato-vs-atc",
    title: "ATO vs. ATC",
    summary: "Separate approval to operate a system from permission to connect it to a specific network.",
    explanation: "An Authorization to Operate (ATO) records a decision to accept the risk of operating a system. An Authority to Connect (ATC) permits a connection to a specific network or enclave; an ATO does not automatically grant that permission.",
    friction: "You have an ATO, or your provider has one, but the receiving network still requires a separate connection review.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-3", "CA-9"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Confirm the receiving network's connection rules and approval sequence before planning the interconnection.",
      "Prepare the agreement, diagrams, ports, protocols, and security responsibilities the receiving enclave requests."
    ],
    donts: [
      "Do not treat a hosting platform's ATO as permission to connect your application.",
      "Do not connect before the required interconnection agreement and network approval are complete."
    ],
    limitations: "Connection approval sequences vary. Follow the receiving agency's current network and interconnection rules."
  },
  {
    id: "ato-vs-fedramp",
    title: "ATO vs. FedRAMP Authorization",
    summary: "Check how a cloud authorization can support an agency ATO without treating the two as interchangeable.",
    explanation: "An agency ATO covers that agency's use of a system. A FedRAMP authorization package can support reuse of a cloud service's assessment, but each agency still makes its own risk and authorization decision.",
    friction: "A cloud service has an agency ATO or assessment package, but its team is unsure what that status allows other agencies to reuse or claim.",
    sources: ["FedRAMP PMO Guidelines"],
    controls: ["CA-2", "PL-2"],
    templates: ["reciprocity_checklist", "inheritance_worksheet"],
    dos: [
      "Verify the service's current FedRAMP Marketplace status and authorization boundary.",
      "Document which assessed controls and evidence your agency can reuse and which customer responsibilities remain."
    ],
    donts: [
      "Do not describe an agency-only ATO as a government-wide FedRAMP authorization.",
      "Do not assume a listed cloud service removes the need for an agency risk decision."
    ],
    limitations: "Verify current status and scope in the FedRAMP Marketplace and follow the receiving agency's authorization process."
  },
  {
    id: "reciprocity-basics",
    title: "Reciprocity Basics",
    summary: "Decide whether another organization's assessment can be reused and what evidence the receiving official still needs.",
    explanation: "Reciprocity lets a receiving organization consider another organization's security plan and assessment results instead of repeating every test. The receiving Authorizing Official decides what can be reused.",
    friction: "You have an existing authorization package, but the receiving organization cannot tell whether its scope, baseline, evidence, and open risks fit the new use.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["CA-2", "SA-9"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Provide the complete security plan, assessment plan, assessment report, and POA&M with their dates and scope.",
      "Show differences in baseline, boundary, environment, and control implementation before the receiving review begins."
    ],
    donts: [
      "Do not omit baseline deviations, open weaknesses, or assessment limitations.",
      "Do not promise automatic acceptance; the receiving Authorizing Official owns the decision."
    ],
    limitations: "Reciprocity is voluntary. The receiving Authorizing Official may accept, limit, or reject the prior work."
  },
  {
    id: "reciprocity-failures",
    title: "Reciprocity Failure Patterns",
    summary: "Find the gaps most likely to make a receiving agency reject or repeat an existing assessment.",
    explanation: "Prior assessment work is difficult to reuse when its documents are stale, its baseline or boundary differs, open weaknesses are unclear, or the original assessor does not meet the receiving organization's requirements.",
    friction: "A receiving review has started, but basic gaps in dates, scope, evidence, or assessor independence are forcing rework.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CA-5"],
    templates: ["reciprocity_checklist"],
    dos: [
      "Check the dates, signatures, scope, baseline, and open findings before sending the package.",
      "Give the receiving team a short gap list that states what changed and what must be reassessed."
    ],
    donts: [
      "Do not bury high-severity weaknesses or send them without owners and remediation dates.",
      "Do not present a self-assessment as independent evidence when the receiving organization requires an independent assessor."
    ],
    limitations: "These are common failure points, not acceptance criteria. Use the receiving organization's current review requirements."
  },
  {
    id: "control-inheritance",
    title: "Control Inheritance Model",
    summary: "Separate controls your provider owns from shared controls and work your system must still perform.",
    explanation: "A system may rely on controls run by its hosting provider, such as physical security or hypervisor maintenance. Inheritance only covers the provider's documented part of the control; shared and customer work remains local.",
    friction: "A provider says a control is inherited, but your team cannot see where the provider's work ends or what your application must still do.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "security_plan_starter"],
    dos: [
      "Record the provider's responsibility, your responsibility, and the evidence for each inherited or shared control.",
      "Confirm that the provider's authorization and common-control evidence are current and cover the service you use."
    ],
    donts: [
      "Do not mark a control fully inherited until customer-side settings and duties are accounted for.",
      "Do not rely on provider evidence that is expired, out of scope, or tied to a different service."
    ],
    limitations: "Inheritance depends on the provider's current scope, evidence, agreements, and authorization status. Recheck it when the service changes."
  },
  {
    id: "common-control-provider",
    title: "Common Control Provider Model",
    summary: "Define which controls a shared service owns, what evidence it provides, and what each customer system still owns.",
    explanation: "A common control provider runs controls that several systems can inherit, such as identity, facilities, or central logging. Each published control still needs a defined scope, evidence, monitoring plan, and customer responsibility.",
    friction: "Your shared service is being offered as inherited, but customer systems do not know what is covered, what evidence is available, or what they must configure.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2"],
    templates: ["inheritance_worksheet"],
    dos: [
      "Publish a responsibility matrix that names the provider work, customer work, evidence, and contact for each control.",
      "Tell customer systems when scope, evidence, monitoring results, or control status changes."
    ],
    donts: [
      "Do not publish a common control without an owner, monitoring schedule, and evidence-delivery process.",
      "Do not assume one implementation statement fits every customer system or connection."
    ],
    limitations: "The organization must formally designate its common controls and provider responsibilities. Local approval rules still apply."
  },
  {
    id: "shared-responsibility",
    title: "Shared Responsibility Model",
    summary: "Split each shared control into provider work and customer work so neither side leaves a gap.",
    explanation: "Many controls require work from both the platform and the application. For example, a provider may run the identity service while your system approves accounts and reviews access.",
    friction: "A control is labeled inherited, but application settings, approvals, monitoring, or evidence still have no owner.",
    sources: ["Practitioner-consensus"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "evidence_expectation_matrix"],
    dos: [
      "Split each shared control into named provider and customer tasks.",
      "Write your implementation statement around the part your system configures, operates, and proves."
    ],
    donts: [
      "Do not call a control inherited when your system still owns part of it.",
      "Do not copy the provider's statement as if it describes your application work."
    ],
    limitations: "The split changes by service model, offering, and contract. Confirm responsibilities with the provider's current documentation."
  },
  {
    id: "csp-inheritance",
    title: "Cloud Service Provider Inheritance",
    summary: "Claim only the cloud controls your provider covers, then document the settings and evidence your system still owns.",
    explanation: "A cloud service provider may already operate and assess parts of the infrastructure your system uses. Your team must match those inherited controls to the authorized service and document every customer responsibility.",
    friction: "Your application runs on a FedRAMP-authorized service, but the team is treating the provider's status as coverage for the application itself.",
    sources: ["FedRAMP System Owner Guide"],
    controls: ["PL-2", "SA-9"],
    templates: ["inheritance_worksheet", "evidence_expectation_matrix"],
    dos: [
      "Obtain the provider's current customer package and Customer Responsibility Matrix.",
      "Map each inherited or shared control to the exact authorized service and your required configuration."
    ],
    donts: [
      "Do not assume the provider manages your application accounts, code, data, or configurations unless its documentation says so.",
      "Do not claim inheritance for components or services outside the provider's authorization boundary."
    ],
    limitations: "Cloud inheritance covers only the authorized services and responsibilities documented by the provider."
  },
  {
    id: "enterprise-inheritance",
    title: "Enterprise Service Inheritance",
    summary: "Confirm what identity, logging, and monitoring services your agency provides and what your system must configure.",
    explanation: "Agency services may provide identity, log collection, security monitoring, or other controls to many systems. Your system still has to connect correctly, meet the service's requirements, and keep proof of that connection.",
    friction: "Your plan names an enterprise service, but no one has confirmed the integration, service scope, evidence, or local responsibilities.",
    sources: ["Practitioner-consensus"],
    controls: ["IA-2", "AU-6", "PL-2"],
    templates: ["inheritance_worksheet"],
    dos: [
      "Confirm onboarding, configuration, evidence, and support requirements with the enterprise service owner.",
      "Test the integration, such as log delivery or PIV authentication, and keep the result with your control evidence."
    ],
    donts: [
      "Do not assume enterprise monitoring includes application events you never send.",
      "Do not claim identity inheritance until your authentication path and account responsibilities are documented."
    ],
    limitations: "Coverage depends on the enterprise service's scope, agreement, and current operating status."
  },
  {
    id: "boundary-patterns",
    title: "Boundary and Scope Patterns",
    summary: "Draw a defensible line around the components, data, people, and connections your authorization covers.",
    explanation: "The authorization boundary identifies the components, people, data, and connections covered by the risk decision. A defensible boundary also explains important dependencies that remain outside it.",
    friction: "Your diagrams and inventory do not make it clear which components are in scope, which are external, or where data crosses the boundary.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["PL-2"],
    templates: ["security_plan_starter"],
    dos: [
      "Draw the boundary around a named component inventory and show every external connection and data flow.",
      "Record why shared services and external systems are inside or outside the boundary."
    ],
    donts: [
      "Do not pull an external service into the boundary only because your system depends on it.",
      "Do not leave administrator workstations, support services, or data exchanges unexplained."
    ],
    limitations: "The Authorizing Official and assessor review the boundary. Agency and program rules may require additional components in scope."
  },
  {
    id: "boe-reuse",
    title: "Body of Evidence Reuse",
    summary: "Organize evidence so another assessor can find, verify, and reuse it without chasing files across tools.",
    explanation: "A body of evidence is an organized set of plans, procedures, test results, logs, and other records tied to control claims. Clear ownership and versioning make the same evidence easier to review again.",
    friction: "Assessors and control owners are hunting through email, shared drives, tickets, and wikis for the current evidence.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CA-5"],
    templates: ["reciprocity_checklist", "evidence_expectation_matrix"],
    dos: [
      "Keep an evidence register with control links, owners, dates, locations, and review status.",
      "Collect repeatable technical exports where possible and preserve the context needed to interpret them."
    ],
    donts: [
      "Do not mix drafts with approved or assessed evidence without a visible status label.",
      "Do not place sensitive operational data or personal information in a repository that is not approved for it."
    ],
    limitations: "Use the format, handling rules, and submission process required by the assessing organization."
  },
  {
    id: "poam-concepts",
    title: "POA&M and Residual Risk",
    summary: "Turn each known weakness into owned, dated remediation work and record any risk the authorizing official accepts.",
    explanation: "A Plan of Action and Milestones (POA&M) records a weakness, its remediation owner, milestones, and planned completion date. Risk that remains after treatment requires the appropriate approval and supporting record.",
    friction: "Open weaknesses have vague fixes, no accountable owner, missed dates, or no record of the decision to accept remaining risk.",
    sources: ["NIST SP 800-37 Rev. 2"],
    controls: ["CA-5", "PM-4"],
    templates: ["poam_starter"],
    dos: [
      "Give each weakness one accountable owner, a realistic completion date, and dated intermediate milestones.",
      "Tie remediation work to engineering releases and update the record when scope or timing changes."
    ],
    donts: [
      "Do not soften, split, or relabel a weakness to hide its actual severity or status.",
      "Do not treat an open POA&M as automatic approval or automatic rejection; document the Authorizing Official's decision."
    ],
    limitations: "Only the authorized decision-maker can accept residual risk. Follow the program's POA&M format and review rules."
  },
  {
    id: "conmon-cadence",
    title: "Continuous Monitoring Cadence",
    summary: "Set evidence and review dates that keep the authorization current between assessments.",
    explanation: "Continuous monitoring sets recurring checks for controls and evidence, such as vulnerability scans, access reviews, and policy updates. The schedule should reflect risk, change, and authorization requirements.",
    friction: "Evidence is collected only before an assessment, so expired reviews and configuration drift are discovered too late.",
    sources: ["NIST SP 800-137"],
    controls: ["CA-7"],
    templates: ["conmon_calendar"],
    dos: [
      "Schedule each check with an owner, frequency, evidence output, and escalation path.",
      "Automate repeatable checks and keep manual reviews on a visible calendar."
    ],
    donts: [
      "Do not let a missed review disappear; record the delay, risk, owner, and new date.",
      "Do not use scan results as proof for controls that require interviews, observation, or document review."
    ],
    limitations: "Monitoring frequency and evidence requirements must follow the organization's risk strategy and authorization terms."
  },
  {
    id: "evidence-patterns",
    title: "Evidence Expectation Patterns",
    summary: "Match each control claim to evidence an assessor can examine, test, or confirm through interview.",
    explanation: "A control claim needs evidence that matches the assessment method: something to examine, test, or confirm through interview. The evidence must also identify the system, date, scope, and result.",
    friction: "Your implementation statement says the control is in place, but the assessor cannot verify it from the submitted record.",
    sources: ["Practitioner-consensus"],
    controls: ["CA-2", "CM-6"],
    templates: ["evidence_expectation_matrix", "stig_evidence_checklist"],
    dos: [
      "Match every control claim to the applicable examine, interview, or test procedure.",
      "Keep enough context to show the system, date, configuration, reviewer, and result."
    ],
    donts: [
      "Do not submit stale or tightly cropped screenshots that hide scope, date, or system identity.",
      "Do not rely on a narrative alone when the assessment procedure calls for technical or documentary proof."
    ],
    limitations: "The assessor decides whether evidence is sufficient for the procedure and the system being assessed."
  }
];
