export type RecordTagKind = "area" | "asset_class" | "category" | "domain" | "environment" | "kind" | "publication" | "vendor_brand";
export type RecordTagProvenance = "publisher" | "referenced" | "inferred";

export type RecordTagModel = {
  id: string;
  kind: RecordTagKind;
  label: string;
  provenance: RecordTagProvenance;
  basis?: { source_field: string; rule: string };
};

export function recordTagsFor(input: {
  area?: string;
  category?: string;
  kind: string;
  publication: string;
  relatedCategories?: Array<{
    code?: string;
    label?: string;
    provenance?: "referenced" | "inferred";
  }>;
  taxonomyTags?: Array<{
    id?: string;
    kind?: RecordTagKind;
    label?: string;
    provenance?: RecordTagProvenance;
    basis?: { source_field: string; rule: string };
  }>;
}): RecordTagModel[] {
  const tags: RecordTagModel[] = [
    { id: `kind:${input.kind}`, kind: "kind", label: input.kind, provenance: "publisher" },
  ];
  if (input.category) tags.push({ id: `category:${input.category}`, kind: "category", label: input.category, provenance: "publisher" });
  for (const category of input.relatedCategories || []) {
    if (!category.label) continue;
    tags.push({
      id: `category:${category.code || category.label}`,
      kind: "category",
      label: category.label,
      provenance: category.provenance || "referenced",
    });
  }
  if (input.area) tags.push({ id: `area:${input.area}`, kind: "area", label: input.area, provenance: "inferred" });
  for (const tag of input.taxonomyTags || []) {
    if (!tag.id || !tag.kind || !tag.label || tags.some((existing) => existing.id === tag.id)) continue;
    tags.push({ id: tag.id, kind: tag.kind, label: tag.label, provenance: tag.provenance || "inferred", basis: tag.basis });
  }
  tags.push({ id: `publication:${input.publication}`, kind: "publication", label: input.publication, provenance: "publisher" });
  return tags;
}

export function tagProvenanceExplanation(provenance: RecordTagProvenance): string {
  if (provenance === "referenced") return "Referenced category.";
  if (provenance === "inferred") return "Inferred category.";
  return "";
}
