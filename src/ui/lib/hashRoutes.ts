import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
  type AppView,
  type ViewState,
} from "./viewState";

/** Map internal view keys to hash path segments (user-facing routes). */
const VIEW_TO_PATH: Record<AppView, string> = {
  home: "/",
  "start-here": "/start",
  "atlas-map": "/atlas-map",
  search: "/explore",
  "library-detail": "/record",
  matrix: "/compare",
  patterns: "/playbooks",
  templates: "/templates",
  sources: "/sources",
  about: "/about",
  retired: "/retired",
  browse: "/explore",
  "not-found": "/not-found",
};

const PATH_TO_VIEW: Record<string, AppView> = {
  "/": "home",
  "/start": "start-here",
  "/atlas-map": "atlas-map",
  "/explore": "search",
  "/record": "library-detail",
  "/compare": "matrix",
  "/playbooks": "patterns",
  "/templates": "templates",
  "/sources": "sources",
  "/about": "about",
  "/retired": "retired",
  "/not-found": "not-found",
};

function parseNodeIdFromPath(pathname: string): {
  basePath: string;
  nodeId: string;
} {
  const recordMatch = pathname.match(/^\/(?:record|object)\/([^/]+)\/(.+)$/);
  if (recordMatch) {
    return {
      basePath: "/record",
      nodeId: `${decodeURIComponent(recordMatch[1])}:${decodeURIComponent(recordMatch[2])}`,
    };
  }
  // Fallback for flat /object/ID without catalog (legacy)
  const legacyObjectMatch = pathname.match(/^\/object\/(.+)$/);
  if (legacyObjectMatch) {
    return {
      basePath: "/record",
      nodeId: decodeURIComponent(legacyObjectMatch[1]),
    };
  }
  return { basePath: pathname, nodeId: "" };
}

export function parseHashLocation(pathname: string, search: string): ViewState {
  let normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  // Tolerate a trailing slash on interior routes (e.g. "/atlas-map/") so they
  // resolve instead of falling through to the not-found view.
  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
  }
  const { basePath, nodeId } = parseNodeIdFromPath(normalizedPath);
  // Root resolves to home; any other unrecognized path is an honest not-found
  // rather than silently rendering home.
  const view =
    PATH_TO_VIEW[basePath] ?? (basePath === "/" ? "home" : "not-found");

  const params = new URLSearchParams(search.replace(/^\?/, ""));

  if (view === "library-detail" && nodeId) {
    params.set("node", nodeId);
  }

  if (view === "search" && basePath === "/explore") {
    params.set("view", "explore");
  } else if (view !== "home") {
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
