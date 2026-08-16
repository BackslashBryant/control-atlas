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
  direct: "The official publisher's own source document.",
  derived: "Backed by a published mapping between sources.",
  inferred:
    "Worked out from public mappings. Review it before you rely on it.",
};

export const evidenceDescriptionMap = {
  primary: "This source directly backs it.",
  secondary: "This source backs it indirectly.",
};

export const provenanceDescriptionMap = {
  mandated:
    "A direct requirement from an official source.",
  federal_published:
    "Published by the federal source shown.",
  federal_program:
    "A baseline or overlay published for this program.",
  federal_utilized:
    "Used in federal work but not published by a federal agency.",
  federal_referenced:
    "Federal guidance cited for background.",
  third_party_published:
    "Published by the non-government organization shown.",
  mitre_published:
    "Published by MITRE in the official ATT&CK or D3FEND catalog.",
  inferred:
    "Worked out from public mappings. Review it before you rely on it.",
  deprecated:
    "Marked deprecated or superseded. Check before you rely on this link.",
};

export const confidenceDescriptionMap = {
  direct: "Directly backed by the cited source.",
  derived: "Backed by source data. You may want to check the context.",
  inferred: "Worked out from public data. Validate it before you act on it.",
};

export const publicationDescriptionMap = {
  published: "Published in the catalog shown.",
  candidate: "Candidate mapping that still needs review before you rely on it.",
};
