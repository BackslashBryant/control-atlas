import registry from "../../data/generated/taxonomy-registry.json" with { type: "json" };
import { TAXONOMY_TAG_BY_ID } from "./taxonomy-contract.mjs";

/** @type {[RegExp, string][]} */
const PUBLISHER_ORGANIZATION_PATTERNS = [
  [/^(?:DISA|Defense Information Systems Agency)/i, "organization.disa"],
  [/^(?:NIST|National Institute of Standards)/i, "organization.nist"],
  [/^(?:CISA|Cybersecurity and Infrastructure)/i, "organization.cisa"],
  [/^(?:FedRAMP)/i, "organization.fedramp"],
  [/^(?:MITRE)/i, "organization.mitre"],
  [/^(?:DCSA|Defense Counterintelligence)/i, "organization.dcsa"],
  [/^(?:NSA)/i, "organization.nsa"],
  [/^(?:DoD|Department of Defense)/i, "organization.dod"],
];

const CATALOG_ORGANIZATION_PREFIXES = [
  ["disa-", "organization.disa"],
  ["dod-", "organization.dod"],
  ["nist-", "organization.nist"],
  ["csf-", "organization.nist"],
  ["fips-", "organization.nist"],
  ["cisa-", "organization.cisa"],
  ["fedramp-", "organization.fedramp"],
  ["cmmc-", "organization.dod"],
  ["cui-", "organization.nist"],
  ["mitre-", "organization.mitre"],
  ["microsoft-", "vendor.microsoft"],
];

/** @type {[RegExp, string][]} */
const CATALOG_FRAMEWORK_RULES = [
  [/^nist-800-53/, "framework.rmf"],
  [/^nist-800-37/, "framework.rmf"],
  [/^nist-800-171/, "framework.rmf"],
  [/^nist-800-172/, "framework.rmf"],
  [/^fedramp/, "framework.fedramp"],
  [/^cmmc/, "framework.cmmc"],
  [/^csf/, "framework.nist-csf"],
  [/^nist-ai-rmf/, "framework.nist-ai-rmf"],
];

/** @type {[RegExp, string][]} */
const CATALOG_PROGRAM_RULES = [
  [/^disa-stig/, "program.stig"],
  [/^disa-srg/, "program.stig"],
  [/^cmmc/, "program.cmmc"],
  [/^dod-zt/, "program.zero-trust"],
  [/^microsoft-zt/, "program.zero-trust"],
  [/^nist-zt/, "program.zero-trust"],
];

const RESOURCE_FRAMEWORK_MAP = new Map([
  ["RMF", "framework.rmf"],
  ["DoD RMF", "framework.rmf"],
  ["NIST RMF", "framework.rmf"],
  ["FedRAMP", "framework.fedramp"],
  ["FedRAMP 20x", "framework.fedramp"],
  ["FedRAMP Rev. 5", "framework.fedramp"],
  ["NIST CSF", "framework.nist-csf"],
  ["CSF", "framework.nist-csf"],
  ["NIST AI RMF", "framework.nist-ai-rmf"],
  ["AI RMF", "framework.nist-ai-rmf"],
  ["CMMC", "framework.cmmc"],
]);

const RESOURCE_PROGRAM_MAP = new Map([
  ["STIG", "program.stig"],
  ["CMMC", "program.cmmc"],
  ["Zero Trust", "program.zero-trust"],
]);

const RESOURCE_TOPIC_MAP = new Map([
  ["Continuous Monitoring", "topic.continuous-monitoring"],
  ["Vulnerability Management", "topic.vulnerability-management"],
  ["Configuration Management", "topic.configuration-management"],
]);

/** @type {[RegExp, string][]} */
const RESOURCE_TOOL_PATTERNS = [
  [/\bemass\b/i, "tool.emass"],
  [/\bstig.viewer\b/i, "tool.stig-viewer"],
  [/\bscap.compliance.checker\b|\bscc\b/i, "tool.scap-compliance-checker"],
  [/\boscal\b/i, "tool.oscal"],
];

