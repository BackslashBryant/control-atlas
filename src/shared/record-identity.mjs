export function benchmarkIdentityCategory(benchmarkTitle = "", benchmarkId = "") {
  const title = String(benchmarkTitle).trim();
  const parenthetical = title.match(/\(([A-Z][A-Z0-9&/-]{1,12})\)/);
  if (parenthetical) return parenthetical[1];
  const leadingAcronym = title.match(/^([A-Z][A-Z0-9&/-]{1,12})(?:\s|$)/);
  if (leadingAcronym) return leadingAcronym[1];
  const conciseTitle = title
    .replace(/\s+Security Technical Implementation Guide$/i, "")
    .replace(/\s+Security Requirements Guide$/i, "")
    .trim();
  if (conciseTitle) return conciseTitle;
  return String(benchmarkId)
    .replace(/_(?:STIG|SRG)$/i, "")
    .replaceAll("_", " ")
    .trim();
}

export function sourceNativeIdentityCategory({ catalogId = "", family = "", benchmarkTitle = "", benchmarkId = "" } = {}) {
  return ["disa-stig", "disa-srg"].includes(catalogId)
    ? benchmarkIdentityCategory(benchmarkTitle, benchmarkId) || family
    : family;
}
