export const NIST_FAMILY_BY_CODE = Object.freeze({
  AC: "Access Control",
  AT: "Awareness and Training",
  AU: "Audit and Accountability",
  CA: "Assessment, Authorization, and Monitoring",
  CM: "Configuration Management",
  CP: "Contingency Planning",
  IA: "Identification and Authentication",
  IR: "Incident Response",
  MA: "Maintenance",
  MP: "Media Protection",
  PE: "Physical and Environmental Protection",
  PL: "Planning",
  PM: "Program Management",
  PS: "Personnel Security",
  PT: "Personally Identifiable Information Processing and Transparency",
  RA: "Risk Assessment",
  SA: "System and Services Acquisition",
  SC: "System and Communications Protection",
  SI: "System and Information Integrity",
  SR: "Supply Chain Risk Management",
});

const FAMILY_CODE_BY_LABEL = Object.freeze({
  ...Object.fromEntries(
    Object.entries(NIST_FAMILY_BY_CODE).map(([code, label]) => [label.toLocaleLowerCase(), code]),
  ),
  "physical protection": "PE",
  "security assessment": "CA",
  "security assessment and monitoring": "CA",
});

export function nistFamilyCode(label = "") {
  return FAMILY_CODE_BY_LABEL[String(label).trim().toLocaleLowerCase()] || "";
}

export function nistFamilyFromReferenceIndex(index = "") {
  const match = String(index).trim().match(/^([A-Z]{2,3})-/i);
  if (!match) return null;
  const code = match[1].toLocaleUpperCase();
  const label = NIST_FAMILY_BY_CODE[code];
  return label ? { code, label } : null;
}

export function referencedNistFamilies(references = []) {
  const families = new Map();
  for (const reference of references) {
    if (!/^NIST SP 800-53(?:A|\b)/i.test(String(reference?.title || ""))) continue;
    const family = nistFamilyFromReferenceIndex(reference?.index || "");
    if (family) families.set(family.code, family);
  }
  return [...families.values()].sort((left, right) => left.code.localeCompare(right.code));
}
