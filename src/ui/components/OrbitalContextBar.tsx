import { IconArrowLeft } from "@tabler/icons-react";

import type { ViewState } from "../lib/viewState";
import { routeIdentityFor } from "../lib/routeIdentity";

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
      const [catalog = ""] = state.node.split(":", 1);
      return {
        depth: 2,
        mode: "operational",
        label: routeIdentityFor("library-detail").contextLabel,
        scope: entityName || "Record detail",
        back: {
          label: "Catalog",
          view: "catalog-detail",
          patch: { view: "catalog-detail", catalog },
        },
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
        scope: "Choose a branch",
      };
    case "search":
      return {
        depth: 1,
        mode: "operational",
        // Renamed from "Explore" so it no longer shares a name with the
        // atlas-map nav item (see PLAN CHANGE in docs/STATE.md).
        label: routeIdentityFor("search").contextLabel,
        scope: state.query || "All public records",
      };
    case "catalog-detail":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("catalog-detail").contextLabel,
        scope: "Selected catalog",
      };
    case "matrix":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("matrix").contextLabel,
        scope: "Choose a comparison",
      };
    case "patterns":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("patterns").contextLabel,
        scope: "All guides",
      };
    case "templates":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("templates").contextLabel,
        scope: "Choose a document task",
      };
    case "sources":
      return {
        depth: state.source ? 2 : 1,
        mode: "operational",
        label: state.source ? "Source" : "Sources",
        scope: state.source ? "Selected source" : "All publishers",
        back: state.source
          ? {
              label: "All sources",
              view: "sources",
              patch: { view: "sources", source: "" },
            }
          : undefined,
      };
    case "commons":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("commons").contextLabel,
        scope: "All resources",
      };
    case "start-here":
      return {
        depth: 1,
        mode: "operational",
        label: routeIdentityFor("start-here").contextLabel,
        scope: "Published sources",
      };
    case "about":
      return {
        depth: 0,
        mode: "operational",
        label: routeIdentityFor("about").contextLabel,
        scope: "Purpose and trust boundary",
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

  if (props.state.view === "home") {
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
          <span className="orbital-depth">
            {context.depth === 0 ? "Overview" : context.depth === 1 ? "Section" : "Detail"}
          </span>
          <span aria-hidden="true" className="orbital-context-datum" />
          <strong>{context.label}</strong>
        </div>
        <span className="orbital-context-scope" title={context.scope}>
          {context.scope}
        </span>
        {context.back ? (
          <button
            className="orbital-context-return"
            onClick={() =>
              props.onNavigate(
                context.back!.view,
                context.back!.patch,
              )
            }
            type="button"
          >
            <IconArrowLeft aria-hidden="true" size={16} stroke={1.5} />
            {context.back.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
