import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
  type AppView,
  type ViewState,
} from "./viewState";
import { canonicalizeHashLocation, routeIdentityFor } from "./routeIdentity";

/**
 * Map internal view keys to hash path segments (user-facing routes).
 * View key "atlas-map" -> user-facing "Explore" nav label (rename kept its
 * existing path — see PLAN CHANGE in docs/STATE.md: "/explore" is already
 * the ExplorePage's own path). "catalog-detail" -> "Catalog", "patterns" ->
 * "Learn", "templates" -> "Build". "commons"/"commons-detail" no longer have
 * a top-nav entry (folded into Build) but keep their own routes, now nested
 * under /build.
 */
const VIEW_TO_PATH: Record<AppView, string> = {
  home: routeIdentityFor("home").path,
  menu: routeIdentityFor("menu").path,
  "start-here": routeIdentityFor("start-here").path,
  "atlas-map": routeIdentityFor("atlas-map").path,
  search: routeIdentityFor("search").path,
  "catalog-detail": routeIdentityFor("catalog-detail").path,
  "library-detail": routeIdentityFor("library-detail").path,
  matrix: routeIdentityFor("matrix").path,
  patterns: routeIdentityFor("patterns").path,
  templates: routeIdentityFor("templates").path,
  sources: routeIdentityFor("sources").path,
  commons: routeIdentityFor("commons").path,
  "commons-detail": routeIdentityFor("commons-detail").path,
  about: routeIdentityFor("about").path,
  retired: routeIdentityFor("retired").path,
  browse: routeIdentityFor("browse").path,
  "not-found": routeIdentityFor("not-found").path,
};

const PATH_TO_VIEW: Record<string, AppView> = {
  "/": "home",
  "/start": "start-here",
  "/explore": "atlas-map",
  "/search": "search",
  "/catalog": "catalog-detail",
  "/record": "library-detail",
  "/compare": "matrix",
  "/learn": "patterns",
  "/build": "templates",
  "/sources": "sources",
  "/build/resources": "commons",
  "/build/resources-detail": "commons-detail",
  "/about": "about",
  "/retired": "retired",
  "/not-found": "not-found",
};

function parseNodeIdFromPath(pathname: string): {
  basePath: string;
  nodeId: string;
  catalogId: string;
  resourceId: string;
} {
  const catalogMatch = pathname.match(/^\/catalog\/([^/]+)$/);
  if (catalogMatch) {
    return {
      basePath: "/catalog",
      nodeId: "",
      catalogId: decodeURIComponent(catalogMatch[1]),
      resourceId: "",
    };
  }
  const recordMatch = pathname.match(/^\/(?:record|object)\/([^/]+)\/(.+)$/);
  if (recordMatch) {
    return {
      basePath: "/record",
      nodeId: `${decodeURIComponent(recordMatch[1])}:${decodeURIComponent(recordMatch[2])}`,
      catalogId: "",
      resourceId: "",
    };
  }
  // Fallback for flat /object/ID without catalog (legacy)
  const legacyObjectMatch = pathname.match(/^\/object\/(.+)$/);
  if (legacyObjectMatch) {
    return {
      basePath: "/record",
      nodeId: decodeURIComponent(legacyObjectMatch[1]),
      catalogId: "",
      resourceId: "",
    };
  }
  const resourceMatch = pathname.match(/^\/build\/resources\/([^/]+)$/);
  if (resourceMatch) {
    return {
      basePath: "/build/resources-detail",
      nodeId: "",
      catalogId: "",
      resourceId: decodeURIComponent(resourceMatch[1]),
    };
  }
  return { basePath: pathname, nodeId: "", catalogId: "", resourceId: "" };
}

export function parseHashLocation(pathname: string, search: string): ViewState {
  const canonical = canonicalizeHashLocation(`${pathname}${search}`);
  const [normalizedPath, canonicalSearch = ""] = canonical.canonicalPath.split("?", 2);
  const { basePath, nodeId, catalogId, resourceId } = parseNodeIdFromPath(normalizedPath);
  // Root resolves to home; any other unrecognized path is an honest not-found
  // rather than silently rendering home.
  const view =
    PATH_TO_VIEW[basePath] ?? (basePath === "/" ? "home" : "not-found");

  const params = new URLSearchParams(canonicalSearch);

  if (view === "library-detail" && nodeId) {
    params.set("node", nodeId);
  }
  if (view === "catalog-detail" && catalogId) {
    params.set("catalog", catalogId);
  }
  if (view === "commons-detail" && resourceId) {
    params.set("id", resourceId);
  }

  if (view !== "home") {
    params.set("view", legacyViewParam(view));
  }

  return parseViewState(`?${params.toString()}`);
}

function legacyViewParam(view: AppView): string {
  if (view === "search") return "explore";
  if (view === "patterns") return "playbooks";
  return view;
}

export function serializeHashLocation(state: ViewState): string {
  const query = serializeViewState(state).replace(/^\?/, "");
  const params = new URLSearchParams(query);
  params.delete("view");

  if (state.view === "library-detail" && state.node) {
    const [catalog, item] = state.node.includes(":")
      ? state.node.split(":", 2)
      : ["item", state.node];
    params.delete("node");
    const qs = params.toString();
    return `/record/${encodeURIComponent(catalog)}/${encodeURIComponent(item || state.node)}${qs ? `?${qs}` : ""}`;
  }

  if (state.view === "catalog-detail" && state.catalog) {
    return `/catalog/${encodeURIComponent(state.catalog)}`;
  }

  if (state.view === "commons-detail" && state.id) {
    params.delete("id");
    const qs = params.toString();
    return `/build/resources/${encodeURIComponent(state.id)}${qs ? `?${qs}` : ""}`;
  }

  const path = VIEW_TO_PATH[state.view] ?? "/";
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

/** Full hash URL for copy/share (includes leading #). */
export function serializeHashUrl(state: ViewState): string {
  return `#${serializeHashLocation(state)}`;
}

function inferRecordType(catalogId: string): string {
  const nodeTypeHints: Record<string, string> = {
    "nist-800-53": "control",
    "fedramp-rev5": "baseline",
    "disa-stig": "stig_rule",
    "disa-cci": "cci",
    "mitre-attack": "attack_technique",
    "mitre-d3fend": "defend_countermeasure",
  };
  return nodeTypeHints[catalogId] || catalogId;
}

export { inferRecordType };

export function navigateToView(
  navigate: (to: string, options?: { replace?: boolean }) => void,
  view: AppView,
  patch: Partial<ViewState> = {},
  options?: { replace?: boolean },
) {
  const state = normalizeViewState(view, patch);
  navigate(serializeHashLocation(state), options);
}

export function applyLegacyQueryRedirect(): boolean {
  const { search, hash } = window.location;
  if (!search || hash.replace(/^#\/?/, "").length > 0) {
    return false;
  }
  const params = new URLSearchParams(search);
  if (!params.get("view") && !params.get("q")) {
    return false;
  }
  const state = parseViewState(search);
  const target = serializeHashUrl(state);
  window.history.replaceState(null, "", `${window.location.pathname}${target}`);
  return true;
}
