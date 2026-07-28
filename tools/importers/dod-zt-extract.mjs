import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CURATED = join(ROOT, 'data', 'curated', 'dod-zt');
const MAPS = join(ROOT, 'maps');

const DEFAULT_PATHS = {
  referenceArchitecture: 'd:/Storage/Downloads/(U)ZT_RA_v2.0(U)_Sep22.pdf',
  overlays: 'd:/Storage/Downloads/DoD Zero Trust Overlays-Feb 2024.pdf',
  capabilities: '',
};

const CONTROL_RE = /\b([A-Z]{2,3})-(\d+(?:\(\d+\))?)\b/g;
const CAPABILITY_HEADER_RE = /Capability\s+(\d+\.\d+):\s+([^\n]+)/g;
const ACTIVITY_RE = /\b(\d+\.\d+\.\d+)\s+([^\n*]+)/g;
const INVALID_CONTROLS = new Set(['NSM-8']);

const TENETS = [
  { id: 'TENET-1', title: 'Assume a Hostile Environment', description: 'Operate without implicit trust in network location or asset ownership.' },
  { id: 'TENET-2', title: 'Presume Breach', description: 'Consciously operate and defend resources with the assumption that an adversary is present.' },
  { id: 'TENET-3', title: 'Never Trust, Always Verify', description: 'Require explicit verification for every access decision.' },
  { id: 'TENET-4', title: 'Scrutinize Explicitly', description: 'Apply explicit scrutiny to users, devices, applications, and data flows.' },
  { id: 'TENET-5', title: 'Apply Unified Analytics', description: 'Use unified analytics to inform authentication, authorization, and monitoring decisions.' },
];

const PILLARS = [
  { id: 'PILLAR-1', number: 1, title: 'User', family: 'Zero Trust Pillars', description: 'Continuously authenticate, access, and monitor user activity patterns to govern users\' access and privileges.' },
  { id: 'PILLAR-2', number: 2, title: 'Device', family: 'Zero Trust Pillars', description: 'Understand device health and status to inform risk decisions and real-time access.' },
  { id: 'PILLAR-3', number: 3, title: 'Applications and Workload', family: 'Zero Trust Pillars', description: 'Secure applications, workloads, containers, virtual machines, and hypervisors.' },
  { id: 'PILLAR-4', number: 4, title: 'Data', family: 'Zero Trust Pillars', description: 'Provide data transparency, visibility, encryption, and tagging across the enterprise.' },
  { id: 'PILLAR-5', number: 5, title: 'Network and Environment', family: 'Zero Trust Pillars', description: 'Segment, isolate, and control the network environment with dynamic policy and access controls.' },
  { id: 'PILLAR-6', number: 6, title: 'Automation and Orchestration', family: 'Zero Trust Pillars', description: 'Automate security response based on defined policies and orchestration.' },
  { id: 'PILLAR-7', number: 7, title: 'Visibility and Analytics', family: 'Zero Trust Pillars', description: 'Maintain visibility and analytics across users, devices, networks, applications, and data.' },
];

