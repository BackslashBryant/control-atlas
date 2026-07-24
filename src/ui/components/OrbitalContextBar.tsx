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
        label: "Signal",
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
        label: "Record systems",
        scope: state.node || "Record detail",
        back: {
          label: "Library",
          view: "catalog-detail",
          patch: { view: "catalog-detail", catalog },
        },
      };
    }
    case "commons-detail":
      return {
        depth: 2,
        mode: "operational",
        label: "Resource systems",
        scope: state.id || "Resource detail",
        back: { label: "Commons", view: "commons" },
      };
    case "not-found":
      return {
        depth: 0,
        mode: "operational",
        label: "Signal lost",
        scope: "Unknown route",
        back: { label: "Home", view: "home" },
      };
    case "retired":
      return {
        depth: 0,
        mode: "operational",
        label: "No active signal",
        scope: state.query || "Retired identifier",
        back: { label: "Explore", view: "search" },
      };
    case "atlas-map":
      return {
        depth: 1,
        mode: "operational",
        label: "Atlas mission",
        scope: state.node || "Choose a source path",
      };
    case "search":
      return {
        depth: 1,
        mode: "operational",
        label: "Explore mission",
        scope: state.query || "All public records",
      };
    case "catalog-detail":
    case "browse":
      return {
        depth: 1,
        mode: "operational",
        label: "Library mission",
        scope:
          state.view === "catalog-detail"
            ? state.catalog || "All catalogs"
            : state.framework || "All catalogs",
      };
    case "matrix":
      return {
        depth: 1,
        mode: "operational",
        label: "Compare mission",
        scope: state.crosswalk || "Choose a comparison",
      };
    case "patterns":
      return {
        depth: 1,
        mode: "operational",
        label: "Guide mission",
        scope: state.pattern || "All guides",
      };
    case "templates":
      return {
        depth: 1,
        mode: "operational",
        label: "Document mission",
        scope: state.templateType || "Choose a document task",
      };
    case "sources":
      return {
        depth: state.source ? 2 : 1,
        mode: "operational",
        label: state.source ? "Source systems" : "Source mission",
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
        label: "Commons mission",
        scope: state.query || state.lane || "All resources",
      };
    case "start-here":
      return {
        depth: 1,
        mode: "operational",
        label: "Guided mission",
        scope: state.step ? `Step ${state.step}` : "Orientation",
      };
    case "about":
      return {
        depth: 0,
        mode: "operational",
        label: "Product signal",
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
            Depth {context.depth} · {context.depth === 0 ? "Signal" : context.depth === 1 ? "Mission" : "Systems"}
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
        ) : (
          <span className="orbital-context-state">Public data · local session</span>
        )}
      </div>
    </div>
  );
}
