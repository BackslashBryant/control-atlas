/** @type {Array<[string, string, string[], string]>} */
const TAXONOMY_TAG_SEED = [
  ["asset.application", "Application", ["app"], "asset_class"],
  ["asset.container", "Container platform", ["containers", "kubernetes"], "asset_class"],
  ["asset.database", "Database", ["dbms", "db"], "asset_class"],
  ["asset.identity-system", "Identity system", ["identity", "directory service"], "asset_class"],
  ["asset.iot", "IoT", ["internet of things"], "asset_class"],
  ["asset.mobile", "Mobile", ["mobile device", "mobile endpoint"], "asset_class"],
  ["asset.network-device", "Network device", ["network element", "router", "switch", "firewall"], "asset_class"],
  ["asset.physical-security", "Physical security", ["physical", "environmental"], "asset_class"],
  ["asset.server", "Server", ["domain controller"], "asset_class"],
  ["asset.virtualization", "Virtualization", ["virtual machine", "hypervisor"], "asset_class"],
  ["asset.workstation", "Workstation", ["desktop", "endpoint"], "asset_class"],
  ["environment.cloud", "Cloud", ["aws", "azure", "saas", "iaas"], "environment"],
  ["technology.operating-system", "Operating system", ["os"], "technology"],
  ["technology.active-directory", "Active Directory", ["ad"], "technology"],
  ["technology.ios", "iOS", ["apple ios"], "technology"],
  ["technology.android", "Android", ["google android"], "technology"],
  ["vendor.amazon", "Amazon", ["aws"], "vendor_brand"],
  ["vendor.apple", "Apple", [], "vendor_brand"],
  ["vendor.cisco", "Cisco", [], "vendor_brand"],
  ["vendor.google", "Google", [], "vendor_brand"],
  ["vendor.ibm", "IBM", [], "vendor_brand"],
  ["vendor.juniper", "Juniper", [], "vendor_brand"],
  ["vendor.microsoft", "Microsoft", [], "vendor_brand"],
  ["vendor.oracle", "Oracle", [], "vendor_brand"],
  ["vendor.red-hat", "Red Hat", [], "vendor_brand"],
  ["vendor.vmware", "VMware", [], "vendor_brand"],
  ["product.microsoft-windows", "Microsoft Windows", ["windows"], "product"],
  ["product.red-hat-enterprise-linux", "Red Hat Enterprise Linux", ["rhel"], "product"],
  ["product.vmware-vsphere", "VMware vSphere", ["vsphere", "esxi"], "product"],
  ["domain.physical-security", "Physical Security", ["physical protection"], "domain"],
];

/**
 * Control Atlas taxonomy contract v1.
 *
 * This is a governed discovery vocabulary, not an entity extractor. A tag is
 * assigned only when its declared source field and rule are satisfied. The
 * publisher, Atlas evidence-backed, and editorial layers remain distinct.
 */
export const TAXONOMY_CONTRACT = {
  version: "1.0.0",
  owner: "Control Atlas data stewardship",
  review_date: "2026-11-12",
  supersession_rule: "A later version replaces this contract only through a reviewed migration with stable-ID reconciliation.",
  layers: {
    publisher: "Publisher-declared classifications and identifiers.",
    atlas_evidence: "Control Atlas facets supported by a declared source field and rule.",
    editorial: "Navigation concepts; never record applicability unless separately governed.",
  },
  dimensions: [
    { id: "asset_class", label: "Asset and system", entity_scope: ["record", "resource", "template", "playbook", "export"] },
    { id: "environment", label: "Environment", entity_scope: ["record", "resource", "template", "playbook", "export"] },
    { id: "technology", label: "Technology", entity_scope: ["record", "resource", "template", "playbook", "export"] },
    { id: "vendor_brand", label: "Vendor", entity_scope: ["record", "resource", "template", "playbook", "export"] },
    { id: "product", label: "Product", entity_scope: ["record", "resource", "template", "playbook", "export"] },
    { id: "domain", label: "Security domain", entity_scope: ["record", "resource", "template", "playbook", "export"] },
  ],
  tags: TAXONOMY_TAG_SEED.map(([id, label, aliases, dimension]) => ({
    id,
    label,
    aliases,
    parent_id: dimension,
    hierarchy: [dimension, id],
    dimension,
    entity_scope: ["record", "resource", "template", "playbook", "export"],
    applicability: "Requires an explicit publisher field or catalog classification named in source_basis; never infer from incidental prose.",
    source_basis: {
      record: ["metadata.benchmark_title", "metadata.identity_category", "family", "catalog_id"],
      resource: ["technologyScopes", "compatibility.operatingSystems"],
      template: [],
      playbook: [],
      export: ["from_taxonomy_tags", "to_taxonomy_tags"],
    },
    provenance: "atlas_evidence",
    confidence: "high",
    validation_state: "approved",
    owner: "Control Atlas data stewardship",
    review_date: "2026-11-12",
  })),
};

export const TAXONOMY_TAGS = TAXONOMY_CONTRACT.tags;
export const TAXONOMY_TAG_BY_ID = new Map(TAXONOMY_TAGS.map((tag) => [tag.id, tag]));

export function taxonomyTagMatchesQuery(tag, query) {
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!needle) return true;
  return [tag.id, tag.label, ...tag.aliases]
    .some((value) => value.toLocaleLowerCase().includes(needle));
}
