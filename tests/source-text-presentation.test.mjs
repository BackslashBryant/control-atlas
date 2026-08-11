import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSourceTextPresentation,
  isValidSourceTextPresentation,
} from "../src/shared/source-text-presentation.mjs";

test("source text presentation preserves explicit procedures and shell snippets", () => {
  const text = [
    "1. Open the configuration file.",
    "2. Set the required value.",
    "# systemctl restart rsyslog",
  ].join("\n");
  const presentation = buildSourceTextPresentation(text);

  assert.deepEqual(presentation, {
    version: 1,
    blocks: [
      { kind: "list", ordered: true, items: [{ start: 3, end: 31 }, { start: 35, end: 58 }] },
      { kind: "code", start: 59, end: 86, language: "shell" },
    ],
  });
  assert.equal(isValidSourceTextPresentation(text, presentation), true);
});

test("source text presentation extracts an inline command without rewriting surrounding text", () => {
  const text = "At the command prompt, run the following command: # rpm -V package | grep bad If the command returns output, this is a finding.";
  const presentation = buildSourceTextPresentation(text);
  const code = presentation.blocks.find((block) => block.kind === "code");

  assert.equal(text.slice(code.start, code.end), "# rpm -V package | grep bad");
  assert.equal(isValidSourceTextPresentation(text, presentation), true);
});

test("source text presentation extracts clear inline file procedures and configuration", () => {
  const text = "Navigate to and open: /etc/example.conf Create the file if it does not exist. Set the contents of the file as follows: # example configuration input(type=\"imfile\")";
  const presentation = buildSourceTextPresentation(text);
  const list = presentation.blocks.find((block) => block.kind === "list");
  const code = presentation.blocks.find((block) => block.kind === "code");

  assert.equal(list.ordered, false);
  assert.equal(list.items.length, 3);
  assert.equal(text.slice(code.start, code.end), "# example configuration input(type=\"imfile\")");
  assert.equal(isValidSourceTextPresentation(text, presentation), true);
});

test("source text presentation leaves ambiguous prose as a paragraph", () => {
  const text = "Configure the service according to local policy and verify the result.";
  assert.deepEqual(buildSourceTextPresentation(text), {
    version: 1,
    blocks: [{ kind: "paragraph", start: 0, end: text.length }],
  });
});
