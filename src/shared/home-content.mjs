export const HOME_CONTENT = Object.freeze({
  eyebrow: "Federal cybersecurity, connected",
  headline: "See the landscape. Trace the source. Move the work forward.",
  definition:
    "Control Atlas brings the federal cybersecurity landscape together in one place—requirements, frameworks, controls, mappings, official guidance, tools, and practitioner resources—so you can see what applies, understand how it connects, and get to the next step faster.",
  support:
    "Start with the whole ecosystem, search the official corpus, or go directly to the practical resources that help you do the work.",
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
  {
    id: "start",
    label: "Start with your work",
    description: "Tell Control Atlas what you are trying to do and get a focused next step.",
    view: "start-here",
    href: "#/start",
  },
]);

export const HOME_AUTHORITY_GROUPS = Object.freeze([
  "Law & regulation",
  "Policy & directives",
  "Standards & guidance",
]);

export const HOME_ATLAS_AREAS = Object.freeze([
  "Governance",
  "Risk",
  "Compliance",
  "Architecture",
  "Implementation",
  "Assessment",
  "Operations",
  "Threats & defense",
  "Knowledge",
]);