const SOURCE_REF_TAG_MAP = new Map([
  ["mitre-emass-api-v3-22", ["tool.emass"]],
  ["disa-stig-viewer-v1r7", ["tool.stig-viewer"]],
  ["nist-oscal", ["tool.oscal"]],
  ["fedramp-2026-rules", ["framework.fedramp"]],
  ["nist-800-37-rev2", ["framework.rmf"]],
  ["nist-sp-800-137", ["topic.continuous-monitoring"]],
  ["disa-stig-library", ["program.stig"]],
  ["disa-cci-list", ["program.stig"]],
  ["disa-ppsm-training", ["organization.disa"]],
  ["dod-ppsm-policy", ["organization.dod"]],
  ["dcsa-hardware-list", ["organization.dcsa"]],
  ["dcsa-software-list", ["organization.dcsa"]],
]);

const TEMPLATE_ARTIFACT_MAP = new Map([
  ["tpl-ssp-starter", "artifact.ssp"],
  ["tpl-poam", "artifact.poam"],
  ["tpl-assess-plan", "artifact.sap"],
  ["tpl-evid-exp", "artifact.sar"],
]);

const PROPAGATION_RELATIONSHIPS = registry.relationships
  .filter((r) => r.propagate_for_discovery && r.validation_state === "approved");

const VENDOR_PREFIXES = [
  ["Microsoft", "vendor.microsoft"],
  ["Cisco", "vendor.cisco"],
  ["VMware", "vendor.vmware"],
  ["Red Hat", "vendor.red-hat"],
  ["Oracle", "vendor.oracle"],
  ["IBM", "vendor.ibm"],
  ["Amazon", "vendor.amazon"],
  ["Google", "vendor.google"],
  ["Apple", "vendor.apple"],
  ["Juniper", "vendor.juniper"],
];

const PUBLISHER_DOMAIN_BY_FAMILY = new Map([
  ["Access Control", "domain.access-control"],
  ["Assessment, Authorization, and Monitoring", "domain.assessment-authorization-monitoring"],
  ["Audit and Accountability", "domain.audit-accountability"],
  ["Awareness and Training", "domain.awareness-training"],
  ["Configuration Management", "domain.configuration-management"],
  ["Contingency Planning", "domain.contingency-planning"],
  ["Identification and Authentication", "domain.identification-authentication"],
  ["Incident Response", "domain.incident-response"],
  ["Incident response", "domain.incident-response"],
  ["Maintenance", "domain.maintenance"],
  ["Media Protection", "domain.media-protection"],
  ["Personally Identifiable Information Processing and Transparency", "domain.pii-processing-transparency"],
  ["Personnel Security", "domain.personnel-security"],
  ["Physical and Environmental Protection", "domain.physical-security"],
  ["Physical Protection", "domain.physical-security"],
  ["Planning", "domain.planning"],
  ["Program Management", "domain.program-management"],
  ["Risk Assessment", "domain.risk-assessment"],
  ["Security Assessment", "domain.security-assessment"],
  ["Security Assessment and Monitoring", "domain.security-assessment-monitoring"],
  ["Supply Chain Risk Management", "domain.supply-chain-risk-management"],
  ["System and Communications Protection", "domain.system-communications-protection"],
  ["System and Information Integrity", "domain.system-information-integrity"],
  ["System and Services Acquisition", "domain.system-services-acquisition"],
]);

