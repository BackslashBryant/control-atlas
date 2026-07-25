import type { CommonsResource } from "./commonsTypes";

export type CommonsHostKind =
  | "github"
  | "reddit"
  | "slack"
  | "aws"
  | "microsoft"
  | "monogram"
  | "generic";

export type CommonsHostIdentity = {
  host: string;
  kind: CommonsHostKind;
  label: string;
};

export type CommonsGroupDefinition = {
  id: string;
  label: string;
  blurb: string;
  types: string[];
};

export type CommonsResourceGroup = {
  id: string;
  label: string;
  blurb: string;
  resources: CommonsResource[];
};

export function resourceHost(canonicalUrl: string | null | undefined): string;

export function hostIdentity(
  canonicalUrl: string | null | undefined,
): CommonsHostIdentity;

export const COMMONS_GROUPS: CommonsGroupDefinition[];

export function groupResourcesByKind(
  resources: CommonsResource[],
): CommonsResourceGroup[];
