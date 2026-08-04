import assert from "node:assert/strict";
import test from "node:test";

import {
  formatRecordTitle,
  recordDisplayTitle,
} from "../../src/ui/lib/recordTitle";

test("shared record titles do not repeat leading official identifiers", () => {
  assert.equal(
    formatRecordTitle("T1195.002", "T1195.002 COMPROMISE SOFTWARE SUPPLY CHAIN"),
    "T1195.002 COMPROMISE SOFTWARE SUPPLY CHAIN",
  );
  assert.equal(
    formatRecordTitle("SV-230221r991565_rule", "SV-230221r991565_rule — Account policy"),
    "SV-230221r991565_rule — Account policy",
  );
  assert.equal(
    formatRecordTitle("CCI-000001", "cci-000001 Cryptographic protection"),
    "cci-000001 Cryptographic protection",
  );
  assert.equal(
    formatRecordTitle("AC-2", "Account Management"),
    "AC-2 — Account Management",
  );
});

test("shared record titles preserve legitimate later identifier references", () => {
  assert.equal(
    formatRecordTitle("AC-2", "Account Management for AC-2 implementations"),
    "AC-2 — Account Management for AC-2 implementations",
  );
  assert.equal(
    recordDisplayTitle({
      id: "nist-800-53:AC-2",
      node_type: "control",
      metadata: { item_id: "AC-2", title: "Account Management" },
    }),
    "AC-2 — Account Management",
  );
});
