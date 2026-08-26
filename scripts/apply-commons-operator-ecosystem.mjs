#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATASET_PATH = join(ROOT, "data", "commons-resource-dataset.json");
const MANIFEST_PATH = join(ROOT, "data", "commons-candidate-manifest.json");
const DISPOSITION_PATH = join(ROOT, "data", "resource-ecosystem-disposition.json");
const MASTER_PATH = join(ROOT, "data", "curated", "commons-operator-ecosystem-master.json");
const CHECKED_AT = "2026-08-25";
const COMMUNITY_WARNING = "Do not post CUI, credentials, system details, assessment evidence, or other non-public organizational information.";

const COLLECTIONS = [
  ["vulnerability-management-prioritization", "Vulnerability management and prioritization", "Find current resources for identifying and prioritizing vulnerabilities.", "Groups operational vulnerability resources without implying that a product satisfies a control.", "shield-check"],
  ["detection-soc", "Detection and SOC operations", "Find detection content and network security monitoring platforms.", "Connects the tools and content used to build and operate defensive monitoring.", "radar"],
  ["threat-intelligence-investigation", "Threat intelligence and investigation", "Find current sources for threat intelligence and investigation.", "Keeps investigation services together while preserving each publisher and access boundary.", "search"],
  ["dfir-threat-hunting", "DFIR and threat hunting", "Find current tools for DFIR and threat hunting.", "Groups practical investigation tools by operator workflow rather than by vendor.", "microscope"],
  ["stig-configuration-automation", "STIG and configuration automation", "Find federal repositories and tools for secure configuration and STIG work.", "Separates official guidance sources from tools that generate, assess, or manage configuration content.", "settings-check"],
  ["network-security-analysis", "Network security analysis", "Find current tools for network security analysis.", "Connects complementary network analysis capabilities without creating unsupported control mappings.", "network"],
  ["devsecops-supply-chain", "DevSecOps and software supply chain", "Find tools for secure software delivery pipelines.", "Groups implementation tools used across code, dependencies, containers, and Kubernetes.", "code"],
  ["identity-access-security", "Identity and access security", "Find tools and communities for identity security.", "Connects identity-focused operator resources without treating product claims as requirements.", "key"],
  ["disa-services-capabilities", "DISA services and capabilities", "Find individual DISA products and service access paths.", "Makes distinct DISA offerings discoverable without collapsing them into a single portal card.", "server"],
];

const COMMUNITY = "practitioner-communities";
const VULN = "vulnerability-management-prioritization";
const DETECT = "detection-soc";
const THREAT = "threat-intelligence-investigation";
const DFIR = "dfir-threat-hunting";
const STIG = "stig-configuration-automation";
const NETWORK = "network-security-analysis";
const DEVSECOPS = "devsecops-supply-chain";
const IDENTITY = "identity-access-security";
const DISA = "disa-services-capabilities";

function row(name, id, url, publisher, lane, resourceType, useCase, collections, aliases = [], options = {}) {
  return { name, id, url, publisher, lane, resourceType, useCase, collections, aliases, ...options };
}

