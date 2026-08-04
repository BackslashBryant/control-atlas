import type { AppView } from "./viewState";
import {
  isKnownBuildDocument,
  isKnownBuildTask,
  isValidBuildFormat,
  isValidBuildSourceContext,
} from "./buildRouteState";

export type RouteIdentity = {
  path: string;
  label: string;
  title: string;
  contextLabel: string;
  analyticsName: string;
};

/**
 * The single user-facing name for every app state. Internal view keys remain
 * stable during the migration; they are never UI copy.
 */
const ROUTE_IDENTITIES: Record<AppView, RouteIdentity> = {
  home: { path: "/", label: "Home", title: "Home", contextLabel: "Home", analyticsName: "home" },
  "start-here": { path: "/start", label: "Start here", title: "Start here", contextLabel: "Start here", analyticsName: "start_here" },
  "atlas-map": { path: "/explore", label: "Atlas", title: "Atlas", contextLabel: "Atlas", analyticsName: "explore" },
  search: { path: "/search", label: "Library", title: "Library", contextLabel: "Search results", analyticsName: "search" },
  "catalog-detail": { path: "/catalog", label: "Library", title: "Library", contextLabel: "Library", analyticsName: "catalog" },
  "library-detail": { path: "/record", label: "Record", title: "Record", contextLabel: "Record", analyticsName: "record_detail" },
  matrix: { path: "/compare", label: "Compare", title: "Compare", contextLabel: "Compare", analyticsName: "compare" },
  patterns: { path: "/learn", label: "Guides", title: "Guides", contextLabel: "Guides", analyticsName: "learn" },
  templates: { path: "/build", label: "Documents", title: "Documents", contextLabel: "Documents", analyticsName: "build" },
  sources: { path: "/sources", label: "Sources", title: "Sources", contextLabel: "Sources", analyticsName: "sources" },
  commons: { path: "/resources", label: "Resources", title: "Resources", contextLabel: "Resources", analyticsName: "resources" },
  "commons-detail": { path: "/resources", label: "Resource", title: "Resource", contextLabel: "Resource", analyticsName: "resource_detail" },
  about: { path: "/about", label: "About", title: "About", contextLabel: "About", analyticsName: "about" },
  retired: { path: "/retired", label: "Retired identifier", title: "Retired identifier", contextLabel: "Retired identifier", analyticsName: "retired_identifier" },
  "not-found": { path: "/not-found", label: "Page not found", title: "Page not found", contextLabel: "Page not found", analyticsName: "not_found" },
};

const SELECTED_NAV_BY_VIEW: Record<AppView, AppView | null> = {
  home: null,
  "start-here": "start-here",
  "atlas-map": "atlas-map",
  // Search results are a state of Library, not a separate destination, so the
  // Library tab stays selected while a query is open.
  search: "catalog-detail",
  "catalog-detail": "catalog-detail",
  "library-detail": "catalog-detail",
  matrix: "matrix",
  patterns: "patterns",
  templates: "templates",
  sources: "sources",
  commons: "commons",
  "commons-detail": "commons",
  about: null,
  retired: "catalog-detail",
  "not-found": null,
};

const RECOVERY_VIEW_BY_VIEW: Record<AppView, AppView> = {
  home: "home",
  "start-here": "sources",
  "atlas-map": "atlas-map",
  search: "search",
  "catalog-detail": "catalog-detail",
  "library-detail": "catalog-detail",
  matrix: "matrix",
  patterns: "patterns",
  templates: "templates",
  sources: "sources",
  commons: "commons",
  "commons-detail": "commons",
  about: "about",
  retired: "catalog-detail",
  "not-found": "home",
};

export const CANONICAL_DESTINATION_VIEWS = Object.freeze([
  "home",
  "search",
  "atlas-map",
  "catalog-detail",
  "library-detail",
  "matrix",
  "patterns",
  "templates",
  "commons",
  "sources",
  "about",
] satisfies AppView[]);

export const CANONICAL_DESTINATIONS = Object.freeze(
  CANONICAL_DESTINATION_VIEWS.map((view) => ({
    view,
    ...ROUTE_IDENTITIES[view],
  })),
);

export function routeIdentityFor(view: AppView): RouteIdentity {
  return ROUTE_IDENTITIES[view];
}

export function selectedNavFor(view: AppView): AppView | null {
  return SELECTED_NAV_BY_VIEW[view];
}

export function recoveryViewFor(view: AppView): AppView {
  return RECOVERY_VIEW_BY_VIEW[view];
}

export type CanonicalRoute = {
  canonicalPath: string;
  requiresReplace: boolean;
  recoveryMessage: string;
};

