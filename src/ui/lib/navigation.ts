import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconDots,
  IconGitCompare,
  IconMap,
  IconSearch,
  IconSourceCode,
} from "@tabler/icons-react";

import type { ViewState } from "./viewState";

export const PRIMARY_NAV_ITEMS = [
  { label: "Start", view: "start-here", path: "/start", icon: IconCompass },
  { label: "Atlas", view: "atlas-map", path: "/atlas-map", icon: IconMap },
  { label: "Explore", view: "search", path: "/explore", icon: IconSearch },
  { label: "Compare", view: "matrix", path: "/compare", icon: IconGitCompare },
] as const;

export const SECONDARY_NAV_ITEMS = [
  { label: "Playbooks", view: "patterns", path: "/playbooks", icon: IconBook2 },
  {
    label: "Templates",
    view: "templates",
    path: "/templates",
    icon: IconClipboardList,
  },
  { label: "Sources", view: "sources", path: "/sources", icon: IconSourceCode },
] as const;

export const MORE_NAV_ITEM = {
  label: "More",
  view: "more",
  icon: IconDots,
} as const;

export const ALL_NAV_ITEMS = [
  ...PRIMARY_NAV_ITEMS,
  ...SECONDARY_NAV_ITEMS,
] as const;

export function activeNavForState(state: ViewState): ViewState["view"] | null {
  if (state.view === "home") {
    return null;
  }
  if (
    state.view === "library-detail" ||
    state.view === "browse" ||
    state.view === "retired"
  ) {
    return "search";
  }
  return state.view;
}

export function isStaticViewWithoutBundle(view: ViewState["view"]) {
  return (
    view === "about" ||
    view === "home" ||
    view === "patterns" ||
    view === "start-here" ||
    view === "search"
  );
}

export function requiresFullGraph(view: ViewState["view"]) {
  return (
    view === "atlas-map" ||
    view === "search" ||
    view === "library-detail" ||
    view === "matrix" ||
    view === "sources" ||
    view === "templates" ||
    view === "browse" ||
    view === "retired"
  );
}
