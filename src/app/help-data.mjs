export const helpSurfaces = [
  {
    view: "start-here",
    title: "Start here",
    body: "Answer two questions to get a starting point in the public material.",
    actionLabel: "Open Start here",
  },
  {
    view: "atlas-map",
    title: "Atlas",
    body: "Follow the publisher's organization separately from cited mappings, applicability selections, and process relationships.",
    actionLabel: "Open Atlas",
  },
  {
    // Internal view key stays "search"; search results are a state of Library.
    view: "search",
    title: "Library",
    body: "Search by control ID or topic, or browse the publications records come from.",
    actionLabel: "Open Library",
  },
  {
    view: "matrix",
    title: "Compare",
    body: "Pick a comparison type, name the published structures and mapping source, then review cited results.",
    actionLabel: "Open Compare",
  },
  {
    // Internal view key stays "patterns"; nav label renamed to Learn.
    view: "patterns",
    title: "Guides",
    body: "Practitioner guides for authorization, control selection, assessment, findings, and monitoring.",
    actionLabel: "Open Guides",
  },
  {
    // Internal view key stays "templates"; nav label renamed to Build
    // (Commons folded in — see W4).
    view: "templates",
    title: "Documents",
    body: "Create starter RMF and ATO documents in your browser. Nothing you type is uploaded.",
    actionLabel: "Open Documents",
  },
  {
    view: "sources",
    title: "Sources",
    body: "Review the public source documents, versions, and provenance behind every mapping in the library.",
    actionLabel: "Open Sources",
  },
  {
    view: "about",
    title: "About",
    body: "What Control Atlas contains, how it is organized, and where it stops.",
    actionLabel: "Open About",
  },
  {
    view: "library-detail",
    title: "Relationship list view",
    body: "On any record or map view, switch to List for a screen-reader-friendly table of every connection.",
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
