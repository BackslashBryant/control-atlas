const PROVENANCE_MAP: Record<string, { label: string; cssClass: string }> = {
  official: { label: "Official", cssClass: "ca-badge--official" },
  mandated: { label: "Official", cssClass: "ca-badge--official" },
  federal_published: { label: "Federal", cssClass: "ca-badge--official" },
  dod_published: { label: "DoD", cssClass: "ca-badge--dod" },
  nist_published: { label: "NIST", cssClass: "ca-badge--nist" },
  disa_published: { label: "DISA", cssClass: "ca-badge--disa" },
  fedramp_published: { label: "FedRAMP", cssClass: "ca-badge--fedramp" },
  federal_program: { label: "FedRAMP", cssClass: "ca-badge--fedramp" },
  mitre_published: { label: "MITRE", cssClass: "ca-badge--mitre" },
  community_open_source: { label: "Community", cssClass: "ca-badge--community" },
  federal_referenced: { label: "Community", cssClass: "ca-badge--community" },
  control_atlas_derived: { label: "Atlas Built", cssClass: "ca-badge--active" },
  inferred: { label: "Inferred", cssClass: "ca-badge--inferred" },
  deprecated: { label: "Deprecated", cssClass: "ca-badge--deprecated" },
  active: { label: "Active", cssClass: "ca-badge--active" },
};

export function ProvenanceBadge({
  provenanceClass,
  className = "",
}: {
  provenanceClass: string;
  className?: string;
}) {
  const entry =
    PROVENANCE_MAP[provenanceClass] ??
    ({ label: provenanceClass || "Unknown", cssClass: "ca-badge--community" } as const);

  return (
    <span className={`ca-badge ${entry.cssClass} ${className}`.trim()}>
      {entry.label}
    </span>
  );
}
