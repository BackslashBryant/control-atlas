import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPARE_PAGE_SIZE,
  paginateCompareRows,
} from "../../src/ui/lib/comparePagination";
import { parseHashLocation, serializeHashLocation } from "../../src/ui/lib/hashRoutes";

test("Compare uses fixed 100-row windows that replace rather than accumulate", () => {
  const rows = Array.from({ length: 250 }, (_, index) => `row-${index + 1}`);
  const first = paginateCompareRows(rows, "");
  const second = paginateCompareRows(rows, "2");
  const last = paginateCompareRows(rows, "3");

  assert.equal(COMPARE_PAGE_SIZE, 100);
  assert.deepEqual(first.rows, rows.slice(0, 100));
  assert.deepEqual(second.rows, rows.slice(100, 200));
  assert.deepEqual(last.rows, rows.slice(200, 250));
  assert.deepEqual(
    [second.start, second.end, second.page, second.pageCount, second.valid],
    [101, 200, 2, 3, true],
  );
});

test("Compare reports invalid page requests while showing the nearest bounded window", () => {
  const rows = Array.from({ length: 250 }, (_, index) => index + 1);
  assert.deepEqual(
    paginateCompareRows(rows, "999"),
    {
      end: 250,
      page: 3,
      pageCount: 3,
      requestedPage: "999",
      rows: rows.slice(200),
      start: 201,
      valid: false,
    },
  );
  assert.equal(paginateCompareRows(rows, "not-a-page").page, 1);
  assert.equal(paginateCompareRows(rows, "not-a-page").valid, false);
});

test("Compare page state round-trips through the public hash URL", () => {
  const state = parseHashLocation(
    "/compare/relationships",
    "?intent=frameworks&source=nist-800-53&target=disa-cci&compareRun=true&page=2",
  );
  assert.equal(state.view, "matrix");
  if (state.view !== "matrix") return;
  assert.equal(state.page, "2");
  assert.equal(
    serializeHashLocation(state),
    "/compare/relationships?source=nist-800-53&target=disa-cci&intent=frameworks&compareRun=true&page=2",
  );
});