const PUBLISHER_DOMAIN_BY_RELATED_CATEGORY = new Map([
  ["AC|Access Control", "domain.access-control"],
  ["AT|Awareness and Training", "domain.awareness-training"],
  ["AU|Audit and Accountability", "domain.audit-accountability"],
  ["CA|Assessment, Authorization, and Monitoring", "domain.assessment-authorization-monitoring"],
  ["CM|Configuration Management", "domain.configuration-management"],
  ["CP|Contingency Planning", "domain.contingency-planning"],
  ["IA|Identification and Authentication", "domain.identification-authentication"],
  ["IR|Incident Response", "domain.incident-response"],
  ["MA|Maintenance", "domain.maintenance"],
  ["MP|Media Protection", "domain.media-protection"],
  ["PE|Physical and Environmental Protection", "domain.physical-security"],
  ["PL|Planning", "domain.planning"],
  ["PM|Program Management", "domain.program-management"],
  ["PS|Personnel Security", "domain.personnel-security"],
  ["PT|Personally Identifiable Information Processing and Transparency", "domain.pii-processing-transparency"],
  ["RA|Risk Assessment", "domain.risk-assessment"],
  ["SA|System and Services Acquisition", "domain.system-services-acquisition"],
  ["SC|System and Communications Protection", "domain.system-communications-protection"],
  ["SI|System and Information Integrity", "domain.system-information-integrity"],
  ["SR|Supply Chain Risk Management", "domain.supply-chain-risk-management"],
]);

function normalized(value) {
  return String(value || "").trim();
}

function add(tags, id, sourceField, rule, provenance = "inferred") {
  const definition = TAXONOMY_TAG_BY_ID.get(id);
  if (!definition || tags.some((tag) => tag.id === id)) return;
  tags.push({
    id,
    kind: definition.dimension,
    label: definition.label,
    provenance,
    basis: { source_field: sourceField, rule },
  });
}

function includes(title, expression) {
  return expression.test(title);
}

/**
 * Derive only facets explicitly named by a structured publisher field or a
 * catalog's declared scope. Free-form descriptions, checks, fixes, and titles
 * of individual controls are intentionally excluded: a mention is not proof
 * of applicability.
 */
