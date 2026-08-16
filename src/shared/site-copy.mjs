export const SITE_COPY = Object.freeze({
  product: Object.freeze({
    definition:
      "Control Atlas is a public research tool for federal cybersecurity requirements, controls, techniques, and guidance.",
    boundary:
      "Use Control Atlas for research, not compliance or authorization decisions.",
    footer: "Free and open source. Not a government system.",
    searchPlaceholder: "Search by topic, title, or identifier.",
  }),
  home: Object.freeze({
    headline: "Make federal cybersecurity compliance make sense.",
    definition:
      "Understand what applies, what it means, and what to do next.",
    // Depth-0 Signal cover (first paint, before the Home surface).
    cover: Object.freeze({
      wordmark: "CONTROL ATLAS",
      tagline:
        "Understand what applies, what it means, and what to do next.",
      prompt: "Click anywhere or press Enter to start",
      stats: Object.freeze([
        Object.freeze({
          value: "Federal-wide",
          label: "coverage",
          detail: "NIST · DISA · FedRAMP · MITRE · CISA",
        }),
        Object.freeze({
          value: "Cross-mapped",
          label: "requirements, controls & techniques",
          detail: "",
        }),
      ]),
      freshnessLabel: "source data current",
    }),
    destinations: Object.freeze([
      Object.freeze({
        id: "atlas",
        label: "Browse the Atlas",
        description: "Start with a topic.",
        view: "atlas-map",
        href: "#/atlas",
      }),
      Object.freeze({
        id: "library",
        label: "Search the Library",
        description: "Find a specific record.",
        view: "search",
        href: "#/library",
      }),
      Object.freeze({
        id: "resources",
        label: "Browse Resources",
        description: "Find tools, training, and guidance.",
        view: "commons",
        href: "#/resources",
      }),
    ]),
  }),
  routes: Object.freeze({
    atlas: Object.freeze({
      title: "Atlas",
      purpose: "Start with a topic and work toward the details.",
    }),
    library: Object.freeze({
      title: "Library",
      purpose: "Search by identifier, title, or topic.",
    }),
    resources: Object.freeze({
      title: "Resources",
      purpose:
        "Find tools, training, and guidance for federal cybersecurity work.",
    }),
    guides: Object.freeze({
      title: "Guides",
      purpose:
        "Follow step-by-step guidance for common federal cybersecurity work.",
    }),
    compare: Object.freeze({
      title: "Compare",
      purpose: "Compare frameworks and related records.",
    }),
    documents: Object.freeze({
      title: "Documents",
      purpose: "Choose what you need to produce.",
    }),
    sources: Object.freeze({
      title: "Sources",
      purpose: "Check publication ownership, version, and update status.",
    }),
    about: Object.freeze({
      title: "About",
      purpose: "Learn what Control Atlas covers and where its limits are.",
    }),
    start: Object.freeze({
      title: "Start here",
      purpose: "Not sure where to begin? Start here.",
    }),
  }),
});

export const FIRST_PAINT_ROUTE_COPY = Object.freeze({
  atlas: Object.freeze({ eyebrow: "Atlas", summary: SITE_COPY.routes.atlas.purpose, title: SITE_COPY.routes.atlas.title }),
  library: Object.freeze({ eyebrow: "Library", summary: SITE_COPY.routes.library.purpose, title: SITE_COPY.routes.library.title }),
  record: Object.freeze({ eyebrow: "Record", summary: "Read the published text and record details.", title: "Record" }),
  compare: Object.freeze({ eyebrow: "Compare", summary: SITE_COPY.routes.compare.purpose, title: SITE_COPY.routes.compare.title }),
  documents: Object.freeze({ eyebrow: "Documents", summary: SITE_COPY.routes.documents.purpose, title: SITE_COPY.routes.documents.title }),
  sources: Object.freeze({ eyebrow: "Sources", summary: SITE_COPY.routes.sources.purpose, title: SITE_COPY.routes.sources.title }),
  start: Object.freeze({ eyebrow: "Start here", summary: SITE_COPY.routes.start.purpose, title: SITE_COPY.routes.start.title }),
  guides: Object.freeze({ eyebrow: "Guides", summary: SITE_COPY.routes.guides.purpose, title: SITE_COPY.routes.guides.title }),
  about: Object.freeze({ eyebrow: "About", summary: SITE_COPY.routes.about.purpose, title: SITE_COPY.routes.about.title }),
});
