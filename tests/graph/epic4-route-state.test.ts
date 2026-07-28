import assert from "node:assert/strict";
import test from "node:test";

import { parseHashLocation, serializeHashLocation } from "../../src/ui/lib/hashRoutes";
import { canonicalizeHashLocation } from "../../src/ui/lib/routeIdentity";

test("Build task and starter-document paths round trip with query configuration", () => {
  const task = parseHashLocation("/build/tasks/build-authorization-package", "");
  assert.equal(task.view, "templates");
  assert.equal(task.task, "build-authorization-package");
  assert.equal(serializeHashLocation(task), "/build/tasks/build-authorization-package");

  const document = parseHashLocation(
    "/build/documents/security_plan_starter",
    "?format=docx&framework=nist-800-53&environment=Generic",
  );
  assert.equal(document.view, "templates");
  assert.equal(document.templateType, "security_plan_starter");
  assert.equal(
    serializeHashLocation(document),
    "/build/documents/security_plan_starter?framework=nist-800-53&format=docx&environment=Generic",
  );
});

test("Build recovery removes only the invalid configuration while retaining valid document state", () => {
  const resolved = canonicalizeHashLocation(
    "/build/documents/security_plan_starter?format=docx&framework=not-real&environment=Generic",
  );

  assert.equal(
    resolved.canonicalPath,
    "/build/documents/security_plan_starter?format=docx&environment=Generic",
  );
  assert.match(resolved.recoveryMessage, /removed|could not/i);
});