export function taxonomyTagsForRecord(record) {
  const tags = [];
  const benchmarkTitle = normalized(record.metadata?.benchmark_title);
  const identityCategory = normalized(record.metadata?.identity_category);
  const family = normalized(record.family);
  const catalogId = normalized(record.catalog_id || record.metadata?.catalog_id);
  const scope = `${benchmarkTitle} ${identityCategory} ${family}`.trim();

  if (scope) {
    if (includes(scope, /\b(?:server|domain controller)\b/i)) add(tags, "asset.server", "metadata.benchmark_title", "explicit-server-term");
    if (includes(scope, /\b(?:workstation|windows (?:10|11)|macos)\b/i)) add(tags, "asset.workstation", "metadata.benchmark_title", "explicit-workstation-platform-term");
    if (includes(scope, /\b(?:database|dbms|postgres(?:ql)?|mysql|mariadb|sql server)\b/i)) add(tags, "asset.database", "metadata.identity_category", "explicit-database-term");
    if (includes(scope, /\b(?:router|switch|firewall|network (?:device|element)|network infrastructure)\b/i)) add(tags, "asset.network-device", "metadata.identity_category", "explicit-network-device-term");
    if (includes(scope, /\b(?:application|web server|browser|agent)\b/i)) add(tags, "asset.application", "metadata.identity_category", "explicit-application-term");
    if (includes(scope, /\b(?:container|kubernetes|openshift)\b/i)) add(tags, "asset.container", "metadata.identity_category", "explicit-container-term");
    if (includes(scope, /\b(?:virtualization|virtual machine|hypervisor|vsphere|esxi)\b/i)) add(tags, "asset.virtualization", "metadata.identity_category", "explicit-virtualization-term");
    if (includes(scope, /\b(?:active directory|identity|directory service|pki)\b/i)) add(tags, "asset.identity-system", "metadata.identity_category", "explicit-identity-term");
    if (includes(scope, /\b(?:mobile|uem|mdm|android|ios)\b/i)) add(tags, "asset.mobile", "metadata.identity_category", "explicit-mobile-term");
    if (includes(scope, /\b(?:cloud|azure|aws|iaas|saas)\b/i)) add(tags, "environment.cloud", "metadata.benchmark_title", "explicit-cloud-term");
    if (includes(scope, /\b(?:windows|linux|macos|android|ios)\b/i)) add(tags, "technology.operating-system", "metadata.benchmark_title", "explicit-operating-system-term");
    if (includes(scope, /\bactive directory\b/i)) add(tags, "technology.active-directory", "metadata.benchmark_title", "explicit-active-directory-term");
    if (includes(scope, /\bandroid\b/i)) add(tags, "technology.android", "metadata.benchmark_title", "explicit-android-term");
    if (includes(scope, /\b(?:apple )?ios\b/i)) add(tags, "technology.ios", "metadata.benchmark_title", "explicit-ios-term");
    if (includes(scope, /\bmicrosoft windows\b/i)) add(tags, "product.microsoft-windows", "metadata.benchmark_title", "explicit-product-title");
    if (includes(scope, /\bred hat enterprise linux\b/i)) add(tags, "product.red-hat-enterprise-linux", "metadata.benchmark_title", "explicit-product-title");
    if (includes(scope, /\b(?:vmware )?(?:vsphere|esxi)\b/i)) add(tags, "product.vmware-vsphere", "metadata.benchmark_title", "explicit-product-title");
    for (const [prefix, id] of VENDOR_PREFIXES) {
      if (new RegExp(`^${prefix.replace(/ /g, "\\s+")}\\b`, "i").test(benchmarkTitle)) {
        add(tags, id, "metadata.benchmark_title", "explicit-publisher-title-prefix");
      }
    }
  }

  if (family === "Physical and Environmental Protection" || family === "Physical Protection") {
    add(tags, "asset.physical-security", "family", "exact-publisher-family", "publisher");
  }
  const publisherDomainId = PUBLISHER_DOMAIN_BY_FAMILY.get(family);
  if (publisherDomainId) add(tags, publisherDomainId, "family", "exact-publisher-family", "publisher");
  for (const category of record.related_categories || record.metadata?.related_categories || []) {
    if (category?.provenance !== "referenced") continue;
    const relatedDomainId = PUBLISHER_DOMAIN_BY_RELATED_CATEGORY.get(
      `${normalized(category.code)}|${normalized(category.label)}`,
    );
    if (relatedDomainId) {
      add(
        tags,
        relatedDomainId,
        "metadata.related_categories[]",
        "exact-publisher-related-category",
        "publisher",
      );
    }
  }
  if (catalogId === "nist-iot-cybersecurity") add(tags, "asset.iot", "catalog_id", "publisher-catalog-scope", "publisher");
  if (catalogId === "nist-mobile-threats") add(tags, "asset.mobile", "catalog_id", "publisher-catalog-scope", "publisher");

  if (catalogId) {
    for (const [prefix, tagId] of CATALOG_ORGANIZATION_PREFIXES) {
      if (catalogId.startsWith(prefix)) {
        add(tags, tagId, "catalog_id", "catalog-publisher-organization");
        break;
      }
    }
    for (const [pattern, tagId] of CATALOG_FRAMEWORK_RULES) {
      if (pattern.test(catalogId)) {
        add(tags, tagId, "catalog_id", "catalog-framework-scope");
      }
    }
    for (const [pattern, tagId] of CATALOG_PROGRAM_RULES) {
      if (pattern.test(catalogId)) {
        add(tags, tagId, "catalog_id", "catalog-program-scope");
      }
    }
  }
  if (benchmarkTitle) {
    if (/\bSTIG\b/.test(benchmarkTitle)) {
      add(tags, "program.stig", "metadata.benchmark_title", "explicit-stig-title");
    }
  }
  return tags;
}

/**
 * Resources have a different source contract than publication records. Their
 * structured technology scope and compatibility fields are reviewed resource
 * metadata; a resource's description, name, publisher, and keywords are not
 * used to claim that it applies to an asset or product.
 */
