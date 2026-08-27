import { spawnSync } from "node:child_process";
import process from "node:process";

function processLabel(command, args, label) {
  if (label) return label;
  return [command, ...args].join(" ");
}

export function runProcessSync(command, args = [], options = {}) {
  const { label, ...spawnOptions } = options;
  const displayLabel = processLabel(command, args, label);
  const result = spawnSync(command, args, {
    ...spawnOptions,
    shell: false,
  });

  if (result.error) {
    const errorCode = "code" in result.error ? String(result.error.code) : "";
    const code = errorCode ? ` (${errorCode})` : "";
    throw new Error(`${displayLabel} could not start${code}: ${result.error.message}`, {
      cause: result.error,
    });
  }
  if (result.signal) {
    throw new Error(`${displayLabel} terminated from signal ${result.signal}`);
  }
  if (typeof result.status !== "number") {
    throw new Error(`${displayLabel} ended without an exit status`);
  }
  if (result.status !== 0) {
    throw new Error(`${displayLabel} failed with exit ${result.status}`);
  }

  return result;
}

export function runNodeSync(args, options = {}) {
  return runProcessSync(process.execPath, args, {
    label: "Node process",
    ...options,
  });
}

export function runNpmScriptSync(script, args = [], options = {}) {
  const {
    npmExecPath = options.env?.npm_execpath ?? process.env.npm_execpath,
    ...spawnOptions
  } = options;
  if (!npmExecPath) {
    throw new Error(
      `npm run ${script} cannot start because npm_execpath is unavailable; invoke the parent command through npm`,
    );
  }
  return runNodeSync([npmExecPath, "run", script, ...args], {
    label: `npm run ${script}`,
    ...spawnOptions,
  });
}
