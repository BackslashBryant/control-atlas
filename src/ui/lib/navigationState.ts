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
    // The Atlas landing uses the compact publisher-catalog bootstrap. Only a
    // structure/process choice needs the monolithic graph; a focused record
    // uses its neighborhood shard. These boundaries are enforced by the
    // bootstrap payload tests.
    (state.view === "atlas-map" &&
      !state.node &&
      Boolean(
        state.atlasAxis ||
          state.atlasFramework ||
          state.atlasBaseline ||
          state.atlasFamily ||
          state.atlasRmfStep ||
          state.sourceView === "rmf" ||
          state.sourceView === "rmf-lifecycle" ||
          state.relationshipView === "rmf",
      )) ||
    (state.view === "matrix" &&
      (state.compareRun === "true" ||
        state.crosswalk === "stig-chain" ||
        state.crosswalk === "baseline-compare" ||
        state.crosswalk === "threat-chain")) ||
    (state.view === "templates" && Boolean(state.templateType))
  );
}
