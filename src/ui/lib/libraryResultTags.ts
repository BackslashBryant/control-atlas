export type LibraryResultTaxonomyTag = {
  id: string;
  kind: string;
  label: string;
  provenance?: string;
  basis?: {
    source_field: string;
    rule: string;
  };
  [key: string]: unknown;
};

const DIMENSION_PRIORITY = [
  "domain",
  "asset_class",
  "program",
  "vendor_brand",
  "technology",
  "product",
  "organization",
] as const;

function comparisonKey(value: unknown): string {
  return String(value || "")
    .toLocaleLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function startsWithLabel(identity: string, label: string): boolean {
  return identity === label || identity.startsWith(`${label} `);
}

function isRedundantIdentityTag(input: {
  kind: string;
  label: string;
  publication: string;
  publisher: string;
  title: string;
}): boolean {
  const label = comparisonKey(input.label);
  if (!label) return true;

  const publisher = comparisonKey(input.publisher);
  const publication = comparisonKey(input.publication);
  const title = comparisonKey(input.title);
  if ([publisher, publication, title].includes(label)) return true;

  if (input.kind === "organization") {
    return publisher === label || [publication, title].some((value) => startsWithLabel(value, label));
  }
  if (input.kind === "vendor_brand") return publisher === label;
  if (input.kind === "program") {
    return [publication, title].some((value) => startsWithLabel(value, label));
  }
  return false;
}

export function selectLibraryResultTags<T extends LibraryResultTaxonomyTag>(input: {
  publication: string;
  publisher: string;
  taxonomyTags?: readonly T[];
  title: string;
}): T[] {
  const indexed = (input.taxonomyTags || [])
    .map((tag, index) => ({ index, tag }))
    .filter(({ tag }) => Boolean(tag?.id && tag?.kind && tag?.label));
  const selected: T[] = [];
  const selectedLabels = new Set<string>();

  for (const kind of DIMENSION_PRIORITY) {
    const candidates = indexed
      .filter(({ tag }) => tag.kind === kind)
      .sort((left, right) => {
        const provenance = Number(right.tag.provenance === "publisher") - Number(left.tag.provenance === "publisher");
        return provenance || left.index - right.index || left.tag.id.localeCompare(right.tag.id);
      });

    const choice = candidates.find(({ tag }) => {
      const label = comparisonKey(tag.label);
      return !selectedLabels.has(label) && !isRedundantIdentityTag({
        kind: tag.kind,
        label: tag.label,
        publication: input.publication,
        publisher: input.publisher,
        title: input.title,
      });
    });
    if (!choice) continue;

    selected.push(choice.tag);
    selectedLabels.add(comparisonKey(choice.tag.label));
    if (selected.length === 3) break;
  }

  return selected;
}