const ATLAS_PARAMS = new Set([
  "node", "atlasAxis", "atlasLimb", "atlasFramework", "atlasBaseline", "atlasFamily",
  "atlasRmfStep", "relationshipView", "relationshipType", "provenance",
  "confidence", "type", "nodeType", "includeCandidates", "relationshipSearch",
  "atlasStage", "relationshipGroup", "sourceView", "showSupportingReferences",
  "showDraftOrLegacy", "showRegistryOnly",
]);
const SEARCH_PARAMS = new Set(["q", "filter", "objectType", "sourceClass", "controlFamily", "severity", "connectedOnly", "sort"]);
const CATALOG_PARAMS = new Set(["q", "family", "browseAll", "type", "area", "publisher", "lifecycle", "page"]);
const RESOURCE_PARAMS = new Set(["q", "lane", "framework", "lifecycle", "audience", "accessType", "resourceType", "category", "collection", "owner", "costType", "sort", "showAll"]);
const RESOURCE_FACET_VALUES: Readonly<Record<string, readonly string[]>> = {
  category: ["rules", "catalogs", "templates", "tools", "community", "reference"],
  collection: ["dod-cybersecurity-portals", "reciprocity-authorization-reuse", "implementation-assessment-tools", "product-assurance-approved-products", "cloud-devsecops-software-factories", "cmmc-defense-industrial-base", "cyber-workforce-training", "practitioner-communities"],
  lifecycle: ["Prepare", "Categorize", "Select", "Implement", "Assess", "Authorize", "Operate", "Monitor"],
  accessType: ["public", "free_account", "cac_required", "dod_network_required", "invitation_required", "access_varies"],
  costType: ["free", "no_cost", "varies"],
  resourceType: ["catalog", "community_forum", "dataset", "documentation", "ecosystem", "government_portal", "historical_reference", "instruction", "marketplace", "matrix", "product_directory", "restricted_service", "service_portal", "specification", "template", "tool", "training"],
  sort: ["relevance", "name", "checked"],
};
const DETAIL_PARAMS = new Set(["from", "returnTo", "relationshipView", "relationshipType", "provenance", "confidence", "nodeType", "includeCandidates", "relationshipSearch"]);
const START_PARAMS = new Set(["goal", "context"]);
const COMPARE_PARAMS = new Set(["crosswalk", "workbench", "source", "target", "items", "relationshipType", "provenance", "confidence", "includeCandidates", "chainCatalog", "chainBenchmark", "chainItem", "baselineA", "baselineB", "intent", "compareView", "mappingSource", "compareRun"]);
const LEARN_PARAMS = new Set(["pattern"]);
const BUILD_PARAMS = new Set(["templateType", "framework", "format", "environment", "baseline", "controlFamily", "category", "q"]);
const SOURCE_PARAMS = new Set(["q", "source", "provenance", "eligibility", "lifecycle", "access"]);
const RETIRED_PARAMS = new Set(["q"]);

