import { IconArrowLeft } from "@tabler/icons-react";

import type { ViewState } from "../lib/viewState";
import { routeIdentityFor } from "../lib/routeIdentity";
import { AppLink } from "./AppLink";

type RouteContext = {
  depth: 0 | 1 | 2;
  mode: "editorial" | "operational";
  label: string;
  scope: string;
  back?: {
    label: string;
    view: ViewState["view"];
    patch?: Partial<ViewState>;
  };
};

export function orbitalRouteContext(state: ViewState, entityName = ""): RouteContext {
  switch (state.view) {
    case "home":
      return {
        depth: 0,
        mode: "editorial",
        label: routeIdentityFor("home").contextLabel,
        scope: "Control Atlas",
      };
    case "library-detail": {
      return {
        depth: 2,
        mode: "operational",
        label: routeIdentityFor("library-detail").contextLabel,
        scope: entityName || "Record detail",
      };
    }
    case "commons-detail":
      return {
        depth: 2,
        mode: "operational",
        label: routeIdentityFor("commons-detail").contextLabel,
        scope: entityName || "Resource detail",
        back: { label: "All resources", view: "commons" },
      };
    case "not-found":
      return {
        depth: 0,
        mode: "operational",
        label: routeIdentityFor("not-found").contextLabel,
        scope: "Unknown route",
        back: { label: "Home", view: "home" },
      };
    case "retired":
      return {
        depth: 0,
        mode: "operational",
        label: routeIdentityFor("retired").contextLabel,
        scope: state.query || "Retired identifier",
        back: { label: routeIdentityFor("search").label, view: "search" },
      };
    case "atlas-map":
      return {
        depth: 1,
        mode: "operational",
        // Internal view key stays "atlas-map"; nav label renamed to Explore.
        label: routeIdentityFor("atlas-map").contextLabel,
        // "Choose a branch" was the tree model talking to itself.
        scope: entityName,
      };
    case "search":
      return {
        depth: 1,
        mode: "operational",
        // Renamed from "Explore" so it no longer shares a name with the
        // atlas-map nav item (see docs/PAGE_CONTRACTS.md).
        label: routeIdentityFor("search").contextLabel,
        scope: state.query,
      };
    case "catalog-detail":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("catalog-detail").contextLabel,
        scope: "",
      };
    case "matrix":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("matrix").contextLabel,
        scope: "",
      };
    case "patterns":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("patterns").contextLabel,
        scope: "",
      };
    case "templates":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("templates").contextLabel,
        scope: "",
      };
    case "sources":
      return {
        depth: state.source ? 2 : 1,
        mode: "operational",
        label: state.source ? "Source" : "Sources",
        scope: "",
        back: state.source
          ? {
              label: "Back to sources",
              view: "sources",
              patch: { ...state, source: "" },
            }
          : undefined,
      };
    case "commons":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("commons").contextLabel,
        scope: "",
      };
    case "start-here":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("start-here").contextLabel,
        scope: "",
      };
    case "about":
      return {
        depth: 0,
        mode: "operational",
        label: routeIdentityFor("about").contextLabel,
        scope: "",
        back: { label: "Home", view: "home" },
      };
  }
}

export function OrbitalContextBar(props: {
  entityName?: string;
  state: ViewState;
  onNavigate: (
    view: ViewState["view"],
    patch?: Partial<ViewState>,
  ) => void;
}) {
  const context = orbitalRouteContext(props.state, props.entityName);

  // The bar earns its space only when it adds something the page header does
  // not already say: a real subject, or a way back to a parent. Otherwise it
  // was a second copy of the page title under a generic "Section" chip.
  if (props.state.view === "home" || (!context.scope && !context.back)) {
    return null;
  }

  return (
    <div
      aria-label="Page context"
      className="orbital-context"
      data-depth={context.depth}
      data-mode={context.mode}
      role="region"
    >
      <div className="orbital-context-inner ca-page">
        <div className="orbital-context-location">
          <strong>{context.label}</strong>
        </div>
        {/* STIG rules carry a full sentence as their title, which the record
            page already prints as its H1 and again in the breadcrumb. Shortened
            here so the same sentence is not on screen three times; the full
            text stays in the tooltip. */}
        {context.scope ? (
          <span className="orbital-context-scope" title={context.scope}>
            {context.scope.length > 56
              ? `${context.scope.slice(0, 55).trimEnd()}…`
              : context.scope}
          </span>
        ) : null}
        {context.back ? (
          <AppLink
            className="orbital-context-return"
            onNavigate={props.onNavigate}
            patch={context.back.patch}
            view={context.back.view}
          >
            <IconArrowLeft aria-hidden="true" size={16} stroke={1.5} />
            {context.back.label}
          </AppLink>
        ) : null}
      </div>
    </div>
  );
}
