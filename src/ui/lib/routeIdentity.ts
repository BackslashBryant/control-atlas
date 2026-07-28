import type { AppView } from "./viewState";

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
  menu: { path: "/", label: "Home", title: "Home", contextLabel: "Home", analyticsName: "home" },
  "start-here": { path: "/start", label: "Start here", title: "Start", contextLabel: "Start here", analyticsName: "start_here" },
  "atlas-map": { path: "/explore", label: "Explore", title: "Explore", contextLabel: "Explore", analyticsName: "explore" },
  search: { path: "/search", label: "Search", title: "Search", contextLabel: "Search", analyticsName: "search" },
  "catalog-detail": { path: "/catalog", label: "Catalog", title: "Catalog", contextLabel: "Catalog", analyticsName: "catalog" },
  "library-detail": { path: "/record", label: "Record", title: "Record", contextLabel: "Record", analyticsName: "record_detail" },
  matrix: { path: "/compare", label: "Compare", title: "Compare", contextLabel: "Compare", analyticsName: "compare" },
  patterns: { path: "/learn", label: "Learn", title: "Learn", contextLabel: "Learn", analyticsName: "learn" },
  templates: { path: "/build", label: "Build", title: "Build", contextLabel: "Build", analyticsName: "build" },
  sources: { path: "/sources", label: "Sources", title: "Sources", contextLabel: "Sources", analyticsName: "sources" },
  commons: { path: "/build/resources", label: "Resources", title: "Resources", contextLabel: "Resources", analyticsName: "resources" },
  "commons-detail": { path: "/build/resources", label: "Resource", title: "Resource", contextLabel: "Resource", analyticsName: "resource_detail" },
  about: { path: "/about", label: "About", title: "About", contextLabel: "About", analyticsName: "about" },
  retired: { path: "/retired", label: "Retired identifier", title: "Retired identifier", contextLabel: "Retired identifier", analyticsName: "retired_identifier" },
  browse: { path: "/catalog", label: "Catalog", title: "Catalog", contextLabel: "Catalog", analyticsName: "catalog" },
  "not-found": { path: "/not-found", label: "Page not found", title: "Page not found", contextLabel: "Page not found", analyticsName: "not_found" },
};

export function routeIdentityFor(view: AppView): RouteIdentity {
  return ROUTE_IDENTITIES[view];
}

/** Compatibility protection for saved links. No navigation control may emit these paths. */
export const COMPATIBILITY_ALIAS_POLICY = {
  owner: "Control Atlas maintainers",
  removalDate: "2026-10-27",
  removalCondition: "Retain until the deployed deep-link smoke remains green through this date.",
} as const;

export const COMPATIBILITY_ROUTE_ALIASES: Readonly<Record<string, string>> = {
  "/menu": "/",
  "/home": "/",
  "/start-here": "/start",
  "/atlas-map": "/explore",
  "/atlas": "/explore",
  "/map": "/explore",
  "/browse": "/search",
  "/compare-controls": "/compare",
  "/source": "/sources",
  "/library": "/catalog",
  "/playbooks": "/learn",
  "/playbook": "/learn",
  "/templates": "/build",
  "/template": "/build",
  "/build/community": "/build/resources",
  "/commons": "/build/resources",
  "/resource-bazaar": "/build/resources",
  "/bazaar": "/build/resources",
  "/hub": "/build/resources",
};

export type CanonicalRoute = {
  canonicalPath: string;
  requiresReplace: boolean;
  recoveryMessage: string;
};

