import type { CommonsResource } from "./commonsTypes";

export type ResourceBrandAccent =
  | "neutral"
  | "federal"
  | "defense"
  | "platform"
  | "assurance"
  | "commercial"
  | "community"
  | "source"
  | "research";

export type ResourceBrandIdentity = {
  key: string;
  ownerLabel: string;
  accessibleName: string;
  markKind: "icon" | "monogram";
  iconKey: string;
  initials: string;
  accent: ResourceBrandAccent;
  parentEcosystem: string | null;
  variantKey?: string;
  source: "registry" | "fallback";
};

export type ResourceBrandDefinition = Omit<
  ResourceBrandIdentity,
  "source" | "variantKey"
> & {
  resourceIds: readonly string[];
  namePatterns: readonly string[];
  ownerPatterns: readonly string[];
  hosts: readonly string[];
};

export type BrandableResource = Partial<CommonsResource> & {
  brandKey?: string | null;
  cardPurpose?: string | null;
};

export const RESOURCE_BRAND_REGISTRY: Readonly<
  Record<string, ResourceBrandDefinition>
>;

export const RESOURCE_TYPE_FALLBACKS: Readonly<
  Record<string, ResourceBrandIdentity>
>;

export function resourceBrandIdentity(
  resource: BrandableResource,
): ResourceBrandIdentity;

export function resourceTypeLabel(resourceType: string | null | undefined): string;

export function resourceAccessLabel(resource: BrandableResource): string;
export function resourceFieldLabel(value: string | null | undefined): string;
