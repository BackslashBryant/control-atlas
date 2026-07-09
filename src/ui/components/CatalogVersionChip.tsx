type CatalogVersionChipProps = {
  label: string;
  version?: string | null;
};

export function CatalogVersionChip(props: CatalogVersionChipProps) {
  if (!props.version) {
    return null;
  }

  return (
    <span className="catalog-version-chip">
      {props.label} catalog version {props.version}
    </span>
  );
}
