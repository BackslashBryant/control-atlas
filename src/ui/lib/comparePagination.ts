export const COMPARE_PAGE_SIZE = 100;

export type ComparePageWindow<T> = {
  end: number;
  page: number;
  pageCount: number;
  requestedPage: string;
  rows: T[];
  start: number;
  valid: boolean;
};

function parseRequestedPage(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export function paginateCompareRows<T>(
  rows: readonly T[],
  requestedPage: string,
): ComparePageWindow<T> {
  const pageCount = Math.max(1, Math.ceil(rows.length / COMPARE_PAGE_SIZE));
  const parsedPage = requestedPage ? parseRequestedPage(requestedPage) : 1;
  const valid = parsedPage !== null && parsedPage <= pageCount;
  const page = Math.min(parsedPage || 1, pageCount);
  const startIndex = (page - 1) * COMPARE_PAGE_SIZE;
  const pageRows = rows.slice(startIndex, startIndex + COMPARE_PAGE_SIZE);

  return {
    end: pageRows.length ? startIndex + pageRows.length : 0,
    page,
    pageCount,
    requestedPage,
    rows: pageRows,
    start: pageRows.length ? startIndex + 1 : 0,
    valid,
  };
}
