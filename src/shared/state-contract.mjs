/**
 * Standardized workflow lifecycle states across Control Atlas.
 */
export const UI_WORKFLOW_STATES = Object.freeze([
  "initial",      // Not yet configured / awaiting user choice
  "loading",      // Asynchronously fetching or hydrating data
  "ready",        // Valid configuration with actionable results
  "empty",        // Valid configuration returning zero matching records
  "blocked",      // Missing a resolvable prerequisite (with clear prompt)
  "unavailable",  // Requested capability or route unsupported in current dataset
  "error",        // Failed operation or unhandled error
]);

/**
 * Standardized workflow state resolver.
 * @param {Object} options
 * @param {boolean} [options.isLoading]
 * @param {boolean} [options.isUnavailable]
 * @param {boolean} [options.hasError]
 * @param {boolean} [options.hasPrerequisite]
 * @param {boolean} [options.isConfigured]
 * @param {boolean} [options.hasResults]
 * @returns {string} One of UI_WORKFLOW_STATES
 */
export function resolveWorkflowState({
  isLoading = false,
  isUnavailable = false,
  hasError = false,
  hasPrerequisite = true,
  isConfigured = false,
  hasResults = false,
} = {}) {
  if (hasError) return "error";
  if (isUnavailable) return "unavailable";
  if (isLoading) return "loading";
  if (!hasPrerequisite) return "blocked";
  if (!isConfigured) return "initial";
  if (!hasResults) return "empty";
  return "ready";
}

/**
 * Guard whether a control should be rendered in the current workflow state.
 * Hides controls that have no valid role in the current state (T5.5).
 * @param {string} state Current workflow state
 * @param {"action"|"navigation"|"recovery"|"results-filter"|"status"} controlRole Role of the control
 * @returns {boolean}
 */
export function shouldRenderControl(state, controlRole) {
  if (state === "error" || state === "unavailable") {
    return controlRole === "recovery" || controlRole === "status" || controlRole === "navigation";
  }
  if (state === "loading") {
    return controlRole === "status" || controlRole === "navigation";
  }
  if (state === "initial" && controlRole === "results-filter") {
    return false;
  }
  return true;
}

/**
 * Standard guard determining whether a control should be disabled.
 * Disabled only when purpose is clear, prerequisite is visible, and completion is possible (T5.6).
 * @param {Object} options
 * @param {boolean} [options.isActionable] Whether the action is ready to execute
 * @param {boolean} [options.hasVisiblePrerequisite] Whether prerequisite is visible
 * @param {boolean} [options.canComplete] Whether completion is currently possible
 * @returns {boolean}
 */
export function shouldDisableControl({
  isActionable = false,
  hasVisiblePrerequisite = true,
  canComplete = true,
} = {}) {
  // If prerequisite is not visible or completion is impossible, hide rather than disable
  if (!hasVisiblePrerequisite || !canComplete) return false;
  return !isActionable;
}

/**
 * Standard dependent selector filter (T5.7).
 * Ensures upstream choices filter downstream options before rendering them.
 * @template T
 * @param {T[]} options
 * @param {(option: T) => boolean} predicate
 * @returns {T[]}
 */
export function filterDependentOptions(options, predicate) {
  if (!Array.isArray(options)) return [];
  if (typeof predicate !== "function") return options;
  return options.filter(predicate);
}
