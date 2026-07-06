import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconGitCompare,
  IconMap,
  IconSearch,
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

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Navigate",
    items: [
      { label: "Start", view: "start-here", path: "/start", icon: IconCompass },
      { label: "Atlas", view: "atlas-map", path: "/atlas-map", icon: IconMap },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Compare", view: "matrix", path: "/compare", icon: IconGitCompare },
      { label: "Sources", view: "sources", path: "/sources", icon: IconSourceCode },
      { label: "Frameworks", view: "search", path: "/explore", icon: IconSearch },
      {
        label: "Controls",
        view: "search",
        path: "/explore",
        icon: IconSearch,
        patch: { objectType: "control" },
      },
    ],
  },
  {
    label: "Build",
    items: [
      {
        label: "Templates",
        view: "templates",
        path: "/templates",
        icon: IconClipboardList,
      },
      { label: "Playbooks", view: "patterns", path: "/playbooks", icon: IconBook2 },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

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

export function activeNavGroupForState(state: ViewState): string | null {
  const view = activeNavForState(state);
  if (!view) {
    return null;
  }
  const group = NAV_GROUPS.find((candidate) =>
    candidate.items.some((item) => item.view === view),
  );
  return group?.label || null;
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