const OVERLAY_SECTIONS = [
  { id: 'OVERLAY-USER', pillar_id: 'PILLAR-1', title: 'User Pillar Overlay', appendix: 'C', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-C' },
  { id: 'OVERLAY-DEVICE', pillar_id: 'PILLAR-2', title: 'Device Pillar Overlay', appendix: 'D', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-D' },
  { id: 'OVERLAY-APP', pillar_id: 'PILLAR-3', title: 'Application and Workload Pillar Overlay', appendix: 'E', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-E' },
  { id: 'OVERLAY-DATA', pillar_id: 'PILLAR-4', title: 'Data Pillar Overlay', appendix: 'F', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-F' },
  { id: 'OVERLAY-NET', pillar_id: 'PILLAR-5', title: 'Network and Environment Pillar Overlay', appendix: 'G', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-G' },
  { id: 'OVERLAY-AUTO', pillar_id: 'PILLAR-6', title: 'Automation and Orchestration Pillar Overlay', appendix: 'H', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-H' },
  { id: 'OVERLAY-VIS', pillar_id: 'PILLAR-7', title: 'Visibility and Analytics Pillar Overlay', appendix: 'I', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-I' },
  { id: 'OVERLAY-ENABLER', pillar_id: 'PILLAR-ENABLER', title: 'Execution Enabler Overlay', appendix: 'B', locator: 'ZeroTrustOverlays-2024Feb.pdf#Appendix-B' },
];

const PILLAR_ENABLER = {
  id: 'PILLAR-ENABLER',
  number: 8,
  title: 'Execution Enablers',
  family: 'Zero Trust Enablers',
  description: 'Cross-cutting, non-technical capabilities and activities that address culture, governance, and DOTmLPF-P elements.',
};

function parseArgs(argv) {
  const args = { ...DEFAULT_PATHS };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--ra' && value) args.referenceArchitecture = value;
    if (key === '--overlays' && value) args.overlays = value;
    if (key === '--capabilities' && value) args.capabilities = value;
  }
  return args;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function readPdfText(path) {
  if (!existsSync(path)) throw new Error(`Missing PDF: ${path}`);
  const parser = new PDFParse({ data: readFileSync(path) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

export function normalizeControlId(raw) {
  const match = String(raw).match(/^([A-Z]{2,3})-(\d+)(?:\((\d+)\))?$/);
  if (!match) return null;
  return match[3] ? `${match[1]}-${match[2]}(${match[3]})` : `${match[1]}-${match[2]}`;
}

export function capabilityNodeId(capabilityId) {
  return `CAP-${String(capabilityId).replace('.', '-')}`;
}

export function activityNodeId(activityId) {
  return `ACT-${String(activityId).replace(/\./g, '-')}`;
}

export function extractOverlayRelationships(text, sourceKey = 'dod-zt-overlays-2024') {
  const headers = [];
  let match;
  while ((match = CAPABILITY_HEADER_RE.exec(text)) !== null) {
    headers.push({ id: match[1], title: match[2].trim(), index: match.index });
  }

  const relationships = [];
  const seen = new Set();
  for (let i = 0; i < headers.length; i += 1) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const block = text.slice(start, end);
    const controls = new Set();
    let controlMatch;
    while ((controlMatch = CONTROL_RE.exec(block)) !== null) {
      const controlId = normalizeControlId(controlMatch[0]);
      if (!controlId || INVALID_CONTROLS.has(controlId)) continue;
      controls.add(controlId);
    }
    for (const controlId of controls) {
      const targetId = capabilityNodeId(headers[i].id);
      const dedupe = `${controlId}:${targetId}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      relationships.push({
        source_id: controlId,
        target_id: targetId,
        relationship_type: 'supports',
        why: `DoD Zero Trust Overlays associates NIST SP 800-53 ${controlId} with capability ${headers[i].id} ${headers[i].title}.`,
        source_locator: `ZeroTrustOverlays-2024Feb.pdf#Capability-${headers[i].id}`,
        evidence_source: sourceKey,
      });
    }
  }
  return { relationships, capabilities: headers };
}

export function extractActivitiesFromOverlays(text) {
  const activities = [];
  const seen = new Set();
  for (const match of text.matchAll(/\b(\d+\.\d+\.\d+)\s+([^\n]+)/g)) {
    const id = match[1];
    const [pillar] = id.split('.');
    if (Number(pillar) < 1 || Number(pillar) > 7) continue;
    const title = match[2].replace(/\s+\.{3,}.*$/, '').trim();
    if (!title || title.length < 4 || /page\s+[A-Z]-\d+/i.test(title)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    activities.push({
      id,
      capability_id: id.split('.').slice(0, 2).join('.'),
      title,
      level: 'Target',
      locator: `ZeroTrustOverlays-2024Feb.pdf#Activity-${id}`,
      source_key: 'dod-zt-overlays-2024',
    });
  }
  return activities;
}

export function extractCapabilitiesAndActivities(text) {
  const lines = text.split('\n');
  const capabilities = [];
  const activities = [];
  const capabilityById = new Map();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const capMatch = line.match(/^(\d+\.\d+)\s+(.+?)\s+(\d+)\s*-\s*(.+)$/);
    if (capMatch) {
      const id = capMatch[1];
      const pillarNumber = Number(capMatch[3]);
      const record = {
        id,
        pillar_id: `PILLAR-${pillarNumber}`,
        title: capMatch[2].trim(),
        pillar_name: capMatch[4].trim(),
        description: '',
        outcome: '',
        impact: '',
        level: 'Target',
        locator: `ZTCapabilitiesActivities.pdf#${id}`,
      };
      capabilities.push(record);
      capabilityById.set(id, record);
      continue;
    }

    const activityMatch = line.match(/^(\d+\.\d+\.\d+)\s+(.+?)\s+(Target Level ZT|Advanced Level ZT|Target|Advanced)/);
    if (activityMatch) {
      const capabilityId = activityMatch[1].split('.').slice(0, 2).join('.');
      activities.push({
        id: activityMatch[1],
        capability_id: capabilityId,
        title: activityMatch[2].trim(),
        level: activityMatch[3].includes('Advanced') ? 'Advanced' : 'Target',
        locator: `ZTCapabilitiesActivities.pdf#${activityMatch[1]}`,
      });
    }
  }

  if (capabilities.length === 0) {
    return { capabilities: buildFallbackCapabilities(), activities: buildFallbackActivities() };
  }
  return { capabilities, activities };
}

function buildFallbackCapabilities() {
  return [
    { id: '1.1', pillar_id: 'PILLAR-1', title: 'User Inventory', description: 'Regular and privileged users are identified and integrated into an inventory.', outcome: 'System owners have control of all authorized users.', impact: 'Users not on the authorized user list will be denied access by policy.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.1' },
    { id: '1.2', pillar_id: 'PILLAR-1', title: 'Conditional User Access', description: 'Creates a dynamic level of access for users through phased maturity.', outcome: 'Dynamic user, device, and NPE access through risk profiles.', impact: 'Unknown or high-risk users are denied access with greater accuracy.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.2' },
    { id: '1.3', pillar_id: 'PILLAR-1', title: 'Multi-Factor Authentication (MFA)', description: 'Centralize MFA and identity provider capabilities.', outcome: 'Users authenticate with at least two authentication factors.', impact: 'Users without multiple authentication forms are denied access.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.3' },
    { id: '1.4', pillar_id: 'PILLAR-1', title: 'Privileged Access Management (PAM)', description: 'Remove permanent administrator privileges through PAM.', outcome: 'Privileged identities are controlled, monitored, secured, and audited.', impact: 'Critical assets are secured through limits on admin access.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.4' },
    { id: '1.5', pillar_id: 'PILLAR-1', title: 'Identity Federation and User Credentialing', description: 'Standardize ILM and integrate with organizational IDP/IDM.', outcome: 'Credentials are issued, managed, and revoked across trust domains.', impact: 'Users lacking sufficient credentials are denied access.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.5' },
    { id: '1.6', pillar_id: 'PILLAR-1', title: 'Behavioral, Contextual ID, and Biometrics', description: 'Enable UEBA with enterprise and organizational attributes.', outcome: 'Behavioral, contextual, and biometric telemetry enhance access controls.', impact: 'Anomalous activity informs risk-based authentication.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#1.6' },
    { id: '1.7', pillar_id: 'PILLAR-1', title: 'Least Privileged Access', description: 'Enforce least privilege across enterprise access.', outcome: 'Access is limited to minimum necessary privileges.', impact: 'Excessive privileges are removed or denied.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.7' },
    { id: '1.8', pillar_id: 'PILLAR-1', title: 'Continuous Authentication', description: 'Continuously evaluate authentication context during sessions.', outcome: 'Sessions are continuously evaluated for risk.', impact: 'High-risk sessions are terminated or re-authenticated.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#1.8' },
    { id: '1.9', pillar_id: 'PILLAR-1', title: 'Integrated ICAM Platform', description: 'Integrate ICAM capabilities across the enterprise.', outcome: 'Enterprise ICAM provides unified identity services.', impact: 'Fragmented identity tooling is reduced.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#1.9' },
    { id: '2.1', pillar_id: 'PILLAR-2', title: 'Device Inventory', description: 'Maintain an inventory of authorized devices.', outcome: 'Device inventory supports authorization decisions.', impact: 'Unknown devices are denied or quarantined.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.1' },
    { id: '2.2', pillar_id: 'PILLAR-2', title: 'Device Detection and Compliance', description: 'Detect devices and assess compliance posture.', outcome: 'Non-compliant devices are identified.', impact: 'Non-compliant devices are blocked or remediated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.2' },
    { id: '2.3', pillar_id: 'PILLAR-2', title: 'Device Authorization with Real Time Inspection', description: 'Authorize devices using real-time inspection.', outcome: 'Device health informs every access request.', impact: 'Unhealthy devices are denied access.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.3' },
    { id: '2.4', pillar_id: 'PILLAR-2', title: 'Remote Access', description: 'Secure remote access to enterprise resources.', outcome: 'Remote sessions meet zero trust requirements.', impact: 'Untrusted remote access is denied.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.4' },
    { id: '2.5', pillar_id: 'PILLAR-2', title: 'Partially and Fully Automated Asset, Vulnerability, and Patch Management', description: 'Automate asset, vulnerability, and patch management.', outcome: 'Assets are patched and vulnerabilities managed at scale.', impact: 'Unpatched assets are restricted.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.5' },
    { id: '2.6', pillar_id: 'PILLAR-2', title: 'Unified Endpoint Management and Mobile Device Management', description: 'Manage endpoints and mobile devices consistently.', outcome: 'Enterprise endpoint management is unified.', impact: 'Unmanaged endpoints are denied.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#2.6' },
    { id: '2.7', pillar_id: 'PILLAR-2', title: 'Endpoint and Extended Detection and Response', description: 'Deploy EDR/XDR across endpoints.', outcome: 'Endpoint threats are detected and responded to centrally.', impact: 'Compromised endpoints are isolated.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#2.7' },
    { id: '3.1', pillar_id: 'PILLAR-3', title: 'Application Inventory', description: 'Inventory applications and workloads.', outcome: 'Applications are visible and authorized.', impact: 'Unknown applications are blocked or removed.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#3.1' },
    { id: '3.2', pillar_id: 'PILLAR-3', title: 'Secure Software Development and Integration', description: 'Integrate secure development practices.', outcome: 'Applications are developed and integrated securely.', impact: 'Insecure software is remediated before deployment.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#3.2' },
    { id: '3.3', pillar_id: 'PILLAR-3', title: 'Software Risk Management', description: 'Manage software supply chain and component risk.', outcome: 'Software risk is assessed and tracked.', impact: 'High-risk software is blocked or mitigated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#3.3' },
    { id: '3.4', pillar_id: 'PILLAR-3', title: 'Resource Authorization and Integration', description: 'Authorize application and workload resources.', outcome: 'Resources are authorized before access is granted.', impact: 'Unauthorized resources are denied.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#3.4' },
    { id: '3.5', pillar_id: 'PILLAR-3', title: 'Continuous Monitoring and Ongoing Authorizations', description: 'Continuously monitor applications for authorization.', outcome: 'Ongoing authorization replaces point-in-time approvals.', impact: 'Drift from authorized state triggers response.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#3.5' },
    { id: '4.1', pillar_id: 'PILLAR-4', title: 'Data Catalog Risk Alignment', description: 'Align data catalogs with risk management.', outcome: 'Data assets are cataloged with risk context.', impact: 'Uncataloged sensitive data is discovered and protected.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.1' },
    { id: '4.2', pillar_id: 'PILLAR-4', title: 'DoD Enterprise Data Governance', description: 'Govern data across the enterprise.', outcome: 'Enterprise data governance is established.', impact: 'Ungoverned data flows are restricted.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.2' },
    { id: '4.3', pillar_id: 'PILLAR-4', title: 'Data Labeling and Tagging', description: 'Label and tag data for protection decisions.', outcome: 'Data is labeled consistently.', impact: 'Unlabeled sensitive data is remediated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.3' },
    { id: '4.4', pillar_id: 'PILLAR-4', title: 'Data Monitoring and Sensing', description: 'Monitor data access and movement.', outcome: 'Data usage is visible in near real time.', impact: 'Anomalous data access triggers response.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.4' },
    { id: '4.5', pillar_id: 'PILLAR-4', title: 'Data Encryption and Rights Management', description: 'Encrypt data and enforce rights management.', outcome: 'Sensitive data is encrypted and rights-managed.', impact: 'Unprotected sensitive data is blocked or encrypted.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.5' },
    { id: '4.6', pillar_id: 'PILLAR-4', title: 'Data Loss Prevention', description: 'Prevent unauthorized data exfiltration.', outcome: 'DLP controls are deployed enterprise-wide.', impact: 'Data exfiltration attempts are blocked.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.6' },
    { id: '4.7', pillar_id: 'PILLAR-4', title: 'Data Access Control', description: 'Control access to data based on policy.', outcome: 'Data access follows least privilege.', impact: 'Unauthorized data access is denied.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#4.7' },
    { id: '5.1', pillar_id: 'PILLAR-5', title: 'Data Flow Mapping', description: 'Map data flows across the environment.', outcome: 'Data flows are documented and monitored.', impact: 'Unknown flows are restricted.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#5.1' },
    { id: '5.2', pillar_id: 'PILLAR-5', title: 'Software Defined Networking', description: 'Use SDN for dynamic network policy.', outcome: 'Network policy is software defined.', impact: 'Static overly permissive paths are removed.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#5.2' },
    { id: '5.3', pillar_id: 'PILLAR-5', title: 'Macro Segmentation', description: 'Segment the network at macro boundaries.', outcome: 'Macro segments limit lateral movement.', impact: 'Cross-segment access requires authorization.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#5.3' },
    { id: '5.4', pillar_id: 'PILLAR-5', title: 'Micro Segmentation', description: 'Apply fine-grained network segmentation.', outcome: 'Micro segments enforce least privilege network access.', impact: 'Unnecessary east-west traffic is denied.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#5.4' },
    { id: '6.1', pillar_id: 'PILLAR-6', title: 'API Standardization', description: 'Standardize APIs for security automation.', outcome: 'Security tooling integrates through standard APIs.', impact: 'Non-standard integrations are reduced.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#6.1' },
    { id: '6.2', pillar_id: 'PILLAR-6', title: 'Critical Process Automation', description: 'Automate critical security processes.', outcome: 'Key security processes are automated.', impact: 'Manual gaps in security response are reduced.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#6.2' },
    { id: '6.3', pillar_id: 'PILLAR-6', title: 'Machine Learning', description: 'Apply machine learning to security operations.', outcome: 'ML augments detection and response.', impact: 'Anomalies are detected faster.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#6.3' },
    { id: '6.4', pillar_id: 'PILLAR-6', title: 'Artificial Intelligence', description: 'Apply AI to security orchestration and response.', outcome: 'AI-assisted response is integrated.', impact: 'Response latency is reduced.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#6.4' },
    { id: '6.5', pillar_id: 'PILLAR-6', title: 'Automated Decision Making', description: 'Automate policy-based security decisions.', outcome: 'Decisions are automated within policy bounds.', impact: 'Manual policy enforcement gaps are reduced.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#6.5' },
    { id: '6.6', pillar_id: 'PILLAR-6', title: 'Security Orchestration, Automation, and Response (SOAR)', description: 'Orchestrate automated security response.', outcome: 'SOAR integrates security tooling.', impact: 'Incident response is coordinated automatically.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#6.6' },
    { id: '6.7', pillar_id: 'PILLAR-6', title: 'Security Operations Center (SOC) Optimization', description: 'Optimize SOC workflows for zero trust.', outcome: 'SOC processes support zero trust operations.', impact: 'Operational blind spots are reduced.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#6.7' },
    { id: '7.1', pillar_id: 'PILLAR-7', title: 'Log All Traffic (Network, Data, Apps, User)', description: 'Log traffic across all zero trust pillars.', outcome: 'Comprehensive logging is available for analysis.', impact: 'Unlogged critical traffic is remediated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#7.1' },
    { id: '7.2', pillar_id: 'PILLAR-7', title: 'Security Information and Event Management (SIEM)', description: 'Centralize security event management.', outcome: 'Events are correlated in a SIEM.', impact: 'Uncorrelated critical events are escalated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#7.2' },
    { id: '7.3', pillar_id: 'PILLAR-7', title: 'Common Security and Risk Analytics', description: 'Share analytics across the enterprise.', outcome: 'Risk analytics are common and reusable.', impact: 'Siloed analytics are integrated.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#7.3' },
    { id: '7.4', pillar_id: 'PILLAR-7', title: 'User and Entity Behavior Analytics (UEBA)', description: 'Analyze user and entity behavior.', outcome: 'Behavioral analytics inform access decisions.', impact: 'Anomalous behavior triggers response.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#7.4' },
    { id: '7.5', pillar_id: 'PILLAR-7', title: 'Threat Intelligence Integration', description: 'Integrate threat intelligence into analytics.', outcome: 'Threat intelligence enriches detections.', impact: 'Known threats are blocked faster.', level: 'Target', locator: 'ZTCapabilitiesActivities.pdf#7.5' },
    { id: '7.6', pillar_id: 'PILLAR-7', title: 'Automated Dynamic Policies', description: 'Dynamically update policies from analytics.', outcome: 'Policies adapt based on analytics.', impact: 'Stale policies are automatically updated.', level: 'Advanced', locator: 'ZTCapabilitiesActivities.pdf#7.6' },
  ];
}

function buildFallbackActivities() {
  const titles = {
    '1.1.1': 'Inventory User',
    '1.2.1': 'Implement Application Based Permissions per Enterprise',
    '1.2.2': 'Rule Based Dynamic Access Part 1',
    '1.3.1': 'Organizational MFA/IDP',
    '2.1.1': 'Inventory Devices',
    '3.1.1': 'Inventory Applications',
    '4.1.1': 'Data Catalog Alignment',
    '5.1.1': 'Map Data Flows',
    '6.1.1': 'Standardize APIs',
    '7.1.1': 'Log All Traffic',
  };
  return Object.entries(titles).map(([id, title]) => ({
    id,
    capability_id: id.split('.').slice(0, 2).join('.'),
    title,
    level: 'Target',
    locator: `ZTCapabilitiesActivities.pdf#${id}`,
  }));
}

function buildTaxonomy(overlayCapabilities) {
  const overlayTitles = new Map(overlayCapabilities.map((entry) => [entry.id, entry.title]));
  return {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    tenets: TENETS.map((entry) => ({
      ...entry,
      source_key: 'dod-zt-reference-architecture-v2',
      locator: `ZT_RA_v2.0#section-2.2-${entry.id}`,
    })),
    pillars: [...PILLARS, PILLAR_ENABLER].map((entry) => ({
      ...entry,
      source_key: 'dod-zt-reference-architecture-v2',
      locator: `ZT_RA_v2.0#pillar-${entry.number}`,
    })),
    overlay_sections: OVERLAY_SECTIONS.map((entry) => ({
      ...entry,
      source_key: 'dod-zt-overlays-2024',
    })),
    documents: [
      {
        id: 'DOC-RA',
        title: 'DoD Zero Trust Reference Architecture v2.0',
        source_key: 'dod-zt-reference-architecture-v2',
        locator: 'ZT_RA_v2.0',
        relationships: [{ target_catalog: 'dod-zt', target_id: 'CATALOG', relationship_type: 'defines' }],
      },
      {
        id: 'DOC-STRATEGY',
        title: 'DoD Zero Trust Strategy',
        source_key: 'dod-zt-strategy',
        locator: 'DoD-ZTStrategy.pdf',
        relationships: [{ target_catalog: 'dod-zt', target_id: 'DOC-RA', relationship_type: 'references' }],
      },
      {
        id: 'DOC-ROADMAP',
        title: 'DoD Zero Trust Capability Execution Roadmap v1.1',
        source_key: 'dod-zt-execution-roadmap',
        locator: 'ZT-ExecutionRoadmap-v1.1.pdf',
        relationships: [{ target_catalog: 'dod-zt', target_id: 'DOC-STRATEGY', relationship_type: 'references' }],
      },
      {
        id: 'DOC-OVERLAYS',
        title: 'DoD Zero Trust Overlays',
        source_key: 'dod-zt-overlays-2024',
        locator: 'ZeroTrustOverlays-2024Feb.pdf',
        disambiguation: 'DoD control overlays on ZT pillars (RMF overlay sense), not overlay networks or ZTNA.',
        relationships: [
          { target_catalog: 'dod-zt', target_id: 'DOC-RA', relationship_type: 'references' },
          { target_catalog: 'dod-zt', target_id: 'DOC-ROADMAP', relationship_type: 'references' },
        ],
      },
    ],
    overlay_capability_titles: [...overlayTitles.entries()].map(([id, title]) => ({ id, title })),
  };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function extractDodZeroTrust(options = DEFAULT_PATHS) {
  mkdirSync(CURATED, { recursive: true });
  mkdirSync(MAPS, { recursive: true });

  const overlaysText = await readPdfText(options.overlays);
  const { relationships, capabilities: overlayCapabilities } = extractOverlayRelationships(overlaysText);
  const overlayActivities = extractActivitiesFromOverlays(overlaysText);

  let capabilitiesText = '';
  if (options.capabilities && existsSync(options.capabilities)) {
    const header = readFileSync(options.capabilities).subarray(0, 4).toString();
    if (header.startsWith('%PDF')) {
      try {
        capabilitiesText = await readPdfText(options.capabilities);
      } catch {
        capabilitiesText = '';
      }
    }
  }

  const { capabilities, activities: parsedActivities } = capabilitiesText
    ? extractCapabilitiesAndActivities(capabilitiesText)
    : { capabilities: buildFallbackCapabilities(), activities: [] };

  const activities = overlayActivities.length ? overlayActivities : (parsedActivities.length ? parsedActivities : buildFallbackActivities());

  for (const overlayCap of overlayCapabilities) {
    const id = overlayCap.id;
    if (!capabilities.some((entry) => entry.id === id)) {
      const pillarNumber = Number(id.split('.')[0]);
      capabilities.push({
        id,
        pillar_id: `PILLAR-${pillarNumber}`,
        title: overlayCap.title,
        description: `Capability ${id} from DoD Zero Trust Overlays.`,
        outcome: '',
        impact: '',
        level: 'Target',
        locator: `ZeroTrustOverlays-2024Feb.pdf#Capability-${id}`,
      });
    } else {
      const existing = capabilities.find((entry) => entry.id === id);
      if (existing && !existing.title) existing.title = overlayCap.title;
    }
  }

  const taxonomy = buildTaxonomy(overlayCapabilities);
  const overlaysChecksum = sha256File(options.overlays);

  const mapDocument = {
    schema_version: '2.0',
    source_key: 'dod-zt-overlays-2024',
    source_artifact: 'https://dodcio.defense.gov/Portals/0/Documents/Library/ZeroTrustOverlays-2024Feb.pdf',
    source_version: '2024-02',
    snapshot_date: new Date().toISOString().slice(0, 10),
    checksum: `sha256:${overlaysChecksum}`,
    provenance: 'DoD Zero Trust Overlays (Feb 2024) control-to-capability allocations from pillar overlay appendices.',
    owner_authority: true,
    submitter: 'DoD CIO',
    relationships,
  };

  writeJson(join(CURATED, 'taxonomy.json'), taxonomy);
  writeJson(join(CURATED, 'capabilities.json'), { schema_version: '1.0', source_key: 'dod-zt-capabilities', records: capabilities });
  writeJson(join(CURATED, 'activities.json'), { schema_version: '1.0', source_key: 'dod-zt-capabilities', records: activities });
  writeJson(join(MAPS, '800-53-to-dod-zt-overlays.json'), mapDocument);

  return {
    taxonomy,
    capabilities: capabilities.length,
    activities: activities.length,
    relationships: relationships.length,
    overlaysChecksum,
  };
}

async function main() {
  const options = parseArgs(process.argv);
  const result = await extractDodZeroTrust(options);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('dod-zt-extract.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
