export const helpSurfaces = [
  {
    view: "start-here",
    title: "Start Here",
    body: "Answer three short questions, then open the recommended library, compare, pattern, and template links.",
    actionLabel: "Open Start Here",
  },
  {
    view: "atlas-map",
    title: "Explore",
    body: "See the graph of how controls, baselines, CCIs, STIGs, and other requirements connect. Focus a control to see what implementing it also satisfies.",
    actionLabel: "Open Explore",
  },
  {
    // Renamed from "Explore" so it no longer shares a name with the
    // atlas-map nav item, now itself called Explore (see PLAN CHANGE in
    // docs/STATE.md). Internal view key stays "search".
    view: "search",
    title: "Search Results",
    body: "Search by control ID or topic. Open records to see grouped connections and source support.",
    actionLabel: "Open Search Results",
  },
  {
    view: "matrix",
    title: "Compare",
    body: "Pick a comparison intent first, set frameworks, then review results before exporting or opening detailed mappings.",
    actionLabel: "Open Compare",
  },
  {
    // Internal view key stays "patterns"; nav label renamed to Learn.
    view: "patterns",
    title: "Learn",
    body: "Plain-language guides for recurring compliance problems like inheritance, reciprocity, and evidence reuse.",
    actionLabel: "Open Learn",
  },
  {
    // Internal view key stays "templates"; nav label renamed to Build
    // (Commons folded in — see W4).
    view: "templates",
    title: "Build",
    body: "Download starter RMF and ATO documents, official artifacts, tools, and community resources in your browser. Nothing you type is uploaded or stored.",
    actionLabel: "Open Build",
  },
  {
    view: "sources",
    title: "Sources",
    body: "Review the public source documents, versions, and provenance behind every mapping in the library.",
    actionLabel: "Open Sources",
  },
  {
    view: "about",
    title: "About & trust",
    body: "Understand what Control Atlas is (and isn't): an open-source reference tool, not an official government system.",
    actionLabel: "Open About",
  },
  {
    view: "library-detail",
    title: "Relationship list view",
    body: "On any record or map view, switch to List for a full screen-reader-friendly table of every connection with rationale columns. Deep links can include relationshipView=list.",
    actionLabel: "Open Search Results",
  },
];
