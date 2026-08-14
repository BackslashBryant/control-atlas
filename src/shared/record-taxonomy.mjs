import { TAXONOMY_TAG_BY_ID } from "./taxonomy-contract.mjs";

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

  return tags;
}
