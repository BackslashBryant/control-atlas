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
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// The desktop header exposes the product's real destinations. Users should
// not have to open an abstract verb menu before they can reach a familiar
// catalog, map, comparison, guide, or document surface.
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: "Library",
    view: "catalog-detail",
    path: "/library",
    icon: IconLibrary,
    patch: { catalog: "" },
  },
  { label: "Atlas", view: "atlas-map", path: "/atlas-map", icon: IconMap },
  {
    label: "Compare",
    view: "matrix",
    path: "/compare",
    icon: IconGitCompare,
  },
  {
    label: "Commons",
    view: "commons",
    path: "/commons",
    icon: IconBook2,
  },
  {
    label: "Guides",
    view: "patterns",
    path: "/playbooks",
    icon: IconBook2,
  },
  {
    label: "Documents",
    view: "templates",
    path: "/templates",
    icon: IconClipboardList,
  },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: "Start here",
    view: "start-here",
    path: "/start",
    icon: IconCompass,
  },
  {
    label: "Sources",
    view: "sources",
    path: "/sources",
    icon: IconSourceCode,
  },
];

export const MOBILE_NAV_SECTIONS: NavSection[] = [
  { label: "Explore", items: PRIMARY_NAV_ITEMS.slice(0, 4) },
  { label: "Work", items: PRIMARY_NAV_ITEMS.slice(4) },
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
  if (state.view === "commons-detail") {
    return "commons";
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
    view === "commons" ||
    view === "commons-detail" ||
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
