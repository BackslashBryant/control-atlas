export const HOME_CONTENT = Object.freeze({
  eyebrow: "Federal cybersecurity, connected",
  headline: "Federal cybersecurity requirements, sources, and how they connect.",
  definition:
    "Search official requirements and controls, see how they map across frameworks, and open the source.",
  searchPlaceholder:
    "Search requirements, controls, guidance, tools, or communities…",
  trust:
    "Official material stays source-traceable. Control Atlas explanations, derived connections, and practitioner resources are labeled separately.",
});

export const HOME_DESTINATIONS = Object.freeze([
  {
    id: "atlas",
    label: "Explore the Atlas",
    description: "See the ecosystem, then drill from an area to a publication, family, or record.",
    view: "atlas-map",
    href: "#/atlas",
  },
  {
    id: "library",
    label: "Search the Library",
    description: "Find official requirements, frameworks, controls, mappings, and guidance.",
    view: "search",
    href: "#/library",
  },
  {
    id: "resources",
    label: "Browse Resources",
    description: "Find tools, templates, portals, training, and practitioner communities.",
    view: "commons",
    href: "#/resources",
  },
]);
