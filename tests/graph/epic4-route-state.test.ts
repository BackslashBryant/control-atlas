import assert from "node:assert/strict";
import test from "node:test";

import { parseHashLocation, serializeHashLocation } from "../../src/ui/lib/hashRoutes";
import { canonicalizeHashLocation } from "../../src/ui/lib/routeIdentity";

test("Build task and starter-document paths round trip with query configuration", () => {
  const overview = parseHashLocation("/build", "");
  assert.equal(overview.view, "templates");
  assert.equal(overview.buildSection, "overview");
  assert.equal(serializeHashLocation(overview), "/build");

  const tasks = parseHashLocation("/build/tasks", "");
  assert.equal(tasks.view, "templates");
  assert.equal(tasks.buildSection, "tasks");
  assert.equal(serializeHashLocation(tasks), "/build/tasks");

  const task = parseHashLocation("/build/tasks/build-authorization-package", "");
  assert.equal(task.view, "templates");
  assert.equal(task.task, "build-authorization-package");
  assert.equal(serializeHashLocation(task), "/build/tasks/build-authorization-package");

  const document = parseHashLocation(
    "/build/documents/security_plan_starter",
    "?format=docx&framework=nist-800-53&category=plans&q=system",
  );
  assert.equal(document.view, "templates");
  assert.equal(document.templateType, "security_plan_starter");
  assert.equal(
    serializeHashLocation(document),
    "/build/documents/security_plan_starter?framework=nist-800-53&format=docx&category=plans&q=system",
  );
});

test("Build exposes one shared three-lane model", async () => {
  const { BUILD_LANES } = await import("../../src/ui/lib/buildRouteState");
  assert.deepEqual(
    BUILD_LANES.map((lane) => lane.id),
    ["tasks", "documents", "resources"],
  );
});

test("Build recovery removes only the invalid configuration while retaining valid document state", () => {
  const resolved = canonicalizeHashLocation(
    "/build/documents/security_plan_starter?format=docx&framework=not-real",
  );

  assert.equal(
    resolved.canonicalPath,
    "/build/documents/security_plan_starter?format=docx",
  );
  assert.match(resolved.recoveryMessage, /removed|could not/i);
});
