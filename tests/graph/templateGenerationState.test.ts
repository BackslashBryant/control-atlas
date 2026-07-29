import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTemplateGenerationSnapshot,
  resolveTemplateGenerationState,
} from "../../src/ui/lib/templateGenerationState";

const template = {
  name: "security_plan_starter",
  input_options: ["framework", "baseline"],
  required_input_options: ["baseline"],
  supported_formats: ["docx"],
};

test("an unselected required baseline fails closed without choosing Moderate", () => {
  const snapshot = buildTemplateGenerationSnapshot({
    template,
    routeState: { framework: "nist-800-53", baseline: "", format: "docx" },
  });

  assert.equal(snapshot.options.baseline, "");
  assert.equal(snapshot.validation.valid, false);
  assert.deepEqual(snapshot.validation.missing, ["baseline"]);
});

test("an optional omitted baseline remains omitted", () => {
  const snapshot = buildTemplateGenerationSnapshot({
    template: { ...template, required_input_options: [] },
    routeState: { framework: "nist-800-53", baseline: "", format: "docx" },
  });

  assert.equal(snapshot.options.baseline, "");
  assert.equal(snapshot.validation.valid, true);
});

test("an invalid baseline fails closed instead of producing a preview or download", () => {
  const snapshot = buildTemplateGenerationSnapshot({
    template,
    routeState: {
      framework: "nist-800-53",
      baseline: "NOT-A-PUBLISHED-BASELINE",
      format: "docx",
    },
    selectionOptions: {
      framework: ["nist-800-53", "fedramp-rev5"],
      baseline: ["ALL", "LOW", "MODERATE", "HIGH"],
    },
  });
  const state = resolveTemplateGenerationState(snapshot, {
    preview: { doc: { title: "must not be exposed" } },
  });

  assert.equal(snapshot.validation.valid, false);
  assert.deepEqual(snapshot.validation.invalid, ["baseline"]);
  assert.equal(state.previewAvailable, false);
  assert.equal(state.downloadEnabled, false);
  assert.match(state.status, /invalid inputs: baseline/i);
});

test("preview, status, and download share one validated snapshot state", () => {
  const snapshot = buildTemplateGenerationSnapshot({
    template,
    routeState: {
      framework: "nist-800-53",
      baseline: "MODERATE",
      format: "docx",
    },
  });
  const ready = resolveTemplateGenerationState(snapshot, {
    preview: { doc: { title: "Preview" } },
  });
  assert.equal(ready.previewAvailable, true);
  assert.equal(ready.downloadEnabled, true);
  assert.equal(ready.snapshotId, snapshot.id);

  const failed = resolveTemplateGenerationState(snapshot, {
    preview: null,
    error: "generation failed",
  });
  assert.equal(failed.previewAvailable, false);
  assert.equal(failed.downloadEnabled, false);
  assert.equal(failed.snapshotId, snapshot.id);
  assert.match(failed.status, /generation failed/i);
});
