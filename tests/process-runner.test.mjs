import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  runNodeSync,
  runNpmScriptSync,
  runProcessSync,
} from "../tools/lib/process-runner.mjs";

function withFixtureDirectory(callback) {
  const directory = mkdtempSync(join(tmpdir(), "control atlas process runner "));
  try {
    return callback(directory);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

test("runNodeSync executes scripts whose paths contain spaces without a shell", () => {
  withFixtureDirectory((directory) => {
    const fixture = join(directory, "successful child.mjs");
    writeFileSync(fixture, 'process.stdout.write(JSON.stringify(process.argv.slice(2)));\n');

    const result = runNodeSync([fixture, "argument with spaces"], {
      encoding: "utf8",
      stdio: "pipe",
    });

    assert.deepEqual(JSON.parse(result.stdout), ["argument with spaces"]);
  });
});

test("runNpmScriptSync launches npm's JavaScript CLI through Node", () => {
  withFixtureDirectory((directory) => {
    const npmFixture = join(directory, "npm cli fixture.mjs");
    writeFileSync(npmFixture, 'process.stdout.write(JSON.stringify(process.argv.slice(2)));\n');

    const result = runNpmScriptSync("generate:data", ["--", "fixture argument"], {
      encoding: "utf8",
      npmExecPath: npmFixture,
      stdio: "pipe",
    });

    assert.deepEqual(JSON.parse(result.stdout), [
      "run",
      "generate:data",
      "--",
      "fixture argument",
    ]);
  });
});

test("runNodeSync reports non-zero child exits", () => {
  assert.throws(
    () => runNodeSync(["--eval", "process.exit(7)"], { stdio: "pipe" }),
    /Node process failed with exit 7/,
  );
});

test("runProcessSync reports spawn failures instead of masking a null status", () => {
  assert.throws(
    () => runProcessSync("control-atlas-command-that-does-not-exist", [], { stdio: "pipe" }),
    /could not start \(ENOENT\)/,
  );
});