function normalizedPath(input: string): { path: string; params: URLSearchParams } {
  const [rawPath, rawQuery = ""] = input.replace(/^#/, "").split("?", 2);
  const path = `/${rawPath.replace(/^\/+/, "")}`.replace(/\/+$/, "") || "/";
  return { path: path === "" ? "/" : path, params: new URLSearchParams(rawQuery) };
}

function permittedParams(params: URLSearchParams, permitted: Set<string>): { params: URLSearchParams; discarded: boolean } {
  const next = new URLSearchParams();
  let discarded = false;
  for (const [key, value] of params) {
    if (!permitted.has(key) || value.length > 240) {
      discarded = true;
      continue;
    }
    if (key === "relationshipView" && !["path", "map", "list", "purpose", "rmf"].includes(value)) {
      discarded = true;
      continue;
    }
    if (key === "sourceView" && !["purpose", "rmf"].includes(value)) {
      discarded = true;
      continue;
    }
    if (
      (key === "crosswalk" || key === "workbench") &&
      !["intent", "relationships", "stig-chain", "baseline-compare", "threat-chain"].includes(value)
    ) {
      discarded = true;
      continue;
    }
    if (
      ["browseAll", "showAll", "connectedOnly", "includeCandidates", "compareRun"].includes(key) &&
      value !== "true"
    ) {
      discarded = true;
      continue;
    }
    if (key === "sort" && !["relevance", "identifier", "title", "publication", "name", "checked"].includes(value)) {
      discarded = true;
      continue;
    }
    if (key === "page" && !/^[1-9]\d*$/.test(value)) {
      discarded = true;
      continue;
    }
    next.set(key, value);
  }
  return { params: next, discarded };
}

function validateResourceFacetValues(params: URLSearchParams): boolean {
  let discarded = false;
  for (const [key, allowed] of Object.entries(RESOURCE_FACET_VALUES)) {
    const value = params.get(key);
    if (value && !allowed.includes(value)) {
      params.delete(key);
      discarded = true;
    }
  }
  return discarded;
}

function withParams(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Resolves every supported hash path into its one canonical URL. This is the
 * only compatibility table and is deliberately independent from rendering.
 */
/**
 * The 2026-08 public names (Atlas, Library, Guides, Documents) are accepted as
 * URLs and resolved to the existing canonical paths. Old bookmarks keep
 * working; new names are never a dead link.
 */
const PUBLIC_NAME_ALIASES: Readonly<Record<string, string>> = {
  "/atlas": "/explore",
  "/library": "/catalog",
  "/guides": "/learn",
  "/documents": "/build",
};

function resolvePublicNameAlias(path: string): string {
  const exact = PUBLIC_NAME_ALIASES[path];
  if (exact) return exact;
  for (const [alias, canonical] of Object.entries(PUBLIC_NAME_ALIASES)) {
    if (path.startsWith(`${alias}/`)) {
      return `${canonical}${path.slice(alias.length)}`;
    }
  }
  return path;
}

export function canonicalizeHashLocation(input: string): CanonicalRoute {
  const { path: initialPath, params: incoming } = normalizedPath(input);
  let path = resolvePublicNameAlias(initialPath);
  let params = incoming;
  let discarded = false;

  // The startup shim owns pre-hash `?view=...` links. Preserve them until it
  // moves the full query into the HashRouter instead of discarding state first.
  if (path === "/" && (params.has("view") || params.has("q"))) {
    return { canonicalPath: withParams(path, params), requiresReplace: false, recoveryMessage: "" };
  }

  const legacyTemplate = path === "/build" ? params.get("templateType") || "" : "";
  if (legacyTemplate) {
    params.delete("templateType");
    if (isKnownBuildDocument(legacyTemplate)) {
      path = `/build/documents/${encodeURIComponent(legacyTemplate)}`;
    } else {
      discarded = true;
    }
  }

  if (path === "/build/resources") {
    path = "/resources";
  } else if (/^\/build\/resources\/[^/]+$/.test(path)) {
    path = path.replace(/^\/build\/resources/, "/resources");
  }

  let permitted: Set<string> | null = null;
  if (path === "/explore") permitted = ATLAS_PARAMS;
  if (path === "/search") permitted = SEARCH_PARAMS;
  if (path === "/catalog" || /^\/catalog\/[^/]+$/.test(path)) permitted = CATALOG_PARAMS;
  if (path === "/resources") permitted = RESOURCE_PARAMS;
  if (/^\/resources\/[^/]+$/.test(path)) permitted = DETAIL_PARAMS;
  if (path.startsWith("/record/")) permitted = DETAIL_PARAMS;
  if (path === "/start") permitted = START_PARAMS;
  if (path === "/compare") permitted = COMPARE_PARAMS;
  if (path === "/learn") permitted = LEARN_PARAMS;
  if (path === "/build" || /^\/build\/(?:tasks(?:\/[^/]+)?|documents(?:\/[^/]+)?)$/.test(path)) permitted = BUILD_PARAMS;
  if (path === "/sources") permitted = SOURCE_PARAMS;
  if (path === "/retired") permitted = RETIRED_PARAMS;
  if (permitted) {
    const result = permittedParams(params, permitted);
    params = result.params;
    discarded ||= result.discarded;
    if (path === "/resources") discarded ||= validateResourceFacetValues(params);
  } else if (params.size > 0 && !path.startsWith("/catalog/")) {
    params = new URLSearchParams();
    discarded = true;
  }

  const taskMatch = path.match(/^\/build\/tasks\/([^/]+)$/);
  if (taskMatch && !isKnownBuildTask(decodeURIComponent(taskMatch[1]))) {
    path = "/build";
    discarded = true;
  }
  const documentMatch = path.match(/^\/build\/documents\/([^/]+)$/);
  if (documentMatch) {
    const documentName = decodeURIComponent(documentMatch[1]);
    if (!isKnownBuildDocument(documentName)) {
      path = "/build/documents";
      discarded = true;
    } else {
      const format = params.get("format") || "";
      if (format && !isValidBuildFormat(documentName, format)) {
        params.delete("format");
        discarded = true;
      }
      const framework = params.get("framework") || "";
      if (!isValidBuildSourceContext(framework)) {
        params.delete("framework");
        discarded = true;
      }
    }
  }

  const canonicalPath = withParams(path, params);
  return {
    canonicalPath,
    requiresReplace: canonicalPath !== input.replace(/^#/, ""),
    recoveryMessage: discarded ? "Some unsupported link settings were removed. You can continue from this page." : "",
  };
}
