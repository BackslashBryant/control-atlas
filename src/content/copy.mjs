export const relationshipLabelMap = {
  includes: "Included in",
  maps_to: "Maps to",
  supports: "Supports",
  assesses: "Assessed by",
  related_to: "Related to",
};

export const trustLabelMap = {
  direct: "Official source",
  derived: "Published",
  inferred: "Inferred",
};

export const evidenceLabelMap = {
  primary: "Official source support",
  secondary: "Supporting reference",
};

export const trustDescriptionMap = {
  direct: "Direct source document from an official publisher.",
  derived: "Relationship supported by source data from a published mapping.",
  inferred:
    "Relationship derived from available public mappings and should be reviewed before use.",
};

export const evidenceDescriptionMap = {
  primary: "The source directly supports this connection.",
  secondary: "The source supports the connection indirectly.",
};

export const provenanceDescriptionMap = {
  mandated:
    "Direct requirement or mapping from an official authoritative source.",
  federal_published:
    "Published federal mapping or catalog entry from the named source.",
  federal_program:
    "Program-specific published baseline or overlay from an official source.",
  federal_referenced:
    "Referenced federal guidance used as supporting public context.",
  mitre_published:
    "Published MITRE ATT&CK or D3FEND mapping from the official catalog.",
  inferred:
    "Derived from available public mappings and should be reviewed before use.",
  deprecated:
    "Marked deprecated or superseded; verify before relying on this link.",
};

export const confidenceDescriptionMap = {
  direct: "High-confidence mapping directly supported by the cited source.",
  derived: "Supported by source data but may require contextual review.",
  inferred: "Inferred from public data and should be validated before action.",
};

export const publicationDescriptionMap = {
  published: "Published mapping from the named catalog.",
  candidate: "Candidate mapping that still needs review before you rely on it.",
};

export const productCopy = {
  tagline: "The public map for federal cyber compliance.",
  productDescription:
    "Control Atlas helps you find a requirement, see how it connects, and open the next useful record, comparison, playbook, template, or source.",
  homepageDescription:
    "Find a requirement, see its published connections, and open the next useful step.",
  exploreDescription:
    "Search controls, baselines, CCIs, STIGs, terms, templates, playbooks, and sources. Open a record to see what it means and how it connects.",
  atlasMapDescription:
    "Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect.",
};
