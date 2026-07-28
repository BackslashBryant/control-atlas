import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconGitCompare,
  IconLibrary,
  IconMap,
  IconSourceCode,
} from "@tabler/icons-react";

import type { ViewState } from "./viewState";
import { routeIdentityFor } from "./routeIdentity";

export type NavItem = {
  label: string;
  view: ViewState["view"];
  path: string;
  icon: typeof IconCompass;
  patch?: Record<string, string>;
  section: "framework" | "toolkit" | "utility";
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// Two real, plain-language groups instead of one flat list. "Framework" is
// every surface that reads the SAME underlying GRC graph (roots > trunk >
// branches > twigs > leaves), ordered shallow to deep: Explore is the guided
// one-subject entry point, Catalog is the full raw catalog browse, Compare
// is deep side-by-side analysis. "Toolkit" is what a practitioner reaches
// for WHILE doing the work — how-to guides, and downloadable artifacts plus
// official tools and community resources (folded in from the former Commons
// surface) — not the graph itself.
export const FRAMEWORK_SECTION_LABEL = "The framework";
export const TOOLKIT_SECTION_LABEL = "Practitioner toolkit";

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  // Internal view key stays "atlas-map"; the user-facing route is Explore.
  { label: routeIdentityFor("atlas-map").label, view: "atlas-map", path: routeIdentityFor("atlas-map").path, icon: IconMap, section: "framework" },
  {
    label: routeIdentityFor("catalog-detail").label,
    view: "catalog-detail",
    path: routeIdentityFor("catalog-detail").path,
    icon: IconLibrary,
    patch: { catalog: "" },
    section: "framework",
  },
  {
    label: routeIdentityFor("matrix").label,
    view: "matrix",
    path: routeIdentityFor("matrix").path,
    icon: IconGitCompare,
    section: "framework",
  },
  {
    label: routeIdentityFor("patterns").label,
    view: "patterns",
    path: routeIdentityFor("patterns").path,
    icon: IconBook2,
    section: "toolkit",
  },
  {
    // Commons folded in: starter documents, official artifacts, tools, and
    // community resources are now all under Build. Internal view key stays
    // "templates".
    label: routeIdentityFor("templates").label,
    view: "templates",
    path: routeIdentityFor("templates").path,
    icon: IconClipboardList,
    section: "toolkit",
  },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: routeIdentityFor("start-here").label,
    view: "start-here",
    path: routeIdentityFor("start-here").path,
    icon: IconCompass,
    section: "utility",
  },
  {
    label: routeIdentityFor("sources").label,
    view: "sources",
    path: routeIdentityFor("sources").path,
    icon: IconSourceCode,
    section: "utility",
  },
];

// Derived from each item's declared `section`, not a positional slice — a
// new nav item can't silently land in the wrong group by being added at the
// wrong array index.
export const MOBILE_NAV_SECTIONS: NavSection[] = [
  {
    label: FRAMEWORK_SECTION_LABEL,
    items: PRIMARY_NAV_ITEMS.filter((item) => item.section === "framework"),
  },
  {
    label: TOOLKIT_SECTION_LABEL,
    items: PRIMARY_NAV_ITEMS.filter((item) => item.section === "toolkit"),
  },
  { label: "Help", items: UTILITY_NAV_ITEMS },
];

export const ALL_NAV_ITEMS = [
  ...PRIMARY_NAV_ITEMS,
  ...UTILITY_NAV_ITEMS,
];

export function activeNavForState(state: ViewState): ViewState["view"] | null {
  if (state.view === "home") {
    return null;
  }
  if (
    state.view === "search" ||
    state.view === "browse" ||
    state.view === "retired" ||
    state.view === "library-detail"
  ) {
    return "catalog-detail";
  }
  // Commons is folded into Build (no top nav entry of its own) — being on
  // either commons view highlights the Build tab instead.
  if (state.view === "commons" || state.view === "commons-detail") {
    return "templates";
  }
  return state.view;
}

export function isStaticViewWithoutBundle(view: ViewState["view"]) {
  return (
    view === "about" ||
    view === "home" ||
    view === "patterns" ||
    view === "start-here" ||
    view === "search" ||
    view === "not-found"
  );
}

export function requiresFullGraph(view: ViewState["view"]) {
  return (
    view === "library-detail" ||
    view === "catalog-detail" ||
    view === "matrix" ||
    view === "sources" ||
    view === "templates" ||
    view === "browse" ||
    view === "retired"
  );
}
