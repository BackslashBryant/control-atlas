import assert from "node:assert/strict";
import test from "node:test";

import { resolveAtlasSearchTransition } from "../../src/ui/lib/atlasSearch";

const documents = [
  {
    id: "nist-800-53:AC-2",
    item_id: "AC-2",
    title: "Account Management",
  },
  {
    id: "nist-800-53:AU-2",
    item_id: "AU-2",
    title: "Event Logging",
  },
];

function runtime(results: typeof documents) {
  return {
    searchLibrary: () => results,
  };
}

test("CA-ATL-003: exact unique Atlas identifiers open the focused record", () => {
  assert.deepEqual(resolveAtlasSearchTransition(runtime(documents), "ac-2"), {
    kind: "focus",
    nodeId: "nist-800-53:AC-2",
    query: "ac-2",
    announcement: "Opening AC-2 in the focused Atlas.",
  });
});

test("CA-ATL-003: a qualified corpus ID resolves one otherwise ambiguous identifier", () => {
  const duplicatedItemId = [
    documents[0],
    {
      id: "nist-800-53a:AC-2",
      item_id: "AC-2",
      title: "Account Management Assessment Procedure",
    },
  ];
  assert.deepEqual(
    resolveAtlasSearchTransition(
      runtime(duplicatedItemId),
      "nist-800-53:AC-2",
    ),
    {
      kind: "focus",
      nodeId: "nist-800-53:AC-2",
      query: "nist-800-53:AC-2",
      announcement: "Opening AC-2 in the focused Atlas.",
    },
  );
});

test("CA-ATL-003: an item ID shared by publications fails closed to Search", () => {
  const duplicatedItemId = [
    documents[0],
    {
      id: "nist-800-53a:AC-2",
      item_id: "AC-2",
      title: "Account Management Assessment Procedure",
    },
  ];
  assert.equal(
    resolveAtlasSearchTransition(runtime(duplicatedItemId), "AC-2").kind,
    "search",
  );
});

test("CA-ATL-003: ambiguous text hands off to existing universal search", () => {
  assert.deepEqual(
    resolveAtlasSearchTransition(runtime(documents), "account"),
    {
      kind: "search",
      query: "account",
      announcement: "Showing search results for account.",
    },
  );
});

test("CA-ATL-003: no-match search stays local with announced recovery", () => {
  assert.deepEqual(resolveAtlasSearchTransition(runtime([]), "zzzzqqqq"), {
    kind: "no-match",
    query: "zzzzqqqq",
    announcement:
      "No Atlas record matches zzzzqqqq. Try Search or browse the Library.",
  });
});
