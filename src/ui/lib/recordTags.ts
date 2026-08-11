export type RecordTagKind = "area" | "category" | "kind" | "publication";
export type RecordTagProvenance = "publisher" | "referenced" | "inferred";

export type RecordTagModel = {
  id: string;
  kind: RecordTagKind;
  label: string;
  provenance: RecordTagProvenance;
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
  tags.push({ id: `publication:${input.publication}`, kind: "publication", label: input.publication, provenance: "publisher" });
  return tags;
}

export function tagProvenanceExplanation(provenance: RecordTagProvenance): string {
  if (provenance === "referenced") return "Referenced category.";
  if (provenance === "inferred") return "Inferred category.";
  return "";
}
