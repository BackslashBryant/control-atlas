import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconGitCompare,
  IconLibrary,
  IconMap,
  IconSourceCode,
  IconTool,
} from "@tabler/icons-react";

import type { ViewState } from "./viewState";
import { routeIdentityFor } from "./routeIdentity";
export {
  activeNavForState,
  isStaticViewWithoutBundle,
  requiresFullGraph,
} from "./navigationState";

export type NavItem = {
  label: string;
  view: ViewState["view"];
  path: string;
  icon: typeof IconCompass;
  patch?: Record<string, string>;
  section: "discovery" | "toolkit" | "utility";
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const DISCOVERY_SECTION_LABEL = "Explore and compare";
export const TOOLKIT_SECTION_LABEL = "Learn and work";

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: routeIdentityFor("atlas-map").label,
    view: "atlas-map",
    path: routeIdentityFor("atlas-map").path,
    icon: IconMap,
    section: "discovery",
  },
  {
    label: routeIdentityFor("catalog-detail").label,
    view: "catalog-detail",
    path: routeIdentityFor("catalog-detail").path,
    icon: IconLibrary,
    patch: { catalog: "" },
    section: "discovery",
  },
  {
    label: routeIdentityFor("matrix").label,
    view: "matrix",
    path: routeIdentityFor("matrix").path,
    icon: IconGitCompare,
    section: "discovery",
  },
  {
    label: routeIdentityFor("patterns").label,
    view: "patterns",
    path: routeIdentityFor("patterns").path,
    icon: IconBook2,
    section: "toolkit",
  },
  {
    label: routeIdentityFor("templates").label,
    view: "templates",
    path: routeIdentityFor("templates").path,
    icon: IconClipboardList,
    section: "toolkit",
  },
  {
    label: routeIdentityFor("commons").label,
    view: "commons",
    path: routeIdentityFor("commons").path,
    icon: IconTool,
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

export const MOBILE_NAV_SECTIONS: NavSection[] = [
  {
    label: DISCOVERY_SECTION_LABEL,
    items: PRIMARY_NAV_ITEMS.filter((item) => item.section === "discovery"),
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
