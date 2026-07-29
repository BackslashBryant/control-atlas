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
  section: "framework" | "toolkit" | "utility";
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const FRAMEWORK_SECTION_LABEL = "The framework";
export const TOOLKIT_SECTION_LABEL = "Practitioner toolkit";

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: routeIdentityFor("atlas-map").label,
    view: "atlas-map",
    path: routeIdentityFor("atlas-map").path,
    icon: IconMap,
    section: "framework",
  },
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
