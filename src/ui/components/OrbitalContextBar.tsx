import { IconArrowLeft } from "@tabler/icons-react";

import type { ViewState } from "../lib/viewState";

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

export function orbitalRouteContext(state: ViewState): RouteContext {
  switch (state.view) {
    case "home":
      return {
        depth: 0,
        mode: "editorial",
        label: "Home",
        scope: "Control Atlas",
      };
    case "menu":
      return {
        depth: 0,
        mode: "editorial",
        label: "Choose a path",
        scope: "Control Atlas",
        back: { label: "Home", view: "home" },
      };
    case "library-detail": {
      const [catalog = ""] = state.node.split(":", 1);
      return {
        depth: 2,
        mode: "operational",
        label: "Record",
        scope: state.node || "Record detail",
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
        label: "Resource",
        scope: state.id || "Resource detail",
        // Commons is folded into Build (no top-nav entry) — back-link reads
        // "Build" though the internal view key stays "commons".
        back: { label: "Build", view: "commons" },
      };
    case "not-found":
      return {
        depth: 0,
        mode: "operational",
        label: "Page not found",
        scope: "Unknown route",
        back: { label: "Home", view: "home" },
      };
    case "retired":
      return {
        depth: 0,
        mode: "operational",
        label: "Retired identifier",
        scope: state.query || "Retired identifier",
        back: { label: "Search results", view: "search" },
      };
    case "atlas-map":
      return {
        depth: 1,
        mode: "operational",
        // Internal view key stays "atlas-map"; nav label renamed to Explore.
        label: "Explore",
        scope: state.node || "Choose a source path",
      };
    case "search":
      return {
        depth: 1,
        mode: "operational",
        // Renamed from "Explore" so it no longer shares a name with the
        // atlas-map nav item (see PLAN CHANGE in docs/STATE.md).
        label: "Search results",
        scope: state.query || "All public records",
      };
    case "catalog-detail":
    case "browse":
      return {
        depth: 1,
        mode: "operational",
        label: "Catalog",
        scope:
          state.view === "catalog-detail"
            ? state.catalog || "All catalogs"
            : state.framework || "All catalogs",
      };
    case "matrix":
      return {
        depth: 1,
        mode: "operational",
        label: "Compare",
        scope: state.crosswalk || "Choose a comparison",
      };
    case "patterns":
      return {
        depth: 1,
        mode: "operational",
        label: "Learn",
        scope: state.pattern || "All guides",
      };
    case "templates":
      return {
        depth: 1,
        mode: "operational",
        label: "Build",
        scope: state.templateType || "Choose a document task",
      };
    case "sources":
      return {
        depth: state.source ? 2 : 1,
        mode: "operational",
        label: state.source ? "Source" : "Sources",
        scope: state.source || "All publishers",
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
        // Folded into Build (no top-nav entry); internal view key unchanged.
        label: "Build",
        scope: state.query || state.lane || "All resources",
      };
    case "start-here":
      return {
        depth: 1,
        mode: "operational",
        label: "Start here",
        scope: state.step ? `Step ${state.step}` : "Orientation",
      };
    case "about":
      return {
        depth: 0,
        mode: "operational",
        label: "About",
        scope: "Purpose and trust boundary",
        back: { label: "Home", view: "home" },
      };
  }
}

export function OrbitalContextBar(props: {
  state: ViewState;
  onNavigate: (
    view: ViewState["view"],
    patch?: Partial<ViewState>,
  ) => void;
}) {
  const context = orbitalRouteContext(props.state);

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
