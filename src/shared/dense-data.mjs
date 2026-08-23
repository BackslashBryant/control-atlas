/**
 * Dense-data composition contract (P2-05, P2-11).
 *
 * Governs how the product renders large datasets across surfaces.
 * Every dense-data surface should consult these thresholds rather than
 * inventing ad-hoc limits.
 *
 * The ladder: summarize → disclose → group → paginate → export.
 * Show a bounded summary first. Disclose detail on request. Group
 * related items with capped visible members. Paginate or window when
 * the group count itself is large. Hand off to export (CSV, XLSX)
 * when the dataset exceeds what a browser viewport can make useful.
 */

/** Maximum items to show before requiring disclosure or pagination. */
export const VISIBLE_GROUP_LIMIT = 10;

/** Maximum cross-reference identifiers in a single cell. */
export const CROSS_REF_CAP = 5;

/** Maximum table rows before suggesting export over in-page browsing. */
export const EXPORT_HANDOFF_THRESHOLD = 500;

/** Mobile breakpoint below which tables transform to stacked registers. */
export const MOBILE_REGISTER_BREAKPOINT = 768;

/**
 * Cap a list of items for display, returning the visible slice and overflow count.
 * @template T
 * @param {T[]} items
 * @param {number} [limit]
 * @returns {{ visible: T[], overflow: number }}
 */
export function cappedItems(items, limit = VISIBLE_GROUP_LIMIT) {
  if (items.length <= limit) return { visible: items, overflow: 0 };
  return { visible: items.slice(0, limit), overflow: items.length - limit };
}
