/** Derived UI categories for patterns and templates (no schema migration). */

export const PATTERN_CATEGORIES = {
  Authorization: [
    "rmf-lifecycle",
    "ato-vs-atc",
    "ato-vs-fedramp",
    "reciprocity-basics",
    "reciprocity-failures",
    "control-inheritance",
    "boundary-patterns",
  ],
  Cloud: [
    "shared-responsibility",
    "csp-inheritance",
    "enterprise-inheritance",
    "common-control-provider",
  ],
  Assessment: ["evidence-patterns", "poam-concepts"],
  Monitoring: ["conmon-cadence", "boe-reuse"],
};

export const TEMPLATE_CATEGORIES = {
  Authorization: [
    "security_plan_starter",
    "inheritance_worksheet",
    "reciprocity_checklist",
  ],
  Assessment: [
    "assessment_planning_worksheet",
    "stig_evidence_checklist",
    "implementation_statement_worksheet",
  ],
  Evidence: ["evidence_expectation_matrix", "poam_starter"],
  Monitoring: ["conmon_calendar"],
};

export function groupItemsByCategory(items, categoryMap, getId) {
  const grouped = new Map();
  const assigned = new Set();

  for (const [category, ids] of Object.entries(categoryMap)) {
    const matches = items.filter((item) => {
      const id = getId(item);
      if (ids.includes(id)) {
        assigned.add(id);
        return true;
      }
      return false;
    });
    if (matches.length) {
      grouped.set(category, matches);
    }
  }

  const other = items.filter((item) => !assigned.has(getId(item)));
  if (other.length) {
    grouped.set("Other", other);
  }

  return grouped;
}

export function filterByCategoryAndQuery(items, categoryMap, getId, getSearchText, filters) {
  const { category = "", query = "" } = filters;
  let filtered = items;

  if (category) {
    if (category === "Other") {
      const assigned = new Set(Object.values(categoryMap).flat());
      filtered = items.filter((item) => !assigned.has(getId(item)));
    } else {
      const ids = new Set(categoryMap[category] || []);
      filtered = items.filter((item) => ids.has(getId(item)));
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return filtered;
  }

  return filtered.filter((item) =>
    getSearchText(item).toLowerCase().includes(normalizedQuery),
  );
}
