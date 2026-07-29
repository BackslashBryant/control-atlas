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

export function requiresFullGraph(state: ViewState) {
  return (
    (state.view === "matrix" &&
      (state.compareRun === "true" ||
        state.crosswalk === "stig-chain" ||
        state.crosswalk === "baseline-compare" ||
        state.crosswalk === "threat-chain")) ||
    (state.view === "templates" && Boolean(state.templateType))
  );
}
