import treeSpine from "../../../data/curated/tree-spine.json";

const AREA_TOKEN_BY_ID = {
  "atlas:LIMB-GOVERNANCE": "--ca-area-governance",
  "atlas:LIMB-RISK": "--ca-area-risk",
  "atlas:LIMB-COMPLIANCE": "--ca-area-compliance",
  "atlas:LIMB-ARCHITECTURE": "--ca-area-architecture",
  "atlas:LIMB-IMPLEMENTATION": "--ca-area-implementation",
  "atlas:LIMB-ASSESSMENT": "--ca-area-assessment",
  "atlas:LIMB-OPERATIONS": "--ca-area-operations",
  "atlas:LIMB-THREAT": "--ca-area-threats-defense",
  "atlas:LIMB-KNOWLEDGE": "--ca-area-knowledge",
} as const;

export type AreaId = keyof typeof AREA_TOKEN_BY_ID;

export type AreaPresentation = {
  id: AreaId;
  label: string;
  slug: string;
  token: (typeof AREA_TOKEN_BY_ID)[AreaId];
};

function slugFor(id: AreaId) {
  return AREA_TOKEN_BY_ID[id].replace("--ca-area-", "");
}

function isAreaId(value: string): value is AreaId {
  return value in AREA_TOKEN_BY_ID;
}

export const AREA_PRESENTATIONS = Object.freeze(
  treeSpine.limbs.map((limb) => {
    if (!isAreaId(limb.id)) {
      throw new Error(`Missing visual-language token for Atlas area ${limb.id}.`);
    }
    return Object.freeze({
      id: limb.id,
      label: limb.label,
      slug: slugFor(limb.id),
      token: AREA_TOKEN_BY_ID[limb.id],
    });
  }),
) as readonly AreaPresentation[];

if (AREA_PRESENTATIONS.length !== Object.keys(AREA_TOKEN_BY_ID).length) {
  throw new Error("Atlas area visual language must cover exactly the canonical spine areas.");
}

export const AREA_IDS = Object.freeze(
  AREA_PRESENTATIONS.map((area) => area.id),
) as readonly AreaId[];

export const AUTHORITY_PRESENTATION = Object.freeze({
  id: "atlas:AUTHORITY",
  label: "Authority",
  slug: "authority",
  token: "--ca-area-authority",
} as const);

function normalized(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

const AREA_BY_NAME = new Map<string, AreaPresentation>();
for (const area of AREA_PRESENTATIONS) {
  AREA_BY_NAME.set(normalized(area.id), area);
  AREA_BY_NAME.set(normalized(area.label), area);
  AREA_BY_NAME.set(normalized(area.slug), area);
}

const CATALOG_AREA_IDS = Object.freeze({
  ...(treeSpine.catalogLimbs as Record<string, AreaId>),
  ...Object.fromEntries(
    treeSpine.syntheticCatalogs.map((catalog) => [catalog.catalog_id, catalog.limb]),
  ),
}) as Readonly<Record<string, AreaId>>;

export function areaPresentationFor(value?: string | null) {
  return value ? AREA_BY_NAME.get(normalized(value)) || null : null;
}

export function areaPresentationForCatalog(catalogId: string) {
  return areaPresentationFor(CATALOG_AREA_IDS[catalogId]);
}

export function areaCssVariables(area: AreaPresentation | typeof AUTHORITY_PRESENTATION) {
  return {
    "--ca-area-color": `var(${area.token})`,
    "--ca-area-color-on-light": `var(${area.token}-on-light)`,
    "--ca-area-color-on-dark": `var(${area.token}-on-dark)`,
  } as const;
}
