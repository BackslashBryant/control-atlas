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
  { label: "Explore", view: "atlas-map", path: "/atlas-map", icon: IconMap, section: "framework" },
  {
    label: "Catalog",
    view: "catalog-detail",
    path: "/catalog",
    icon: IconLibrary,
    patch: { catalog: "" },
    section: "framework",
  },
  {
    label: "Compare",
    view: "matrix",
    path: "/compare",
    icon: IconGitCompare,
    section: "framework",
  },
  {
    label: "Learn",
    view: "patterns",
    path: "/learn",
    icon: IconBook2,
    section: "toolkit",
  },
  {
    // Commons folded in: starter documents, official artifacts, tools, and
    // community resources are now all under Build. Internal view key stays
    // "templates".
    label: "Build",
    view: "templates",
    path: "/build",
    icon: IconClipboardList,
    section: "toolkit",
  },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: "Start here",
    view: "start-here",
    path: "/start",
    icon: IconCompass,
    section: "utility",
  },
  {
    label: "Sources",
    view: "sources",
    path: "/sources",
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
