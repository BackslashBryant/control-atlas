export function catalogMandateLabel(value?: string): string {
  if (value === "statutory") return "Statutory";
  if (value === "contractual") return "Contractual";
  if (value === "federal_policy_or_regulatory_mandate") {
    return "Federal policy or regulation";
  }
  if (value === "issued_without_federal_mandate") {
    return "Issued without a federal mandate";
  }
  return "Mandate not classified";
}
