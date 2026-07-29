export const ROUTE_COMMITTED_EVENT = "control-atlas:route-committed";
export const SEARCH_RESULTS_FOCUS_EVENT =
  "control-atlas:search-results-focus-requested";

export function notifyRouteCommitted() {
  window.dispatchEvent(new Event(ROUTE_COMMITTED_EVENT));
}

export function requestSearchResultsFocus() {
  window.dispatchEvent(new Event(SEARCH_RESULTS_FOCUS_EVENT));
}
