import {
  IconBox,
  IconBuildingBank,
  IconBuildingStore,
  IconCloud,
  IconCpu,
  IconFileText,
  IconFlag,
  IconHash,
  IconServer,
  IconShieldLock,
  IconSitemap,
  IconTool,
} from "@tabler/icons-react";

import { TAXONOMY_CONTRACT } from "../../shared/taxonomy-contract.mjs";

/**
 * A neutral Control Atlas mark for what kind of thing a tag names.
 *
 * These are deliberately not publisher marks. A federal seal on a tag implies
 * endorsement the taxonomy contract explicitly disclaims, and the monogram
 * fallback that preceded this simply repeated the tag's own label. A dimension
 * glyph carries the one fact the label cannot: whether "DISA" is an agency and
 * "eMASS" is a system.
 */
const DIMENSION_GLYPHS = {
  asset_class: IconServer,
  environment: IconCloud,
  technology: IconCpu,
  vendor_brand: IconBuildingStore,
  product: IconBox,
  domain: IconShieldLock,
  organization: IconBuildingBank,
  tool: IconTool,
  framework: IconSitemap,
  program: IconFlag,
  artifact: IconFileText,
  topic: IconHash,
} as const;

export type TaxonomyDimension = keyof typeof DIMENSION_GLYPHS;

/** Every governed dimension resolves to a glyph, or the build has drifted. */
export const GLYPHED_DIMENSIONS: ReadonlySet<string> = new Set(
  Object.keys(DIMENSION_GLYPHS),
);

export function dimensionLabel(dimension: string): string {
  return (
    TAXONOMY_CONTRACT.dimensions.find((entry: { id: string }) => entry.id === dimension)
      ?.label || dimension.replace(/_/g, " ")
  );
}

export function DimensionGlyph(props: {
  dimension: string;
  size?: number;
  /** Decorative beside a visible label; named when the glyph stands alone. */
  decorative?: boolean;
}) {
  const Glyph = DIMENSION_GLYPHS[props.dimension as TaxonomyDimension];
  if (!Glyph) return null;

  const isDecorative = props.decorative !== false;
  const size = props.size ?? 14;

  return (
    <Glyph
      aria-hidden={isDecorative || undefined}
      aria-label={isDecorative ? undefined : dimensionLabel(props.dimension)}
      className="dimension-glyph"
      role={isDecorative ? undefined : "img"}
      size={size}
      stroke={1.6}
    />
  );
}