const ATLAS_PARAMS = new Set([
  "node", "atlasAxis", "atlasFramework", "atlasBaseline", "atlasFamily",
  "atlasRmfStep", "relationshipView", "relationshipType", "provenance",
  "confidence", "type", "nodeType", "includeCandidates", "relationshipSearch",
  "atlasStage", "relationshipGroup", "sourceView", "showSupportingReferences",
  "showDraftOrLegacy", "showRegistryOnly",
]);
const SEARCH_PARAMS = new Set(["q", "filter", "objectType", "sourceClass", "controlFamily", "severity"]);
const RESOURCE_PARAMS = new Set(["q", "lane", "framework", "lifecycle", "audience", "accessType", "costType", "resourceType", "platform", "format", "collection", "selectedId"]);
const DETAIL_PARAMS = new Set(["from", "returnTo", "relationshipView", "relationshipType", "provenance", "confidence", "nodeType", "includeCandidates", "relationshipSearch"]);
const START_PARAMS = new Set(["step", "systemType", "dataSensitivity", "environment"]);
const COMPARE_PARAMS = new Set(["crosswalk", "workbench", "source", "target", "items", "relationshipType", "provenance", "confidence", "includeCandidates", "chainCatalog", "chainBenchmark", "chainItem", "baselineA", "baselineB", "intent", "compareView"]);
const LEARN_PARAMS = new Set(["pattern"]);
const BUILD_PARAMS = new Set(["templateType", "framework", "format", "environment", "baseline", "controlFamily"]);
const SOURCE_PARAMS = new Set(["source", "provenance", "eligibility", "lifecycle", "access"]);
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
    next.set(key, value);
  }
  return { params: next, discarded };
}

function safeResourceId(value: string): string {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(value) ? value : "";
}

function withParams(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Resolves every supported hash path into its one canonical URL. This is the
 * only compatibility table and is deliberately independent from rendering.
 */
export function canonicalizeHashLocation(input: string): CanonicalRoute {
  const { path: initialPath, params: incoming } = normalizedPath(input);
  let path = initialPath;
  let params = incoming;
  let discarded = false;

  // The startup shim owns pre-hash `?view=...` links. Preserve them until it
  // moves the full query into the HashRouter instead of discarding state first.
  if (path === "/" && (params.has("view") || params.has("q"))) {
    return { canonicalPath: withParams(path, params), requiresReplace: false, recoveryMessage: "" };
  }

  const legacyCatalog = path.match(/^\/library\/([^/]+)$/);
  if (legacyCatalog) {
    path = `/catalog/${encodeURIComponent(decodeURIComponent(legacyCatalog[1]))}`;
  }

  const legacyRecord = path.match(/^\/(?:object)\/(.+)$/);
  if (legacyRecord) {
    const segments = legacyRecord[1].split("/");
    path = segments.length > 1
      ? `/record/${encodeURIComponent(decodeURIComponent(segments[0]))}/${encodeURIComponent(decodeURIComponent(segments.slice(1).join("/")))}`
      : `/record/item/${encodeURIComponent(decodeURIComponent(segments[0]))}`;
  }

  const legacyResourceDetail = path === "/build/community-detail" || path === "/commons-detail";
  if (legacyResourceDetail) {
    const id = safeResourceId(params.get("id") || "");
    params.delete("id");
    path = id ? `/build/resources/${encodeURIComponent(id)}` : "/build/resources";
    discarded ||= !id;
  }

  if (path === "/explore" && params.has("q")) {
    path = "/search";
  } else {
    path = COMPATIBILITY_ROUTE_ALIASES[path] ?? path;
  }

  let permitted: Set<string> | null = null;
  if (path === "/explore") permitted = ATLAS_PARAMS;
  if (path === "/search") permitted = SEARCH_PARAMS;
  if (path === "/build/resources") permitted = RESOURCE_PARAMS;
  if (/^\/build\/resources\/[^/]+$/.test(path)) permitted = DETAIL_PARAMS;
  if (path.startsWith("/record/")) permitted = DETAIL_PARAMS;
  if (path === "/start") permitted = START_PARAMS;
  if (path === "/compare") permitted = COMPARE_PARAMS;
  if (path === "/learn") permitted = LEARN_PARAMS;
  if (path === "/build") permitted = BUILD_PARAMS;
  if (path === "/sources") permitted = SOURCE_PARAMS;
  if (path === "/retired") permitted = RETIRED_PARAMS;
  if (permitted) {
    const result = permittedParams(params, permitted);
    params = result.params;
    discarded ||= result.discarded;
  } else if (params.size > 0 && !path.startsWith("/catalog/")) {
    params = new URLSearchParams();
    discarded = true;
  }

  const canonicalPath = withParams(path, params);
  return {
    canonicalPath,
    requiresReplace: canonicalPath !== input.replace(/^#/, ""),
    recoveryMessage: discarded ? "Some unsupported link settings were removed. You can continue from this page." : "",
  };
}
