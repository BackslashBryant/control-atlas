export const ROUTE_COMMITTED_EVENT = "control-atlas:route-committed";
export const SEARCH_RESULTS_FOCUS_EVENT =
  "control-atlas:search-results-focus-requested";
export const OPEN_SEARCH_OVERLAY_EVENT = "control-atlas:open-search-overlay";
export const ROUTE_TRANSITION_START_EVENT = "control-atlas:route-transition-start";
export const ROUTE_TRANSITION_END_EVENT = "control-atlas:route-transition-end";

function transitionElements() {
  const root = document.getElementById("root");
  const overlay = root?.querySelector<HTMLElement>("[data-route-transition]");
  const status = overlay?.querySelector<HTMLElement>("[data-route-transition-status]");
  return { root, overlay, status };
}

/**
 * Start the shared progressive-shell/React route handoff synchronously with
 * the activating click. Repeating the same pending destination is suppressed;
 * a distinct follow-up state change is allowed to supersede it. This keeps a
 * double-click from duplicating history without dropping rapid form choices.
 */
export function beginRouteTransition(
  label = "Opening the next workspace",
  destinationKey = "",
): boolean {
  const { root, overlay, status } = transitionElements();
  if (!root) return false;
  if (
    root.dataset.routeTransition === "pending" &&
    (!destinationKey || root.dataset.routeTransitionDestination === destinationKey)
  ) {
    return false;
  }
  root.dataset.routeTransition = "pending";
  if (destinationKey) root.dataset.routeTransitionDestination = destinationKey;
  if (status) status.textContent = label;
  overlay?.removeAttribute("hidden");
  const workspace = root.querySelector<HTMLElement>("main:not([hidden])");
  if (workspace) {
    workspace.inert = true;
    workspace.dataset.routeTransitionInert = "true";
    workspace.setAttribute("aria-busy", "true");
  }
  window.dispatchEvent(new CustomEvent(ROUTE_TRANSITION_START_EVENT, { detail: { label } }));
  return true;
}

export function completeRouteTransition() {
  const { root, overlay } = transitionElements();
  if (!root) return;
  delete root.dataset.routeTransition;
  delete root.dataset.routeTransitionDestination;
  overlay?.setAttribute("hidden", "");
  root.querySelectorAll<HTMLElement>("[data-route-transition-inert]").forEach((workspace) => {
    workspace.inert = false;
    delete workspace.dataset.routeTransitionInert;
    workspace.removeAttribute("aria-busy");
  });
  window.dispatchEvent(new Event(ROUTE_TRANSITION_END_EVENT));
}

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
