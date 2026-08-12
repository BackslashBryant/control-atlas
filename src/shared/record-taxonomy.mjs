const VENDOR_PREFIXES = [
  ["Microsoft", "Microsoft"],
  ["Cisco", "Cisco"],
  ["VMware", "VMware"],
  ["Red Hat", "Red Hat"],
  ["Oracle", "Oracle"],
  ["IBM", "IBM"],
  ["Amazon", "Amazon"],
  ["Google", "Google"],
  ["Apple", "Apple"],
  ["Juniper", "Juniper"],
];

function normalized(value) {
  return String(value || "").trim();
}

function add(tags, kind, value, sourceField, rule) {
  const id = `${kind}:${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  if (tags.some((tag) => tag.id === id)) return;
  tags.push({ id, kind, label: value, provenance: "inferred", basis: { source_field: sourceField, rule } });
}

/**
 * Derive only broad taxonomy facets explicitly named by an authoritative record
 * field. This deliberately does not classify free-form rule text: a mention in
 * a control discussion is not evidence that the record applies to that asset.
 */
export function taxonomyTagsForRecord(record) {
  const tags = [];
  const benchmarkTitle = normalized(record.metadata?.benchmark_title);
  const family = normalized(record.family);

  if (benchmarkTitle) {
    if (/\b(?:server|domain controller)\b/i.test(benchmarkTitle)) add(tags, "asset_class", "Server", "metadata.benchmark_title", "explicit-server-term");
    if (/\b(?:workstation|windows (?:10|11)|macos)\b/i.test(benchmarkTitle)) add(tags, "asset_class", "Workstation", "metadata.benchmark_title", "explicit-workstation-platform-term");
    if (/\b(?:cloud|azure|aws|iaas|saas)\b/i.test(benchmarkTitle)) add(tags, "environment", "Cloud", "metadata.benchmark_title", "explicit-cloud-term");
    if (/\bactive directory\b/i.test(benchmarkTitle)) add(tags, "domain", "Active Directory", "metadata.benchmark_title", "explicit-active-directory-term");
    for (const [prefix, vendor] of VENDOR_PREFIXES) {
      if (new RegExp(`^${prefix.replace(/ /g, "\\s+")}\\b`, "i").test(benchmarkTitle)) {
        add(tags, "vendor_brand", vendor, "metadata.benchmark_title", "explicit-publisher-title-prefix");
      }
    }
  }
  if (family === "Physical and Environmental Protection") {
    add(tags, "domain", "Physical Security", "family", "exact-publisher-family");
  }
  return tags;
}
