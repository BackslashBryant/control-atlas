export const BRAND_ACTIONS = [
  { word: "Trace", surface: "sources" },
  { word: "Find", surface: "search" },
  { word: "Search", surface: "search" },
  { word: "Browse", surface: "catalogs" },
  { word: "Read", surface: "catalogs" },
  { word: "Explore", surface: "atlas" },
  { word: "Map", surface: "atlas" },
  { word: "Compare", surface: "compare" },
  { word: "Connect", surface: "atlas" },
  { word: "Relate", surface: "atlas" },
  { word: "Filter", surface: "search" },
  { word: "Inspect", surface: "sources" },
  { word: "Crosswalk", surface: "compare" },
  { word: "Verify", surface: "sources" },
  { word: "Cite", surface: "sources" },
  { word: "Source", surface: "sources" },
  { word: "Build", surface: "build" },
  { word: "Create", surface: "build" },
  { word: "Preview", surface: "build" },
  { word: "Download", surface: "build" },
  { word: "Export", surface: "build" },
  { word: "Document", surface: "build" },
  { word: "Reconcile", surface: "compare" },
  { word: "Navigate", surface: "atlas" },
  { word: "Learn", surface: "learn" },
  { word: "Share", surface: "compare" },
  { word: "Recover", surface: "search" },
] as const;

export const BRAND_WORDS = BRAND_ACTIONS.map(({ word }) => word);

export const BRAND_ROTATION_INTERVAL_MS = 2400;
export const BRAND_ROTATION_TRANSITION_MS = 320;
export const BRAND_ROTATION_SETTLE_MS = 8000;

export const LONGEST_BRAND_WORD = BRAND_WORDS.reduce((longest, word) =>
  word.length > longest.length ? word : longest,
);