export function taxonomyTagsForResource(resource) {
  const tags = [];
  const scopes = new Set(
    (resource.technologyScopes || [])
      .map((value) => normalized(value).toLocaleLowerCase()),
  );
  const operatingSystems = new Set(
    (resource.compatibility?.operatingSystems || [])
      .map((value) => normalized(value).toLocaleLowerCase()),
  );

  const hasScope = (...values) => values.some((value) => scopes.has(value));
  const hasOperatingSystem = (...values) =>
    values.some((value) => operatingSystems.has(value));

  if (hasScope("windows", "linux") || hasOperatingSystem("windows", "linux")) {
    add(
      tags,
      "technology.operating-system",
      hasOperatingSystem("windows", "linux")
        ? "compatibility.operatingSystems"
        : "technologyScopes",
      "exact-structured-operating-system-value",
      "atlas_evidence",
    );
  }
  if (hasScope("windows") || hasOperatingSystem("windows")) {
    add(
      tags,
      "product.microsoft-windows",
      hasOperatingSystem("windows")
        ? "compatibility.operatingSystems"
        : "technologyScopes",
      "exact-structured-windows-value",
      "atlas_evidence",
    );
  }
  if (hasScope("kubernetes")) {
    add(tags, "asset.container", "technologyScopes", "exact-structured-kubernetes-value", "atlas_evidence");
  }
  if (hasScope("cloud authorization", "cloud native")) {
    add(tags, "environment.cloud", "technologyScopes", "exact-structured-cloud-value", "atlas_evidence");
  }
  if (hasScope("microsoft 365")) {
    add(tags, "asset.application", "technologyScopes", "exact-structured-application-value", "atlas_evidence");
  }

  const publisher = normalized(resource.publisher);
  if (publisher) {
    for (const [pattern, tagId] of PUBLISHER_ORGANIZATION_PATTERNS) {
      if (pattern.test(publisher)) {
        add(tags, tagId, "publisher", "publisher-organization-match", "atlas_evidence");
        break;
      }
    }
  }
  for (const fw of resource.frameworks || []) {
    const tagId = RESOURCE_FRAMEWORK_MAP.get(fw);
    if (tagId) add(tags, tagId, "frameworks", "exact-structured-framework-value", "atlas_evidence");
  }
  for (const prog of resource.programs || []) {
    const progTag = RESOURCE_PROGRAM_MAP.get(prog);
    if (progTag) add(tags, progTag, "programs", "exact-structured-program-value", "atlas_evidence");
    const topicTag = RESOURCE_TOPIC_MAP.get(prog);
    if (topicTag) add(tags, topicTag, "programs", "exact-structured-topic-value", "atlas_evidence");
  }
  const toolScope = `${normalized(resource.id)} ${normalized(resource.shortName)}`.toLocaleLowerCase();
  if (toolScope.trim()) {
    for (const [pattern, tagId] of RESOURCE_TOOL_PATTERNS) {
      if (pattern.test(toolScope)) {
        add(tags, tagId, "id", "exact-structured-tool-identity", "atlas_evidence");
      }
    }
  }

  return tags;
}

export function taxonomyTagsForTemplate(template) {
  const tags = [];
  for (const ref of template.source_refs || []) {
    const tagIds = SOURCE_REF_TAG_MAP.get(ref);
    if (tagIds) {
      for (const tagId of tagIds) {
        add(tags, tagId, "source_refs", "approved-source-reference", "atlas_evidence");
      }
    }
  }
  const artifactTagId = TEMPLATE_ARTIFACT_MAP.get(template.template_id);
  if (artifactTagId) {
    add(tags, artifactTagId, "template_id", "template-artifact-classification", "atlas_evidence");
  }
  return tags;
}

export function deriveTags(directTags) {
  const directIds = new Set(directTags.map((t) => t.id));
  const derived = [];
  for (const tag of directTags) {
    for (const rel of PROPAGATION_RELATIONSHIPS) {
      if (rel.from !== tag.id) continue;
      if (directIds.has(rel.to) || derived.some((d) => d.id === rel.to)) continue;
      const definition = TAXONOMY_TAG_BY_ID.get(rel.to);
      if (!definition) continue;
      derived.push({
        id: rel.to,
        kind: definition.dimension,
        label: definition.label,
        provenance: "inferred",
        basis: {
          source_field: "taxonomy-relationship",
          rule: `derived-${rel.relationship}`,
        },
        assignment: "derived",
        origin_tag_id: tag.id,
        relationship_type: rel.relationship,
      });
    }
  }
  return derived;
}
