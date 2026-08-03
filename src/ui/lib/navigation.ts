import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconGitCompare,
  IconInfoCircle,
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

export const DISCOVERY_SECTION_LABEL = "Find and compare";
export const TOOLKIT_SECTION_LABEL = "Guides and documents";
export const UTILITY_SECTION_LABEL = "More";

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
];

// Resources sits in utility navigation: it holds external material that is
// deliberately outside the Atlas hierarchy, so it does not compete with the
// five primary destinations.
export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: routeIdentityFor("commons").label,
    view: "commons",
    path: routeIdentityFor("commons").path,
    icon: IconTool,
    section: "utility",
  },
  {
    label: routeIdentityFor("sources").label,
    view: "sources",
    path: routeIdentityFor("sources").path,
    icon: IconSourceCode,
    section: "utility",
  },
  {
    label: routeIdentityFor("about").label,
    view: "about",
    path: routeIdentityFor("about").path,
    icon: IconInfoCircle,
    section: "utility",
  },
];

export const START_HERE_NAV_ITEM: NavItem = {
  label: routeIdentityFor("start-here").label,
  view: "start-here",
  path: routeIdentityFor("start-here").path,
  icon: IconCompass,
  section: "utility",
};

export const MOBILE_NAV_SECTIONS: NavSection[] = [
  {
    label: DISCOVERY_SECTION_LABEL,
    items: PRIMARY_NAV_ITEMS.filter((item) => item.section === "discovery"),
  },
  {
    label: TOOLKIT_SECTION_LABEL,
    items: PRIMARY_NAV_ITEMS.filter((item) => item.section === "toolkit"),
  },
  { label: UTILITY_SECTION_LABEL, items: UTILITY_NAV_ITEMS },
];

export const ALL_NAV_ITEMS = [
  START_HERE_NAV_ITEM,
  ...PRIMARY_NAV_ITEMS,
  ...UTILITY_NAV_ITEMS,
];
