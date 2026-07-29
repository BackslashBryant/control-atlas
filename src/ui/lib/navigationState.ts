import { selectedNavFor } from "./routeIdentity";
import type { ViewState } from "./viewState";

export function activeNavForState(state: ViewState): ViewState["view"] | null {
  return selectedNavFor(state.view);
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
    view === "library-detail" ||
    view === "catalog-detail" ||
    view === "matrix" ||
    view === "sources" ||
    view === "templates" ||
    view === "retired"
  );
}
