import type { CommonsCollection, CommonsResource } from "./commonsTypes";

export type PrimaryBrowseCategory = { id: string; label: string; blurb: string; count?: number };

export const PRIMARY_BROWSE_CATEGORIES: PrimaryBrowseCategory[];
export function primaryBrowseCategory(resource: CommonsResource): string;
export function primaryBrowseCategoryCounts(resources: CommonsResource[]): PrimaryBrowseCategory[];
export function filterDirectoryResources(
  resources: CommonsResource[],
  filters?: Record<string, string>,
  collections?: CommonsCollection[],
): CommonsResource[];
export function resourceSearchEvidence(resource: CommonsResource, query: string): string[];
export function searchDirectoryResources(resources: CommonsResource[], query: string): CommonsResource[];
