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
  { word: "Filter", surface: "search" },
  { word: "Inspect", surface: "sources" },
  { word: "Crosswalk", surface: "compare" },
  { word: "Cite", surface: "sources" },
  { word: "Source", surface: "sources" },
  { word: "Build", surface: "build" },
  { word: "Export", surface: "build" },
  { word: "Document", surface: "build" },
  { word: "Reconcile", surface: "compare" },
  { word: "Navigate", surface: "atlas" },
  { word: "Learn", surface: "learn" },
] as const;

export const BRAND_WORDS = BRAND_ACTIONS.map(({ word }) => word);

export const BRAND_ROTATION_INTERVAL_MS = 2400;
export const BRAND_ROTATION_TRANSITION_MS = 320;

export const LONGEST_BRAND_WORD = BRAND_WORDS.reduce((longest, word) =>
  word.length > longest.length ? word : longest,
);
