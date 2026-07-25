/**
 * Derived presentation facts for Commons resources (no schema migration).
 *
 * Two jobs, both pure so they can be unit-tested against the real dataset:
 *
 * 1. Host identity — which organization is on the other end of a link, derived
 *    from `canonicalUrl`. Callers turn the returned `kind` into a bundled inline
 *    glyph. Nothing here reaches the network: remote favicons are blocked by the
 *    site's CSP and would break offline use.
 * 2. Kind grouping — collapses the 12 real `resourceType` values into a handful
 *    of plain-English sections, so a browsing newcomer sees "rules", "templates",
 *    "communities" instead of one undifferentiated wall of cards.
 */

/** Brand marks we ship a real logo for. Everything else gets a text monogram. */
const BRAND_HOSTS = {
  "github.com": "github",
  "gist.github.com": "github",
  "raw.githubusercontent.com": "github",
  "reddit.com": "reddit",
  "old.reddit.com": "reddit",
  "slack.com": "slack",
  "amazon.com": "aws",
  "microsoft.com": "microsoft",
};

/**
 * Publishing organization per registrable domain. Each entry is checkable from
 * the hostname itself — no guessing. Hosts absent from this map fall back to a
 * generic glyph plus the hostname, which is honest rather than approximate.
 */
const ORG_MONOGRAMS = {
  "nist.gov": "NIST",
  "cisa.gov": "CISA",
  "fedramp.gov": "FedRAMP",
  "cyber.mil": "DoD",
  "whs.mil": "DoD",
  "dso.mil": "DoD",
  "defense.gov": "DoD",
  "cnss.gov": "CNSS",
  "nsa.gov": "NSA",
  "dhs.gov": "DHS",
  "gao.gov": "GAO",
  "whitehouse.gov": "WH",
  "ecfr.gov": "eCFR",
  "govinfo.gov": "GPO",
  "archives.gov": "NARA",
  "acquisition.gov": "GSA",
  "cisecurity.org": "CIS",
  "mitre.org": "MITRE",
  "sans.org": "SANS",
  "niap-ccevs.org": "NIAP",
};

/** Strip `www.` so `www.reddit.com` and `reddit.com` read as one host. */
export function resourceHost(canonicalUrl) {
  if (!canonicalUrl) return "";
  try {
    return new URL(canonicalUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Last two labels of a hostname: `csrc.nist.gov` -> `nist.gov`. */
function registrableDomain(host) {
  const labels = host.split(".");
  return labels.length <= 2 ? host : labels.slice(-2).join(".");
}

/**
 * @returns {{ host: string, kind: string, label: string }}
 *   `kind` is `"github" | "reddit" | "slack" | "aws" | "microsoft" | "monogram"
 *   | "generic"`. `label` is the monogram text when `kind === "monogram"`,
 *   otherwise the host (empty when the URL will not parse).
 */
export function hostIdentity(canonicalUrl) {
  const host = resourceHost(canonicalUrl);
  if (!host) return { host: "", kind: "generic", label: "" };

  const domain = registrableDomain(host);
  const brand = BRAND_HOSTS[host] ?? BRAND_HOSTS[domain];
  if (brand) return { host, kind: brand, label: host };

  const monogram = ORG_MONOGRAMS[domain];
  if (monogram) return { host, kind: "monogram", label: monogram };

  return { host, kind: "generic", label: host };
}

/**
 * Ordered browse sections. The order walks the work: understand what is
 * required, get the actual lists, produce the document, automate it, ask
 * people, then look up what was superseded.
 */
export const COMMONS_GROUPS = [
  {
    id: "rules",
    label: "Rules and policy",
    blurb: "What the government requires, published by the office that requires it.",
    types: ["policy", "instruction"],
  },
  {
    id: "catalogs",
    label: "Catalogs and data",
    blurb: "The actual lists of controls and mappings, including machine-readable feeds.",
    types: ["catalog", "dataset", "matrix", "specification"],
  },
  {
    id: "templates",
    label: "Templates and starters",
    blurb: "Documents you fill in, so you do not start from a blank page.",
    types: ["template"],
  },
  {
    id: "tools",
    label: "Tools and automation",
    blurb: "Software that scans, checks, or generates the work for you.",
    types: ["tool"],
  },
  {
    id: "community",
    label: "Communities and training",
    blurb: "Where to ask people who have done this before, and courses to learn it.",
    types: ["community_forum", "training"],
  },
  {
    id: "reference",
    label: "Reference and history",
    blurb: "Explanations, plus superseded documents kept for the record.",
    types: ["documentation", "historical_reference"],
  },
];

const OTHER_GROUP = {
  id: "other",
  label: "Other resources",
  blurb: "Everything that does not fit the sections above.",
};

/**
 * Group resources into `COMMONS_GROUPS` order, preserving the caller's ordering
 * inside each group. A `resourceType` with no group lands in "Other resources"
 * rather than disappearing — an unreachable resource is worse than an
 * unclassified one. Empty groups are omitted.
 *
 * @returns {Array<{ id: string, label: string, blurb: string, resources: any[] }>}
 */
export function groupResourcesByKind(resources) {
  const buckets = new Map();
  const groupOfType = new Map();
  for (const group of COMMONS_GROUPS) {
    buckets.set(group.id, []);
    for (const type of group.types) groupOfType.set(type, group.id);
  }
  buckets.set(OTHER_GROUP.id, []);

  for (const resource of resources) {
    const groupId = groupOfType.get(resource.resourceType) ?? OTHER_GROUP.id;
    buckets.get(groupId).push(resource);
  }

  return [...COMMONS_GROUPS, OTHER_GROUP]
    .map((group) => ({
      id: group.id,
      label: group.label,
      blurb: group.blurb,
      resources: buckets.get(group.id),
    }))
    .filter((group) => group.resources.length > 0);
}
