export const helpSurfaces = [
  {
    view: "start-here",
    title: "Start Here",
    body: "Open a publication already represented in Control Atlas, or search all records if you are not sure where to begin.",
    actionLabel: "Open Start Here",
  },
  {
    view: "atlas-map",
    title: "Explore",
    body: "Trace publisher-declared structure separately from cited mappings, applicability selections, and process relationships.",
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
    body: "Pick a comparison type, name the published structures and mapping source, then review cited results.",
    actionLabel: "Open Compare",
  },
  {
    // Internal view key stays "patterns"; nav label renamed to Learn.
    view: "patterns",
    title: "Learn",
    body: "Control Atlas explanations for source identity, hierarchy, mappings, records, Search, and starter documents.",
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
    body: "See how Control Atlas handles sources, product notes, and decisions—and where the workbench stops.",
    actionLabel: "Open About",
  },
  {
    view: "library-detail",
    title: "Relationship list view",
    body: "On any record or map view, switch to List for a full screen-reader-friendly table of every connection with rationale columns. Deep links can include relationshipView=list.",
    actionLabel: "Open Search Results",
  },
];
