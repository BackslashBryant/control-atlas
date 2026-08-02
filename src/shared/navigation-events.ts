export const ROUTE_COMMITTED_EVENT = "control-atlas:route-committed";
export const SEARCH_RESULTS_FOCUS_EVENT =
  "control-atlas:search-results-focus-requested";
export const OPEN_SEARCH_OVERLAY_EVENT = "control-atlas:open-search-overlay";

export function notifyRouteCommitted() {
  window.dispatchEvent(new Event(ROUTE_COMMITTED_EVENT));
}

export function requestSearchResultsFocus() {
  window.dispatchEvent(new Event(SEARCH_RESULTS_FOCUS_EVENT));
}

// The static Home shell has no React overlay to open before React boots; it
// boots React first, then fires this so App's own Ctrl+K handler finishes
// the job the same way a click on the header search button would.
export function requestSearchOverlayOpen() {
  window.dispatchEvent(new Event(OPEN_SEARCH_OVERLAY_EVENT));
}
