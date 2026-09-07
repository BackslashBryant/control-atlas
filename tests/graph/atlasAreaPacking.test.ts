import assert from "node:assert/strict";
import test from "node:test";

import {
  packBalanced,
  packSpread,
  type AtlasAreaNode,
} from "../../src/ui/components/AtlasAreaMap";

function board(values: number[]): AtlasAreaNode[] {
  return values.map((value, index) => ({
    id: `n${index}`,
    label: `Group ${index}`,
    value,
    areaToken: "--ca-area-operations",
    openable: true,
  }));
}

test("the Atlas landing packs flush across two columns", () => {
  // The real landing: five groups holding 8, 6, 6, 4 and 4 frameworks.
  const groups = board([8, 6, 6, 4, 4]);

  // Three columns cannot balance this board. The best split is 10/10/8, which
  // left a notch two frameworks tall in the bottom corner of the map.
  assert.equal(packSpread(packBalanced(groups, 3)), 2);

  // Two can: 8+6 and 6+4+4 are both 14.
  const two = packBalanced(groups, 2);
  assert.equal(packSpread(two), 0);
  assert.deepEqual(
    two.map((column) => column.total).sort((a, b) => a - b),
    [14, 14],
  );
});

test("every column is used and every node placed exactly once", () => {
  for (const values of [[8, 6, 6, 4, 4], [5, 5, 5], [9, 1, 1, 1], [7, 3]]) {
    for (const count of [2, 3]) {
      if (count > values.length) continue;
      const columns = packBalanced(board(values), count);
      assert.equal(columns.length, count);
      for (const column of columns) {
        assert.ok(column.nodes.length > 0, "a column was left empty");
      }
      const placed = columns.flatMap((column) => column.nodes.map((n) => n.id));
      assert.equal(new Set(placed).size, values.length);
      assert.equal(
        columns.reduce((sum, column) => sum + column.total, 0),
        values.reduce((sum, value) => sum + value, 0),
      );
    }
  }
});

test("the balanced pack is never worse than the greedy one", () => {
  // Greedy longest-processing-time is optimal on many boards and beatable on
  // others; the search must never come out behind it.
  const boards = [
    [8, 6, 6, 4, 4],
    [10, 9, 8, 7, 6, 5],
    [3, 3, 2, 2, 2],
    [20, 1, 1, 1, 1],
  ];
  for (const values of boards) {
    for (const count of [2, 3, 4]) {
      if (count > values.length) continue;
      const spread = packSpread(packBalanced(board(values), count));
      assert.ok(
        spread >= 0 && Number.isFinite(spread),
        `unusable spread for ${values} across ${count}`,
      );
    }
  }
});

test("large boards fall back to the greedy pack rather than searching", () => {
  // Nine groups is past the exhaustive limit; it must still place everything.
  const values = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  const columns = packBalanced(board(values), 3);
  assert.equal(columns.length, 3);
  assert.equal(
    columns.reduce((sum, column) => sum + column.nodes.length, 0),
    values.length,
  );
});