const MASTER = [
  row("DISA Assured Compliance Assessment Solution (ACAS)", "service-disa-acas", "https://help.disa.mil/cybersecurity/", "Defense Information Systems Agency", "official", "restricted_service", "Access DISA's operational vulnerability scanning service and support resources", [VULN, "dod-cybersecurity-portals"], ["ACAS", "Nessus", "Tenable.sc", "SecurityCenter", "Security Center"], { accessType: "cac_required", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Service access and support may require DoD credentials, CAC, and an authorized ACAS role.", companions: ["service-disa-vms"], brandKey: "disa" }),
  row("DISA Vulnerability Management Service (VMS)", "service-disa-vms", "https://hybridcloud.disa.mil/offerings/vms", "Defense Information Systems Agency", "official", "restricted_service", "Use DISA's enterprise vulnerability management service offering", [VULN, "dod-cybersecurity-portals"], ["VMS", "DISA VMS", "vulnerability management service"], { accessType: "cac_required", accountRequired: true, authenticationRequired: true, publicAccessNotes: "The public offering page is viewable, while service onboarding and use require authorized DoD access.", companions: ["service-disa-acas"], brandKey: "disa" }),
  { name: "Evaluate-STIG", url: "https://public.cyber.mil/stigs/", directive: "reject", reason: "No current canonical NAVSEA distribution, publisher-maintained project page, or supported public access path was verified. The dead historical GitHub URL is not used.", evidence: "https://github.com/NUWCDIVNPT/stig-manager/issues/2058" },
  row("NIST National Checklist Program (NCP)", "repository-nist-ncp", "https://ncp.nist.gov/repository", "National Institute of Standards and Technology", "official", "catalog", "Search the federal repository of security configuration checklists", [STIG], ["NCP", "checklists", "security checklist", "USGCB", "SCAP"], { brandKey: "nist" }),
  row("NIST macOS Security Compliance Project (mSCP)", "tool-nist-mscp", "https://github.com/usnistgov/macos_security", "National Institute of Standards and Technology", "official", "tool", "Generate and assess Apple platform security configuration content", [STIG], ["mSCP", "macOS security", "macOS STIG", "Apple security baseline", "macOS compliance"], { openSource: true, brandKey: "nist", warnings: ["Generated configuration content is not itself federal policy. Review current project issues and validate generated output before deployment."] }),
  row("MITRE ATT&CK Navigator", "tool-mitre-attack-navigator", "https://github.com/mitre-attack/attack-navigator", "MITRE", "open_source", "tool", "Visualize and annotate ATT&CK techniques in operational layers", [DETECT, THREAT], ["ATT&CK Navigator", "Attack Navigator"], { openSource: true, brandKey: "mitre", companions: ["ecosystem-attack-workbench", "tool-mitre-caldera", "tool-atomic-red-team"] }),
  row("ATT&CK Workbench", "ecosystem-attack-workbench", "https://github.com/mitre-attack", "MITRE", "open_source", "ecosystem", "Manage and extend ATT&CK knowledge for organizational analysis", [DETECT, THREAT], ["ATT&CK Workbench", "Attack Workbench"], { openSource: true, brandKey: "mitre", companions: ["tool-mitre-attack-navigator", "tool-mitre-caldera", "tool-atomic-red-team"] }),
  row("MITRE CALDERA", "tool-mitre-caldera", "https://github.com/mitre/caldera", "MITRE", "open_source", "tool", "Run automated adversary emulation and security control validation", [DETECT], ["CALDERA", "MITRE CALDERA", "adversary emulation"], { openSource: true, brandKey: "mitre", companions: ["tool-mitre-attack-navigator", "ecosystem-attack-workbench", "tool-atomic-red-team"] }),
  row("CISA Malcolm", "tool-cisa-malcolm", "https://github.com/cisagov/Malcolm", "Cybersecurity and Infrastructure Security Agency", "official", "tool", "Analyze network traffic through an integrated security monitoring platform", [DETECT, NETWORK], ["Malcolm", "CISA Malcolm", "network traffic analysis"], { openSource: true, brandKey: "cisa", companions: ["tool-zeek", "tool-suricata"] }),
  row("CISA Decider", "tool-cisa-decider", "https://github.com/cisagov/Decider", "Cybersecurity and Infrastructure Security Agency", "official", "tool", "Map observed adversary behavior to ATT&CK techniques", [DETECT, THREAT], ["Decider", "CISA Decider", "ATT&CK mapping"], { openSource: true, brandKey: "cisa" }),
  row("CISA Vulnrichment", "dataset-cisa-vulnrichment", "https://github.com/cisagov/vulnrichment", "Cybersecurity and Infrastructure Security Agency", "official", "dataset", "Use CISA-enriched vulnerability records for analyst prioritization", [VULN, THREAT], ["Vulnrichment", "CISA Vulnrichment", "CVE enrichment"], { openSource: true, brandKey: "cisa", days: 45 }),
  row("FIRST EPSS", "dataset-first-epss", "https://www.first.org/epss/data.html", "Forum of Incident Response and Security Teams", "practitioner", "dataset", "Prioritize vulnerabilities using published exploitation probability scores", [VULN], ["EPSS", "exploit probability", "vulnerability prioritization"], { days: 45, apiLinks: ["https://api.first.org/data/v1/epss"] }),
  row("CERT/CC Vulnerability Notes Database", "reference-cert-vulnerability-notes", "https://www.kb.cert.org/vuls/", "CERT Coordination Center", "practitioner", "catalog", "Search coordinated vulnerability disclosures and technical notes", [VULN, THREAT], ["CERT VU", "CERT vulnerability notes", "VU notes"], { days: 45 }),
  row("GitHub Advisory Database", "dataset-github-advisory-database", "https://github.com/advisories/", "GitHub", "open_source", "dataset", "Search security advisories affecting open-source dependencies", [VULN, DEVSECOPS], ["GHSA", "GitHub advisories", "security advisory database"], { brandKey: "github", days: 45 }),
  row("Microsoft Security Update Guide", "reference-microsoft-security-update-guide", "https://msrc.microsoft.com/update-guide/", "Microsoft", "commercial", "catalog", "Research Microsoft security updates, CVEs, and release guidance", [VULN], ["MSRC", "Security Update Guide", "Patch Tuesday", "Microsoft CVE"], { brandKey: "microsoft", parent: "community-microsoft-security", days: 45 }),
  row("Tenable Connect", "community-tenable-connect", "https://connect.tenable.com/", "Tenable", "commercial", "community_forum", "Use Tenable product discussions, support knowledge, and operator guidance", [COMMUNITY, VULN], ["Tenable Community", "Nessus community", "Tenable.sc community", "Security Center community"], { accessType: "customer_only", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Some content is public, while registration and restricted support areas require Tenable credentials and may require a customer ID.", brandKey: "tenable", children: ["catalog-tenable-plugin-database", "catalog-tenable-audit-files"] }),
  row("Splunk Community", "community-splunk", "https://community.splunk.com/", "Splunk", "commercial", "community_forum", "Search Splunk implementation and troubleshooting discussions", [COMMUNITY, DETECT], ["Splunk Answers", "Splunk ES", "Enterprise Security", "SPL", "SIEM"], { children: ["catalog-splunk-security-content"] }),
  row("Rapid7 Discuss", "community-rapid7", "https://discuss.rapid7.com/latest?no_definitions=true", "Rapid7", "commercial", "community_forum", "Search Rapid7 product implementation and troubleshooting discussions", [COMMUNITY, VULN], ["InsightVM", "Nexpose", "InsightIDR", "Rapid7 community"]),
  row("Qualys Community", "community-qualys", "https://community.qualys.com/", "Qualys", "commercial", "community_forum", "Search Qualys implementation and vulnerability management discussions", [COMMUNITY, VULN], ["VMDR", "QID", "Qualys Agent"]),
  row("Palo Alto LIVEcommunity", "community-palo-alto", "https://live.paloaltonetworks.com/", "Palo Alto Networks", "commercial", "community_forum", "Search Palo Alto security product discussions and technical articles", [COMMUNITY], ["PAN-OS", "GlobalProtect", "Prisma", "Cortex", "LIVEcommunity"]),
  row("Fortinet Community", "community-fortinet", "https://community.fortinet.com/", "Fortinet", "commercial", "community_forum", "Search Fortinet product configuration and troubleshooting discussions", [COMMUNITY], ["FortiGate", "FortiOS", "FortiClient"]),
  row("Cisco Security Community", "community-cisco-security", "https://community.cisco.com/", "Cisco", "commercial", "community_forum", "Search Cisco security configuration and troubleshooting discussions", [COMMUNITY], ["Cisco Security", "Secure Firewall", "ISE"]),
  row("Elastic Discuss — Security", "community-elastic-security", "https://discuss.elastic.co/c/announcements/security-announcements/31", "Elastic", "open_source", "community_forum", "Search Elastic Security announcements and operator discussions", [COMMUNITY, DETECT], ["Elastic Security", "Elastic SIEM", "Elastic detection"], { openSource: true, children: ["catalog-elastic-detection-rules"] }),
  row("ServiceNow Security Operations Community", "community-servicenow-secops", "https://www.servicenow.com/community/secops/ct-p/security-operations", "ServiceNow", "commercial", "community_forum", "Search ServiceNow SecOps implementation and operations discussions", [COMMUNITY], ["ServiceNow SecOps", "ServiceNow IRM", "Security Operations"]),
  row("Microsoft Security Community", "community-microsoft-security", "https://techcommunity.microsoft.com/category/microsoft-security", "Microsoft", "commercial", "community_forum", "Search Microsoft security product announcements and practitioner discussions", [COMMUNITY, IDENTITY, DETECT], ["Sentinel", "KQL", "Defender", "MDE", "Entra", "Azure AD"], { brandKey: "microsoft", children: ["reference-microsoft-security-update-guide", "tool-microsoft-sysinternals", "tool-maester", "tool-microsoft365dsc"] }),
  row("F5 DevCentral", "community-f5-devcentral", "https://community.f5.com/category/Forums", "F5", "commercial", "community_forum", "Search F5 configuration, automation, and troubleshooting discussions", [COMMUNITY], ["F5 DevCentral", "BIG-IP", "iRules"]),
  row("AWS re:Post — Security, Identity & Compliance", "community-aws-repost-security", "https://repost.aws/topics?sort=popular", "Amazon Web Services", "commercial", "community_forum", "Search AWS security, identity, and compliance technical answers", [COMMUNITY, IDENTITY], ["AWS re:Post", "AWS security", "AWS IAM"]),
  row("CrowdStrike Community", "community-crowdstrike", "https://community.crowdstrike.com/", "CrowdStrike", "commercial", "community_forum", "Use CrowdStrike product knowledge and practitioner discussions", [COMMUNITY, DETECT], ["Falcon community", "CrowdStrike support"], { accessType: "customer_only", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Community access requires authentication and may depend on a CrowdStrike customer relationship." }),
  row("Tanium Community / Tanium Titans", "community-tanium", "https://site.tanium.com/", "Tanium", "commercial", "community_forum", "Use Tanium technical community and customer knowledge resources", [COMMUNITY], ["Tanium Titans", "Tanium Community"], { accessType: "customer_only", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Tanium community resources require authentication and may depend on a customer relationship." }),
  row("CyberArk Technical Community / Commons", "community-cyberark", "https://github.com/cyberark/community", "CyberArk", "commercial", "community_forum", "Use CyberArk technical community tools and shared implementation resources", [COMMUNITY, IDENTITY], ["CyberArk Commons", "CyberArk Community", "PAM community"], { publicAccessNotes: "The linked community repository is public; other CyberArk community areas may require an account.", brandKey: "github" }),
  row("Tenable Plugin Database", "catalog-tenable-plugin-database", "https://www.tenable.com/plugins/pipeline", "Tenable", "commercial", "catalog", "Search Tenable plugin metadata and vulnerability checks", [VULN], ["Nessus plugins", "Tenable plugins", "plugin database"], { brandKey: "tenable", parent: "community-tenable-connect", days: 45 }),
  row("Tenable Audit Files / Compliance Checks", "catalog-tenable-audit-files", "https://www.tenable.com/audits", "Tenable", "commercial", "catalog", "Search Tenable compliance checks and audit-file metadata", [VULN, STIG], ["Tenable audit files", "Nessus audit files", "compliance checks"], { accessType: "access_varies", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Audit metadata is publicly searchable, while downloading or operational use may require a Tenable product, account, or customer entitlement.", brandKey: "tenable", parent: "community-tenable-connect", days: 45 }),
  row("Splunk Security Content", "catalog-splunk-security-content", "https://research.splunk.com/", "Splunk", "commercial", "catalog", "Search Splunk detections, analytic stories, and security content", [DETECT], ["Splunk detections", "Splunk Security Content", "analytic stories", "SPL"], { parent: "community-splunk", days: 45 }),
  row("Elastic Detection Rules", "catalog-elastic-detection-rules", "https://github.com/elastic/detection-rules", "Elastic", "open_source", "tool", "Develop and validate Elastic Security detection rules", [DETECT, DEVSECOPS], ["Elastic rules", "Elastic detections", "detection rules"], { openSource: true, parent: "community-elastic-security", brandKey: "github" }),
  row("VirusTotal", "service-virustotal", "https://www.virustotal.com/", "Google", "commercial", "service_portal", "Investigate files, URLs, domains, and indicators across security datasets", [THREAT], ["VT", "Virus Total", "malware scan"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Basic lookups are available publicly; account, quota, licensing, and sharing limits vary by feature.", costType: "freemium", days: 45 }),
  row("Shodan", "service-shodan", "https://www.shodan.io/", "Shodan", "commercial", "service_portal", "Search internet-exposed systems and service metadata", [THREAT, VULN], ["internet search", "exposure search", "Shodan search"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Search depth, API access, and export features vary by account and subscription.", costType: "freemium", days: 45 }),
  row("Censys", "service-censys", "https://search.censys.io/", "Censys", "commercial", "service_portal", "Search internet hosts, certificates, and exposed services", [THREAT, VULN], ["Censys Search", "internet intelligence", "certificate search"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Some searches are public; expanded query, API, and export capabilities require an account or paid plan.", costType: "freemium", days: 45 }),
  row("GreyNoise Visualizer", "service-greynoise-visualizer", "https://viz.greynoise.io/", "GreyNoise Intelligence", "commercial", "service_portal", "Contextualize internet scanning activity and noisy IP indicators", [THREAT], ["GreyNoise", "GNQL", "internet noise"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Community lookups are limited; additional context and API access depend on account level.", costType: "freemium", days: 45 }),
  row("urlscan.io", "service-urlscan", "https://urlscan.io/about", "urlscan.io", "commercial", "service_portal", "Investigate websites, redirects, requests, and phishing infrastructure", [THREAT], ["urlscan", "URL scan", "phishing investigation"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Public scans and search are available; private scans and expanded API capacity require an account or plan.", costType: "freemium", days: 45 }),
  row("abuse.ch", "ecosystem-abuse-ch", "https://abuse.ch/", "abuse.ch", "practitioner", "ecosystem", "Access the abuse.ch threat intelligence project ecosystem", [THREAT], ["abuse.ch", "malware intelligence", "IOC feeds"], { children: ["dataset-urlhaus", "dataset-malwarebazaar", "dataset-threatfox"], days: 45 }),
  row("URLhaus", "dataset-urlhaus", "https://urlhaus.abuse.ch/", "abuse.ch", "practitioner", "dataset", "Search and retrieve malicious URL intelligence", [THREAT], ["URLhaus", "malicious URLs"], { parent: "ecosystem-abuse-ch", days: 45 }),
  row("MalwareBazaar", "dataset-malwarebazaar", "https://bazaar.abuse.ch/", "abuse.ch", "practitioner", "dataset", "Search malware samples and associated intelligence metadata", [THREAT], ["Malware Bazaar", "malware samples"], { parent: "ecosystem-abuse-ch", days: 45 }),
  row("ThreatFox", "dataset-threatfox", "https://threatfox.abuse.ch/", "abuse.ch", "practitioner", "dataset", "Search and share indicators of compromise", [THREAT], ["Threat Fox", "IOC database"], { parent: "ecosystem-abuse-ch", days: 45 }),
  row("Malpedia", "reference-malpedia", "https://malpedia.caad.fkie.fraunhofer.de/", "Fraunhofer FKIE", "practitioner", "catalog", "Research malware families, actors, and technical references", [THREAT], ["Malpedia", "malware encyclopedia"], { accessType: "free_account", accountRequired: true, authenticationRequired: true, publicAccessNotes: "Browsing and account access conditions are set by the publisher; some content requires authentication.", days: 45 }),
  row("SANS Internet Storm Center", "reference-sans-isc", "https://isc.sans.edu/", "SANS Technology Institute", "practitioner", "documentation", "Review operational threat observations, diaries, and network trends", [THREAT, COMMUNITY], ["ISC", "Internet Storm Center", "DShield"], { days: 45 }),
  row("Shadowserver Dashboard", "service-shadowserver-dashboard", "https://dashboard.shadowserver.org/", "The Shadowserver Foundation", "practitioner", "service_portal", "Explore public exposure and vulnerability trend dashboards", [THREAT, VULN], ["Shadowserver", "Shadowserver reports", "exposure dashboard"], { days: 45 }),
  row("LOLBAS", "reference-lolbas", "https://lolbas-project.github.io/", "LOLBAS Project", "open_source", "catalog", "Research Windows binaries and behaviors relevant to detection", [DETECT, THREAT], ["Living Off The Land Binaries", "LOLBins", "Windows behavior reference"], { openSource: true, days: 45 }),
  row("GTFOBins", "reference-gtfobins", "https://gtfobins.github.io/", "GTFOBins Project", "open_source", "catalog", "Research Unix binaries and behaviors relevant to detection", [DETECT, THREAT], ["GTFO Bins", "Unix behavior reference"], { openSource: true, days: 45 }),
  row("LOLDrivers", "reference-loldrivers", "https://www.loldrivers.io/", "LOLDrivers Project", "open_source", "catalog", "Research known vulnerable and malicious driver metadata", [DETECT, THREAT], ["Living Off The Land Drivers", "vulnerable drivers"], { openSource: true, warnings: ["Control Atlas links metadata only and does not copy, cache, mirror, or distribute driver binaries."], days: 45 }),
  row("Security Onion", "tool-security-onion", "https://securityonion.net/", "Security Onion Solutions", "open_source", "tool", "Operate an integrated network security monitoring and investigation platform", [DETECT, NETWORK], ["Security Onion", "NSM", "SOC platform"], { openSource: true }),
  row("Zeek", "tool-zeek", "https://zeek.org/", "Zeek Project", "open_source", "tool", "Generate network security telemetry and protocol analysis logs", [DETECT, NETWORK], ["Bro IDS", "Zeek logs", "network security monitoring"], { openSource: true, companions: ["tool-cisa-malcolm"] }),
  row("Suricata", "tool-suricata", "https://suricata.io/", "Open Information Security Foundation", "open_source", "tool", "Detect and inspect network threats with IDS and IPS capabilities", [DETECT, NETWORK], ["Suricata IDS", "Suricata IPS", "network detection"], { openSource: true, companions: ["tool-cisa-malcolm"] }),
  row("SigmaHQ", "ecosystem-sigmahq", "https://github.com/SigmaHQ/sigma", "SigmaHQ", "open_source", "ecosystem", "Create and share portable detection rules across security platforms", [DETECT], ["Sigma", "Sigma rules", "detection rules", "detection engineering"], { openSource: true, brandKey: "github" }),
  row("Velociraptor", "tool-velociraptor", "https://github.com/Velocidex/velociraptor", "Velocidex Enterprises", "open_source", "tool", "Collect endpoint artifacts and perform DFIR threat hunting", [DFIR, THREAT], ["DFIR", "artifact exchange", "endpoint hunting", "Velociraptor Artifact Exchange"], { openSource: true, brandKey: "github", communityLinks: ["https://docs.velociraptor.app/exchange/"] }),
  row("MISP", "tool-misp", "https://github.com/MISP/MISP", "MISP Project", "open_source", "tool", "Share, correlate, and operationalize threat intelligence", [THREAT], ["Malware Information Sharing Platform", "MISP Project"], { openSource: true, brandKey: "github" }),
  row("OpenCTI", "tool-opencti", "https://github.com/OpenCTI-Platform/opencti", "OpenCTI Platform", "open_source", "tool", "Manage and analyze structured cyber threat intelligence", [THREAT], ["Open CTI", "STIX platform", "threat intelligence platform"], { openSource: true, brandKey: "github" }),
  row("Wireshark", "tool-wireshark", "https://www.wireshark.org/", "Wireshark Foundation", "open_source", "tool", "Capture and analyze network packets and protocols", [NETWORK, DFIR], ["packet analyzer", "pcap", "tshark"], { openSource: true }),
  row("Nmap", "tool-nmap", "https://nmap.org/", "Nmap Project", "open_source", "tool", "Discover hosts, services, and network exposure", [NETWORK, VULN], ["Network Mapper", "port scanner", "service discovery"], { openSource: true }),
  row("Microsoft Sysinternals Suite", "tool-microsoft-sysinternals", "https://learn.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite", "Microsoft", "commercial", "tool", "Investigate and administer Windows systems with Microsoft utilities", [DFIR, IDENTITY], ["Sysinternals", "Process Explorer", "Autoruns", "Procmon"], { brandKey: "microsoft", parent: "community-microsoft-security" }),
  row("CyberChef", "tool-cyberchef", "https://github.com/gchq/CyberChef", "Government Communications Headquarters", "official", "tool", "Transform, decode, and analyze security data in a browser workbench", [DFIR, THREAT], ["Cyber Chef", "data transformation", "decode"], { openSource: true, brandKey: "github" }),
  row("Volatility 3", "tool-volatility-3", "https://github.com/volatilityfoundation/volatility3", "Volatility Foundation", "open_source", "tool", "Analyze volatile memory for digital forensics and incident response", [DFIR], ["Volatility", "memory forensics", "RAM analysis"], { openSource: true, brandKey: "github" }),
  row("KAPE", "tool-kape", "https://www.kroll.com/en/services/cyber/reactive-services/kroll-artifact-parser-and-extractor-kape", "Kroll", "commercial", "tool", "Collect and process Windows forensic artifacts", [DFIR], ["Kroll Artifact Parser and Extractor", "KapeFiles", "Windows DFIR"], { communityLinks: ["https://github.com/EricZimmerman/KapeFiles"] }),
  row("BloodHound Community Edition", "tool-bloodhound-ce", "https://github.com/SpecterOps/BloodHound", "SpecterOps", "open_source", "tool", "Analyze Active Directory and identity attack paths", [IDENTITY], ["BloodHound", "AD attack path", "Active Directory", "BloodHound CE"], { openSource: true, brandKey: "github" }),
  row("YARA-X", "tool-yara-x", "https://github.com/VirusTotal/yara-x", "VirusTotal", "open_source", "tool", "Create and run rules for malware and pattern detection", [DETECT, THREAT], ["YARA", "YARA X", "malware rules", "pattern matching"], { openSource: true, brandKey: "github", warnings: ["YARA-X is the active primary project. The original YARA project is in maintenance mode and is represented as a compatibility alias, not a second active card."], communityLinks: ["https://github.com/VirusTotal/yara"] }),
  row("Atomic Red Team", "tool-atomic-red-team", "https://github.com/redcanaryco/atomic-red-team", "Red Canary", "open_source", "tool", "Run ATT&CK-mapped tests to validate defensive visibility", [DETECT], ["Atomic Tests", "ART", "ATT&CK tests", "security validation"], { openSource: true, brandKey: "github", companions: ["tool-mitre-attack-navigator", "ecosystem-attack-workbench", "tool-mitre-caldera"] }),
  row("Nuclei + nuclei-templates", "ecosystem-nuclei", "https://github.com/projectdiscovery/nuclei", "ProjectDiscovery", "open_source", "ecosystem", "Run template-driven security checks and validation workflows", [VULN, DEVSECOPS], ["Nuclei", "nuclei templates", "vulnerability templates"], { openSource: true, brandKey: "github", communityLinks: ["https://github.com/projectdiscovery/nuclei-templates"] }),
  row("OSV.dev + OSV-Scanner", "ecosystem-osv", "https://github.com/google/osv-scanner", "Google", "open_source", "ecosystem", "Query and scan for open-source dependency vulnerabilities", [VULN, DEVSECOPS], ["OSV", "OSV.dev", "OSV Scanner", "open source vulnerabilities"], { openSource: true, brandKey: "github", apiLinks: ["https://osv.dev/"] }),
  row("Semgrep", "tool-semgrep", "https://github.com/semgrep/semgrep", "Semgrep", "open_source", "tool", "Scan source code with configurable static analysis rules", [DEVSECOPS], ["SAST", "Semgrep rules", "static analysis"], { openSource: true, brandKey: "github" }),
  row("Gitleaks", "tool-gitleaks", "https://github.com/gitleaks/gitleaks", "Gitleaks Project", "open_source", "tool", "Detect hard-coded secrets in repositories and files", [DEVSECOPS], ["secret detection", "Git secrets", "credential scanning"], { openSource: true, brandKey: "github" }),
  row("Kyverno", "tool-kyverno", "https://kyverno.io/", "Kyverno Project", "open_source", "tool", "Enforce and validate Kubernetes policy as code", [DEVSECOPS], ["Kubernetes policy", "admission policy", "policy as code"], { openSource: true }),
  row("Sigstore / cosign", "ecosystem-sigstore-cosign", "https://github.com/sigstore/cosign", "Sigstore", "open_source", "ecosystem", "Sign and verify software supply-chain artifacts", [DEVSECOPS], ["Sigstore", "cosign", "artifact signing", "container signing"], { openSource: true, brandKey: "github", communityLinks: ["https://www.sigstore.dev/"] }),
  row("Maester", "tool-maester", "https://github.com/maester365/maester", "Maester Project", "open_source", "tool", "Test Microsoft 365 and Entra security configuration", [IDENTITY, DEVSECOPS], ["Maester 365", "Entra testing", "Microsoft 365 security testing"], { openSource: true, brandKey: "github", parent: "community-microsoft-security" }),
  row("Microsoft365DSC", "tool-microsoft365dsc", "https://github.com/Microsoft365DSC/Microsoft365DSC", "Microsoft365DSC Project", "open_source", "tool", "Manage Microsoft 365 configuration as code", [IDENTITY, DEVSECOPS], ["M365DSC", "Microsoft 365 DSC", "configuration as code"], { openSource: true, brandKey: "github", parent: "community-microsoft-security" }),
  row("Information Security Stack Exchange", "community-information-security-stackexchange", "https://security.stackexchange.com/", "Stack Exchange", "practitioner", "community_forum", "Search a durable archive of technical security questions and answers", [COMMUNITY], ["Security Stack Exchange", "Information Security SE", "security Q&A"]),
  row("r/netsec", "community-reddit-netsec", "https://www.reddit.com/r/netsec/", "Reddit", "practitioner", "community_forum", "Follow focused technical security research and practitioner discussion", [COMMUNITY], ["Reddit netsec", "netsec subreddit"], { brandKey: "reddit" }),
  row("r/tenable", "community-reddit-tenable", "https://www.reddit.com/r/tenable/", "Reddit", "practitioner", "community_forum", "Search practitioner discussions about Tenable products", [COMMUNITY, VULN], ["Reddit Tenable", "Tenable subreddit", "Nessus subreddit"], { brandKey: "reddit", parent: "community-tenable-connect" }),
  row("r/fortinet", "community-reddit-fortinet", "https://www.reddit.com/r/fortinet/", "Reddit", "practitioner", "community_forum", "Search practitioner discussions about Fortinet products", [COMMUNITY], ["Reddit Fortinet", "Fortinet subreddit", "FortiGate subreddit"], { brandKey: "reddit", companions: ["community-fortinet"] }),
  row("r/crowdstrike", "community-reddit-crowdstrike", "https://www.reddit.com/r/crowdstrike/", "Reddit", "practitioner", "community_forum", "Search practitioner discussions about CrowdStrike products", [COMMUNITY, DETECT], ["Reddit CrowdStrike", "CrowdStrike subreddit", "Falcon subreddit"], { brandKey: "reddit", companions: ["community-crowdstrike"] }),
  row("r/paloaltonetworks", "community-reddit-paloaltonetworks", "https://www.reddit.com/r/paloaltonetworks/", "Reddit", "practitioner", "community_forum", "Search practitioner discussions about Palo Alto Networks products", [COMMUNITY], ["Reddit Palo Alto", "Palo Alto Networks subreddit", "PAN-OS subreddit"], { brandKey: "reddit", companions: ["community-palo-alto"] }),
];

if (MASTER.length !== 79) throw new Error(`Operator ecosystem master list must contain 79 candidates, found ${MASTER.length}`);

const acceptedMaster = MASTER.filter((entry) => entry.directive !== "reject");
const rejectedMaster = MASTER.filter((entry) => entry.directive === "reject");

// Evidence-backed additions requested after the original 79-candidate inventory was approved.
const SUPPLEMENTAL = [
  row("Microsoft StigRepo", "reference-microsoft-stigrepo", "https://github.com/microsoft/StigRepo", "Microsoft", "legacy", "historical_reference", "Review the archived Microsoft STIG data-processing repository and its historical PowerSTIG workflow", [STIG], ["StigRepo", "Microsoft STIG repository"], { openSource: true, brandKey: "github", maintenanceStatus: "archived", officialStatus: "publisher archived", legacyReason: "Microsoft archived this repository on June 11, 2026. Its last recorded push was November 28, 2022.", warnings: ["Archived read-only resource retained for historical context. Do not treat it as a maintained source of current STIG content."], companions: ["tool-powerstig"], days: 180 }),
  row("NUWC Newport RMF Tools", "ecosystem-nuwc-newport-rmf-tools", "https://github.com/NUWCDIVNPT", "Naval Undersea Warfare Center Division Newport", "official", "ecosystem", "Discover NAVSEA-sponsored open-source STIG assessment and RMF automation projects", [STIG], ["NUWCDIVNPT", "NUWC Newport", "NAVSEA RMF tools"], { openSource: true, brandKey: "github", children: ["tool-stig-manager"], companions: ["tool-cpat"] }),
  row("Crane POA&M Automation Tool (C-PAT)", "tool-cpat", "https://github.com/NSWC-Crane/C-PAT", "Naval Surface Warfare Center Crane Division", "official", "tool", "Automate POA&M generation and vulnerability documentation through the STIG Manager API", [STIG], ["C-PAT", "Crane POAM Automation Tool", "POA&M automation"], { openSource: true, brandKey: "github", companions: ["tool-stig-manager"] }),
  row("DISA Product Catalog", "catalog-disa-products", "https://connect.disa.mil/product/Product2/Default", "Defense Information Systems Agency", "official", "catalog", "Browse individual DISA products and service offerings", [DISA, "dod-cybersecurity-portals"], ["DISA services catalog", "DISA products"], { accessType: "access_varies", accountRequired: true, authenticationRequired: true, publicAccessNotes: "The product catalog is public; ordering, onboarding, and some product details require an authorized DISA Connect account.", parent: "portal-disa-connect", brandKey: "disa", children: ["service-disa-pdisp"] }),
  row("Private Data Internet Service Provider (PDISP)", "service-disa-pdisp", "https://connect.disa.mil/product/private-data-internet-service-provider/01t83000000GvquAAC", "Defense Information Systems Agency", "official", "restricted_service", "Review and request DISA private data internet connectivity", [DISA, NETWORK], ["PDISP", "Private Data Internet Service Provider"], { accessType: "cac_required", accountRequired: true, authenticationRequired: true, publicAccessNotes: "The product description is public; ordering and connection actions require authorized DoD access.", parent: "catalog-disa-products", brandKey: "disa" }),
  row("DISA Cloud Offerings", "catalog-disa-cloud-offerings", "https://www.cloud.mil/disa/", "Defense Information Systems Agency", "official", "catalog", "Compare DISA cloud acquisition and platform offerings", [DISA, "cloud-devsecops-software-factories"], ["DISA cloud", "JWCC", "Stratus", "DEOS"], { brandKey: "disa", children: ["service-disa-deos"] }),
  row("Defense Enterprise Office Solution (DEOS)", "service-disa-deos", "https://www.cloud.mil/deos/", "Defense Information Systems Agency", "official", "restricted_service", "Access enterprise cloud productivity, messaging, content management, and collaboration capabilities", [DISA, "cloud-devsecops-software-factories"], ["DEOS", "Defense Enterprise Office Solution"], { accessType: "cac_required", accountRequired: true, authenticationRequired: true, publicAccessNotes: "The offering page is public; service access and onboarding require authorized DoD credentials.", parent: "catalog-disa-cloud-offerings", brandKey: "disa" }),
  row("Defense Enterprise Authentication Service (DEAS)", "service-disa-deas", "https://help.disa.mil/deas/", "Defense Information Systems Agency", "official", "restricted_service", "Use DISA enterprise authentication for government applications, content, services, and systems", [DISA, IDENTITY], ["DEAS", "Defense Enterprise Authentication Service"], { accessType: "cac_required", accountRequired: true, authenticationRequired: true, publicAccessNotes: "The support page is public; authentication services and administrative capabilities require authorized government access.", parent: "portal-disa-connect", brandKey: "disa" }),
  row("Trackr.Live OpenSCAP Guide", "reference-trackr-openscap", "https://www.trackr.live/scans/openscap/", "Trackr.Live", "practitioner", "documentation", "Understand OpenSCAP engine, content, versioning, remediation, and DoD workflow tradeoffs", [STIG], ["OpenSCAP guide", "OpenSCAP field notes"], { companions: ["tool-openscap", "tool-openscap-workbench"], warnings: ["Practitioner-authored guidance, not an official OpenSCAP, Red Hat, NIST, or DISA source. Verify version and policy claims against primary publishers."] }),
  row("Tenable Product Documentation", "reference-tenable-documentation", "https://docs.tenable.com/", "Tenable", "commercial", "documentation", "Find current documentation, release notes, integrations, and developer resources for Tenable products", [VULN], ["Tenable docs", "Nessus documentation", "Security Center documentation"], { parent: "community-tenable-connect", brandKey: "tenable", days: 45 }),
];

const acceptedAdditions = [...acceptedMaster, ...SUPPLEMENTAL];

function plusDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function profileTemplate(resourceType) {
  return ({ tool: "tool", community_forum: "community", catalog: "directory", dataset: "data", ecosystem: "ecosystem", documentation: "reference", historical_reference: "reference", service_portal: "destination", restricted_service: "destination" })[resourceType] || "reference";
}

function evidenceSection(status, text, sourceUrl, values = []) {
  return { status, text, sourceUrl, ...(values.length ? { values } : {}) };
}

function claim(fieldPath, origin, sourceUrl, transformation = null) {
  return {
    fieldPath,
    origin,
    evidenceRefs: sourceUrl ? [sourceUrl] : [],
    ...(transformation ? { transformation } : {}),
    reviewStatus: "reviewed",
  };
}

function makeResource(entry) {
  const days = entry.days || (entry.resourceType === "community_forum" ? 45 : entry.resourceType === "dataset" ? 45 : 90);
  const sourceUrl = entry.evidence || entry.url;
  const isCommunity = entry.resourceType === "community_forum";
  const accessType = entry.accessType || "public";
  const restricted = accessType !== "public";
  const summary = `${entry.useCase}.`;
  const warnings = [...(entry.warnings || []), ...(isCommunity ? [COMMUNITY_WARNING] : [])];
  const resource = {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName || entry.name,
    slug: entry.id,
    summary,
    whyIncluded: `Provides a current, source-backed destination to ${entry.useCase[0].toLowerCase()}${entry.useCase.slice(1)}.`,
    canonicalUrl: entry.url,
    publisher: entry.publisher,
    maintainer: entry.publisher,
    publisherType: entry.lane === "official" ? "government" : entry.lane === "open_source" ? "open_source_project" : entry.lane === "commercial" ? "vendor" : "government_or_organization",
    resourceLane: entry.lane,
    resourceType: entry.resourceType,
    frameworks: [],
    programs: [],
    controlFamilies: [],
    lifecycleStages: entry.lifecycleStages || [],
    audiences: entry.audiences || [],
    artifactTypes: entry.resourceType === "dataset" ? ["data"] : entry.resourceType === "tool" || entry.resourceType === "ecosystem" ? ["tool"] : ["web"],
    technologyScopes: entry.technologyScopes || [],
    platforms: entry.platforms || [],
    jurisdictions: entry.lane === "official" ? ["U.S. Federal"] : [],
    governmentBranches: [],
    formats: entry.formats || [],
    accessType,
    ...(entry.costType ? { costType: entry.costType } : {}),
    accountRequired: Boolean(entry.accountRequired),
    authenticationRequired: Boolean(entry.authenticationRequired),
    publicAccessNotes: entry.publicAccessNotes || null,
    openSource: Boolean(entry.openSource),
    repositoryUrl: null,
    license: null,
    licenseUrl: null,
    redistributionPolicy: null,
    officialStatus: entry.officialStatus || null,
    maturity: null,
    maintenanceStatus: entry.maintenanceStatus || "unknown",
    currentVersion: null,
    publisherUpdatedAt: null,
    lastReleaseAt: null,
    lastCommitAt: null,
    lastCheckedAt: CHECKED_AT,
    lastChangedAt: null,
    nextCheckAt: plusDays(CHECKED_AT, days),
    updateMethod: "manual",
    updateCadence: `${days} days`,
    freshnessStatus: null,
    supersedes: null,
    supersededBy: entry.supersededBy || null,
    legacyReason: entry.legacyReason || null,
    officialCounterparts: [],
    companionResources: entry.companions || [],
    communityLinks: entry.communityLinks || [],
    trainingLinks: [],
    downloadLinks: entry.downloadLinks || [],
    apiLinks: entry.apiLinks || [],
    feedLinks: entry.feedLinks || [],
    popularitySignals: {},
    editorialNotes: null,
    warnings,
    searchAliases: [...new Set([entry.name, ...entry.aliases])],
    searchKeywords: entry.searchKeywords || [],
    featuredCollections: entry.collections,
    cardPurpose: summary,
    parentEcosystemId: entry.parent || null,
    childResourceIds: entry.children || [],
    brandKey: entry.brandKey || (entry.url.includes("github.com") ? "github" : "generic"),
    sourceEvidence: sourceUrl,
    verificationMethod: restricted ? "manual_restricted" : entry.url.includes("github.com") ? "official_repository" : "public_url",
    nextCheckReason: `${entry.resourceType} revalidation cadence`,
    overview: { text: summary, sourceUrl, sourceType: "publisher_source", exactPublisherText: false },
    compatibility: {
      status: ["tool", "ecosystem"].includes(entry.resourceType) ? "not_stated" : "not_applicable",
      operatingSystems: [],
      environments: [],
      sourceUrl,
      note: ["tool", "ecosystem"].includes(entry.resourceType) ? "The reviewed source does not state one universal supported operating system." : "This resource is data, reference content, a community, or a web destination rather than installable software.",
    },
    media: { status: "not_available", items: [], sourceUrl, reason: "No attributable publisher screenshot was required for this directory record." },
    presentationProfile: {
      profileType: entry.resourceType,
      template: profileTemplate(entry.resourceType),
      whatItDoes: evidenceSection("documented", summary, sourceUrl),
      ...(entry.audiences?.length
        ? { whoItIsFor: evidenceSection("documented", `Intended audience: ${entry.audiences.join(", ")}.`, sourceUrl, entry.audiences) }
        : {}),
      ...(warnings.length ? { limitations: evidenceSection("documented", warnings.join(" "), sourceUrl, warnings) } : {}),
    },
    entityKind: "resource",
    profileId: `resource.${entry.resourceType}`,
    origin: "atlas_editorial",
    lifecycle: {
      status: entry.maintenanceStatus || (entry.lane === "legacy" ? "historical" : "unknown"),
      evidenceRefs: entry.maintenanceStatus || entry.lane === "legacy" ? [sourceUrl] : [],
      ...(entry.supersededBy ? { replacedBy: [entry.supersededBy] } : {}),
    },
    sourceRefs: [sourceUrl],
    claimEvidence: [
      claim("/name", "publisher_normalized", sourceUrl),
      claim("/publisher", "publisher_normalized", sourceUrl),
      claim("/summary", "atlas_editorial", sourceUrl, "Atlas directory summary based on the linked destination."),
      claim("/whyIncluded", "atlas_editorial", sourceUrl, "Atlas inclusion rationale."),
      claim("/accessType", "publisher_normalized", sourceUrl),
      ...(entry.publicAccessNotes ? [claim("/publicAccessNotes", "publisher_normalized", sourceUrl)] : []),
      ...(entry.costType ? [claim("/costType", "publisher_normalized", sourceUrl)] : []),
      ...(entry.maintenanceStatus ? [claim("/maintenanceStatus", "publisher_normalized", sourceUrl)] : []),
      ...(entry.supersededBy ? [claim("/lifecycle/replacedBy", "publisher_normalized", sourceUrl)] : []),
    ],
    repositoryEvidence: null,
    automatedFields: [],
    manualFields: ["summary", "whyIncluded", "accessType", "sourceEvidence"],
  };
  if (entry.resourceType === "tool") {
    resource.toolProfile = {};
  }
  return resource;
}

const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf8"));
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const disposition = JSON.parse(readFileSync(DISPOSITION_PATH, "utf8"));

const acceptedNames = new Set(acceptedAdditions.map((entry) => entry.name));
const acceptedUrls = new Set(acceptedAdditions.map((entry) => entry.url));
const replacedRejectedNames = new Set([
  "Evaluate-STIG PowerShell Audit Tool",
  "Evaluate-STIG",
  "Tenable Audit Files",
  "Tenable audit and compliance documentation",
  "Tenable Connect",
  "Microsoft StigRepo",
]);

const additions = acceptedAdditions.map(makeResource);
const additionIds = new Set(additions.map((resource) => resource.id));
const additionUrls = new Set(additions.map((resource) => resource.canonicalUrl));
dataset.resources = dataset.resources.filter((resource) => !additionIds.has(resource.id) && !additionUrls.has(resource.canonicalUrl));
dataset.resources.push(...additions);

const existingCollections = new Map(dataset.collections.map((collection) => [collection.id, collection]));
for (const [id, title, summary, whyCurated, icon] of COLLECTIONS) {
  existingCollections.set(id, { id, title, summary, whyCurated, resourceIds: [], icon, libraryLinks: [] });
}
dataset.collections = [...existingCollections.values()];

const byId = new Map(dataset.resources.map((resource) => [resource.id, resource]));
const addExistingMembership = (resourceId, collectionId) => {
  const resource = byId.get(resourceId);
  if (!resource) return;
  resource.featuredCollections = [...new Set([...(resource.featuredCollections || []), collectionId])];
};
for (const id of ["tool-disa-scap-compliance-checker", "tool-disa-stig-viewer", "tool-stig-manager", "tool-powerstig", "tool-openscap", "tool-openscap-workbench"]) addExistingMembership(id, STIG);
for (const id of ["tool-trivy", "tool-checkov", "tool-kics"]) addExistingMembership(id, DEVSECOPS);
for (const id of ["portal-disa-connect", "service-disa-acas", "service-disa-vms"]) addExistingMembership(id, DISA);

const disaConnect = byId.get("portal-disa-connect");
if (disaConnect) disaConnect.childResourceIds = [...new Set([...(disaConnect.childResourceIds || []), "catalog-disa-products", "service-disa-deas"])];
const stigManager = byId.get("tool-stig-manager");
if (stigManager) {
  stigManager.parentEcosystemId = "ecosystem-nuwc-newport-rmf-tools";
  stigManager.companionResources = [...new Set([...(stigManager.companionResources || []), "tool-cpat"])];
}
const powerStig = byId.get("tool-powerstig");
if (powerStig) {
  powerStig.communityLinks = [...new Set([...(powerStig.communityLinks || []), "https://github.com/Microsoft/PowerStig/wiki/"])];
  powerStig.companionResources = [...new Set([...(powerStig.companionResources || []), "reference-microsoft-stigrepo"])];
}
const tenableConnect = byId.get("community-tenable-connect");
if (tenableConnect) {
  tenableConnect.alternateUrls = [...new Set([...(tenableConnect.alternateUrls || []), "https://community.tenable.com/"])];
  tenableConnect.childResourceIds = [...new Set([...(tenableConnect.childResourceIds || []), "reference-tenable-documentation"])];
}

const apl = byId.get("directory-dodin-apl");
if (!apl) throw new Error("Expected existing DoDIN APL resource");
Object.assign(apl, {
  resourceLane: "legacy",
  maintenanceStatus: "deprecated",
  officialStatus: "official; retired",
  lastCheckedAt: CHECKED_AT,
  nextCheckAt: plusDays(CHECKED_AT, 90),
  freshnessStatus: "current",
  legacyReason: "DISA states that the DoDIN APL program sunset on September 30, 2025, with scheduled testing concluding by December 31, 2025.",
  warnings: [...new Set([...(apl.warnings || []), "This is a retired program reference. Verify current DoD product-assurance requirements before relying on historical APL status."])],
  sourceEvidence: "https://aplits.disa.mil/processAPList.action",
});

for (const collection of dataset.collections) collection.resourceIds = [];
for (const resource of dataset.resources) {
  for (const collectionId of resource.featuredCollections || []) {
    const collection = existingCollections.get(collectionId);
    if (!collection) throw new Error(`${resource.id} references missing collection ${collectionId}`);
    collection.resourceIds.push(resource.id);
  }
}
for (const collection of dataset.collections) collection.resourceIds.sort();
dataset.resources.sort((left, right) => left.name.localeCompare(right.name));
dataset.lastUpdated = CHECKED_AT;

const existingAccepted = manifest.acceptedCandidates.filter((candidate) => !acceptedNames.has(candidate.candidateName) && !acceptedUrls.has(candidate.url));
manifest.acceptedCandidates = [...existingAccepted, ...acceptedAdditions.map((entry) => ({ candidateName: entry.name, url: entry.url, status: "accepted", lane: entry.lane }))]
  .sort((left, right) => left.candidateName.localeCompare(right.candidateName));
const aplCandidate = manifest.acceptedCandidates.find((candidate) => candidate.url === apl.canonicalUrl);
if (aplCandidate) aplCandidate.lane = "legacy";

const existingRejected = manifest.rejectedCandidates
  .filter((candidate) => !replacedRejectedNames.has(candidate.candidateName))
  .map((candidate) => ({
    ...candidate,
    disposition: "rejected",
    evidence: candidate.evidence || candidate.url,
    checkedAt: candidate.checkedAt || manifest.generatedOn || "2026-08-03",
    recheckAt: candidate.recheckAt || "2026-11-01",
  }));
const requiredRejections = [
  ...rejectedMaster.map((entry) => ({ candidateName: entry.name, url: entry.url, disposition: "rejected", reason: entry.reason, evidence: entry.evidence, checkedAt: CHECKED_AT, recheckAt: plusDays(CHECKED_AT, 90) })),
];
manifest.rejectedCandidates = [...existingRejected, ...requiredRejections].sort((left, right) => left.candidateName.localeCompare(right.candidateName));
manifest.candidateDispositions = [
  ...manifest.acceptedCandidates.map((candidate) => ({ candidate: candidate.candidateName, canonicalUrl: candidate.url, disposition: "accepted", evidence: candidate.url, actionTaken: "Accepted as a canonical Resource record with source, access, freshness, and collection metadata." })),
  ...manifest.rejectedCandidates.map((candidate) => ({ candidate: candidate.candidateName, canonicalUrl: candidate.url, disposition: "rejected", evidence: candidate.evidence, actionTaken: candidate.reason })),
].sort((left, right) => left.candidate.localeCompare(right.candidate));
manifest.manifestVersion = "3.1";
manifest.generatedOn = CHECKED_AT;
manifest.acceptedCount = manifest.acceptedCandidates.length;
manifest.rejectedCount = manifest.rejectedCandidates.length;
manifest.totalEvaluated = manifest.acceptedCount + manifest.rejectedCount;

if (manifest.acceptedCount !== dataset.resources.length) throw new Error(`Accepted count ${manifest.acceptedCount} does not match dataset ${dataset.resources.length}`);

disposition.schemaVersion = "3.1";
disposition.checkedAt = CHECKED_AT;
disposition.candidates = manifest.candidateDispositions;
disposition.summary = {
  evaluated: manifest.totalEvaluated,
  accepted: manifest.acceptedCount,
  rejected: manifest.rejectedCount,
};

writeJsonAtomically(DATASET_PATH, dataset);
writeJsonAtomically(MANIFEST_PATH, manifest);
writeJsonAtomically(DISPOSITION_PATH, disposition);
writeJsonAtomically(MASTER_PATH, {
  schemaVersion: "1.0",
  validatedAsOf: CHECKED_AT,
  defaultDirective: "add",
  candidates: MASTER.map((entry, index) => ({
    number: index + 1,
    name: entry.name,
    canonicalUrl: entry.url,
    directive: entry.directive || "add",
    finalDisposition: entry.directive === "reject" ? "rejected" : "accepted",
    resourceId: entry.id || null,
    evidence: entry.evidence || entry.url,
  })),
  supplementalCandidates: SUPPLEMENTAL.map((entry, index) => ({
    number: index + 1,
    name: entry.name,
    canonicalUrl: entry.url,
    directive: "add",
    finalDisposition: "accepted",
    resourceId: entry.id,
    evidence: entry.evidence || entry.url,
    scopeBasis: "Evidence-backed user expansion after the original 79-candidate inventory.",
  })),
});
console.log(`Applied operator ecosystem expansion: ${acceptedMaster.length} accepted master candidates, ${SUPPLEMENTAL.length} supplemental candidates, ${rejectedMaster.length} rejected master candidate, ${dataset.resources.length} resources, ${dataset.collections.length} collections.`);
