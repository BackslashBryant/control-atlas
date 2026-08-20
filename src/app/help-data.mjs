import { SITE_COPY } from "../shared/site-copy.mjs";

export const helpSurfaces = [
  {
    view: "start-here",
    title: "Start here",
    body: SITE_COPY.routes.start.purpose,
    actionLabel: "Open Start here",
  },
  {
    view: "atlas-map",
    title: "Atlas",
    body: SITE_COPY.routes.atlas.purpose,
    actionLabel: "Open Atlas",
  },
  {
    // Internal view key stays "search"; search results are a state of Library.
    view: "search",
    title: "Library",
    body: SITE_COPY.routes.library.purpose,
    actionLabel: "Open Library",
  },
  {
    view: "matrix",
    title: "Compare",
    body: SITE_COPY.routes.compare.purpose,
    actionLabel: "Open Compare",
  },
  {
    // Internal view key stays "patterns"; nav label renamed to Learn.
    view: "patterns",
    title: "Guides",
    body: SITE_COPY.routes.guides.purpose,
    actionLabel: "Open Guides",
  },
  {
    // Internal view key stays "templates" and the legacy /build path remains
    // accepted while the public destination is named Templates.
    view: "templates",
    title: "Templates",
    body: SITE_COPY.routes.documents.purpose,
    actionLabel: "Open Templates",
  },
  {
    view: "sources",
    title: "Sources",
    body: SITE_COPY.routes.sources.purpose,
    actionLabel: "Open Sources",
  },
  {
    view: "about",
    title: "About",
    body: SITE_COPY.routes.about.purpose,
    actionLabel: "Open About",
  },
  {
    view: "library-detail",
    title: "Connection list",
    body: "Use See connections on a record, then open List for a screen-reader-friendly table.",
    actionLabel: "Open Library",
  },
];

// Keyboard shortcuts belong here, not on About. The Ctrl+Alt entry describes
// the header keycap, which rotates: the letter is always the first letter of
// the word currently showing (see src/shared/brand-rotation.ts).
export const helpShortcuts = [
  { keys: "Ctrl + K", action: "Open search" },
  {
    keys: "Ctrl + Alt + first letter",
    action: "Open the section named on the keyboard shortcut",
  },
  { keys: "Esc", action: "Close a dialog, drawer, or menu" },
];
