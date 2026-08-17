import {
  UI_WORKFLOW_STATES,
  resolveWorkflowState,
  shouldRenderControl,
  shouldDisableControl,
  filterDependentOptions,
} from "../../shared/state-contract.mjs";

export type UIWorkflowState =
  | "initial"
  | "loading"
  | "ready"
  | "empty"
  | "blocked"
  | "unavailable"
  | "error";

export {
  UI_WORKFLOW_STATES,
  resolveWorkflowState,
  shouldRenderControl,
  shouldDisableControl,
  filterDependentOptions,
};
