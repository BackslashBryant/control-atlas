export type AppView =
  | "home"
  | "atlas-map"
  | "search"
  | "catalog-detail"
  | "library-detail"
  | "matrix"
  | "patterns"
  | "templates"
  | "sources"
  | "commons"
  | "commons-detail"
  | "start-here"
  | "about"
  | "retired"
  | "not-found";

export type CompareCrosswalk =
  | "intent"
  | "relationships"
  | "stig-chain"
  | "baseline-compare"
  | "threat-chain";

export type RelationshipViewMode = "path" | "map" | "list" | "purpose" | "rmf";

export type CompareViewMode = "map" | "list";

export type ViewState =
  | { view: "home" }
  | {
      view: "atlas-map";
      node: string;
      atlasAxis: string;
      atlasLimb: string;
      atlasFramework: string;
      atlasBaseline: string;
      atlasFamily: string;
      atlasRmfStep: string;
      relationshipView: string;
      relationshipType: string;
      provenance: string;
      confidence: string;
      nodeType: string;
      includeCandidates: string;
      relationshipSearch: string;
      atlasStage: string;
      relationshipGroup: string;
      sourceView: string;
      showSupportingReferences: string;
      showDraftOrLegacy: string;
      showRegistryOnly: string;
    }
  | {
      view: "search";
      query: string;
      filter: string;
      publisher: string;
      kind: string;
      objectType: string;
      sourceClass: string;
      controlFamily: string;
      severity: string;
      connectedOnly: string;
      sort: string;
      viewMode: "list" | "map";
      collection: string;
    }
  | {
      view: "catalog-detail";
      catalog: string;
      query: string;
      family: string;
      browseAll: string;
      type: string;
      area: string;
      publisher: string;
      lifecycle: string;
      page: string;
    }
  | {
      view: "library-detail";
      node: string;
      relationshipView?: string;
      relationshipType?: string;
      provenance?: string;
      confidence?: string;
      nodeType?: string;
      includeCandidates?: string;
      relationshipSearch?: string;
    }
  | {
      view: "matrix";
      crosswalk: CompareCrosswalk;
      source: string;
      target: string;
      items: string;
      relationshipType: string;
      provenance: string;
      confidence: string;
      includeCandidates: string;
      chainCatalog: string;
      chainBenchmark: string;
      chainItem: string;
      baselineA: string;
      baselineB: string;
      intent: string;
      compareView: string;
      mappingSource: string;
      compareRun: string;
    }
  | {
      view: "patterns";
      pattern: string;
    }
  | {
      view: "templates";
      buildSection: "overview" | "tasks" | "documents";
      task: string;
      templateType: string;
      framework: string;
      format: string;
      environment: string;
      baseline: string;
      controlFamily: string;
      category: string;
      query: string;
    }
  | {
      view: "sources";
      query: string;
      source: string;
      publisher: string;
      provenance: string;
      eligibility: string;
      lifecycle: string;
      access: string;
    }
  | {
      view: "commons";
      query: string;
      lane: string;
      framework: string;
      lifecycle: string;
      audience: string;
      accessType: string;
      resourceType: string;
      category: string;
      collection: string;
      owner: string;
      costType: string;
      sort: string;
      showAll: string;
    }
  | {
      view: "commons-detail";
      id: string;
    }
  | { view: "start-here"; goal: string; context: string }
  | {
      view: "about";
    }
  | {
      view: "retired";
      query: string;
    }
  | {
      view: "not-found";
    };

function searchState(): ViewState {
  return {
    view: "search",
    query: "",
    filter: "",
    publisher: "",
    kind: "",
    objectType: "",
    sourceClass: "",
    controlFamily: "",
    severity: "",
    connectedOnly: "",
    sort: "relevance",
    viewMode: "list",
    collection: "",
  };
}

function atlasMapState(): Extract<ViewState, { view: "atlas-map" }> {
  return {
    view: "atlas-map",
    node: "",
    atlasAxis: "",
    atlasLimb: "",
    atlasFramework: "",
    atlasBaseline: "",
    atlasFamily: "",
    atlasRmfStep: "",
    relationshipView: "",
    relationshipType: "",
    provenance: "",
    confidence: "",
    nodeType: "",
    includeCandidates: "",
    relationshipSearch: "",
    atlasStage: "",
    relationshipGroup: "",
    sourceView: "default",
    showSupportingReferences: "",
    showDraftOrLegacy: "",
    showRegistryOnly: "",
  };
}

function compareState(): Extract<ViewState, { view: "matrix" }> {
  return {
    view: "matrix",
    crosswalk: "intent",
    source: "",
    target: "",
    items: "",
    relationshipType: "",
    provenance: "",
    confidence: "",
    includeCandidates: "",
    chainCatalog: "",
    chainBenchmark: "",
    chainItem: "",
    baselineA: "",
    baselineB: "",
    intent: "",
    compareView: "list",
    mappingSource: "",
    compareRun: "",
  };
}

function normalizeCompareView(value: string): CompareViewMode | "" {
  if (value === "map") return "map";
  if (value === "list") return "list";
  return "";
}

function normalizeRelationshipView(value: string): RelationshipViewMode | "" {
  if (value === "path") return "path";
  if (value === "list" || value === "table") return "list";
  if (value === "map") return "map";
  if (value === "purpose") return "purpose";
  if (value === "rmf") return "rmf";
  return "";
}

function canonicalViewParam(view: string): AppView {
  if (view === "explore") return "search";
  if (view === "playbooks") return "patterns";
  return view as AppView;
}

export function parseViewState(search: string): ViewState {
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";

  if (/^[A-Z]{3}-\d{4}-\d+$/i.test(query) || /^\d{4,}$/.test(query)) {
    return { view: "retired", query };
  }

  const rawView = params.get("view");
  const view = rawView ? canonicalViewParam(rawView) : "home";

  if (view === "home") {
    return { view: "home" };
  }

  if (view === "atlas-map") {
    return {
      view,
      node: params.get("node") || "",
      atlasAxis: params.get("atlasAxis") || "",
      atlasLimb: params.get("atlasLimb") || "",
      atlasFramework: params.get("atlasFramework") || "",
      atlasBaseline: params.get("atlasBaseline") || "",
      atlasFamily: params.get("atlasFamily") || "",
      atlasRmfStep: params.get("atlasRmfStep") || "",
      // Empty means "the default for this state" — Connections when a record
      // is focused, the board otherwise (AtlasMapPage.atlasView decides). It is
      // deliberately not forced to "path": serializing a default the user never
      // chose raced with their first click and overwrote it.
      relationshipView: normalizeRelationshipView(
        params.get("relationshipView") || "",
      ),
      relationshipType: params.get("relationshipType") || "",
      provenance: params.get("provenance") || "",
      confidence: params.get("confidence") || "",
      nodeType: params.get("type") || params.get("nodeType") || "",
      includeCandidates: params.get("includeCandidates") || "",
      relationshipSearch: params.get("relationshipSearch") || "",
      atlasStage: params.get("atlasStage") || "",
      relationshipGroup: params.get("relationshipGroup") || "",
      sourceView:
        params.get("sourceView") === "purpose" || params.get("sourceView") === "rmf"
          ? params.get("sourceView") || "default"
          : "default",
      showSupportingReferences: params.get("showSupportingReferences") || "",
      showDraftOrLegacy: params.get("showDraftOrLegacy") || "",
      showRegistryOnly: params.get("showRegistryOnly") || "",
    };
  }

  if (view === "library-detail") {
    return {
      view,
      node: params.get("node") || "",
      relationshipView: params.get("relationshipView") || "",
      relationshipType: params.get("relationshipType") || "",
      provenance: params.get("provenance") || "",
      confidence: params.get("confidence") || "",
      nodeType: params.get("nodeType") || "",
      includeCandidates: params.get("includeCandidates") || "",
      relationshipSearch: params.get("relationshipSearch") || "",
    };
  }

  if (view === "catalog-detail") {
    return {
      view,
      catalog: params.get("catalog") || params.get("framework") || "",
      query: params.get("q") || "",
      family: params.get("family") || "",
      browseAll: params.get("browseAll") === "true" ? "true" : "",
      type: params.get("type") || "",
      area: params.get("area") || "",
      publisher: params.get("publisher") || "",
      lifecycle: params.get("lifecycle") || "",
      page: params.get("page") || "",
    };
  }

  if (view === "matrix") {
    const state = compareState();
    return {
      ...state,
      crosswalk:
        ((params.get("crosswalk") || params.get("workbench")) as CompareCrosswalk) ||
        "intent",
      source: params.get("source") || "",
      target: params.get("target") || "",
      items: params.get("items") || "",
      relationshipType: params.get("relationshipType") || "",
      provenance: params.get("provenance") || "",
      confidence: params.get("confidence") || "",
      includeCandidates: params.get("includeCandidates") || "",
      chainCatalog: params.get("chainCatalog") || "",
      chainBenchmark: params.get("chainBenchmark") || "",
      chainItem: params.get("chainItem") || "",
      baselineA: params.get("baselineA") || "",
      baselineB: params.get("baselineB") || "",
      intent: params.get("intent") || "",
      compareView:
        normalizeCompareView(params.get("compareView") || "") || "list",
      mappingSource: params.get("mappingSource") || "",
      compareRun: params.get("compareRun") === "true" ? "true" : "",
    };
  }

  if (view === "patterns") {
    return { view, pattern: params.get("pattern") || "" };
  }

  if (view === "templates") {
    return {
      view,
      buildSection:
        params.get("buildSection") === "documents"
          ? "documents"
          : params.get("buildSection") === "tasks"
            ? "tasks"
            : "overview",
      task: params.get("task") || "",
      templateType: params.get("templateType") || "",
      framework: params.get("framework") || "",
      format: params.get("format") || "",
      environment: params.get("environment") || "",
      baseline: params.get("baseline") || "",
      controlFamily: params.get("controlFamily") || "",
      category: params.get("category") || "",
      query: params.get("q") || "",
    };
  }

  if (view === "sources") {
    return {
      view,
      query: params.get("q") || "",
      source: params.get("source") || "",
      publisher: params.get("publisher") || "",
      provenance: params.get("provenance") || "",
      eligibility: params.get("eligibility") || "",
      lifecycle: params.get("lifecycle") || "",
      access: params.get("access") || "",
    };
  }

  if (view === "commons") {
    return {
      view,
      query: params.get("q") || params.get("query") || "",
      lane: params.get("lane") || "all",
      framework: params.get("framework") || "",
      lifecycle: params.get("lifecycle") || "",
      audience: params.get("audience") || "",
      accessType: params.get("accessType") || "",
      resourceType: params.get("resourceType") || "",
      category: params.get("category") || "",
      collection: params.get("collection") || "",
      owner: params.get("owner") || "",
      costType: params.get("costType") || "",
      sort: params.get("sort") || "relevance",
      showAll: params.get("showAll") === "true" ? "true" : "",
    };
  }

  if (view === "commons-detail") {
    return {
      view,
      id: params.get("id") || "",
    };
  }

  if (view === "start-here") {
    return {
      view,
      goal: params.get("goal") || "",
      context: params.get("context") || "",
    };
  }

  if (view === "about") {
    return { view: "about" };
  }

  if (view === "not-found") {
    return { view: "not-found" };
  }

  return {
    view: "search",
    query,
    filter: params.get("filter") || "",
    publisher: params.get("publisher") || "",
    kind: params.get("kind") || "",
    objectType: params.get("objectType") || "",
    sourceClass: params.get("sourceClass") || "",
    controlFamily: params.get("controlFamily") || "",
    severity: params.get("severity") || "",
    connectedOnly: params.get("connectedOnly") === "true" ? "true" : "",
    sort: ["relevance", "identifier", "title", "publication"].includes(params.get("sort") || "")
      ? params.get("sort") || "relevance"
      : "relevance",
    viewMode: params.get("view") === "map" ? "map" : "list",
    collection: params.get("collection") || "",
  };
}

export function normalizeViewState(
  view: AppView,
  state: Partial<ViewState> = {},
): ViewState {
  if (view === "home") {
    return { view: "home" };
  }

  if (view === "atlas-map") {
    const incoming = state as Extract<ViewState, { view: "atlas-map" }>;
    return {
      ...atlasMapState(),
      ...incoming,
      view,
    };
  }

  if (view === "library-detail") {
    return {
      view,
      node:
        (state as Extract<ViewState, { view: "library-detail" }>).node || "",
      relationshipView:
        (state as Extract<ViewState, { view: "library-detail" }>)
          .relationshipView || "",
      relationshipType:
        (state as Extract<ViewState, { view: "library-detail" }>)
          .relationshipType || "",
      provenance:
        (state as Extract<ViewState, { view: "library-detail" }>).provenance ||
        "",
      confidence:
        (state as Extract<ViewState, { view: "library-detail" }>).confidence ||
        "",
      nodeType:
        (state as Extract<ViewState, { view: "library-detail" }>).nodeType ||
        "",
      includeCandidates:
        (state as Extract<ViewState, { view: "library-detail" }>)
          .includeCandidates || "",
      relationshipSearch:
        (state as Extract<ViewState, { view: "library-detail" }>)
          .relationshipSearch || "",
    };
  }

  if (view === "catalog-detail") {
    const incoming = state as Extract<ViewState, { view: "catalog-detail" }>;
    return {
      view,
      catalog: incoming.catalog || "",
      query: incoming.query || "",
      family: incoming.family || "",
      browseAll: incoming.browseAll === "true" ? "true" : "",
      type: incoming.type || "",
      area: incoming.area || "",
      publisher: incoming.publisher || "",
      lifecycle: incoming.lifecycle || "",
      page: incoming.page || "",
    };
  }

  if (view === "matrix") {
    const incoming = state as Extract<ViewState, { view: "matrix" }>;
    return {
      ...compareState(),
      ...incoming,
      view,
      crosswalk: incoming.crosswalk || "intent",
    };
  }

  if (view === "patterns") {
    return {
      view,
      pattern:
        (state as Extract<ViewState, { view: "patterns" }>).pattern || "",
    };
  }

  if (view === "templates") {
    const incoming = state as Extract<ViewState, { view: "templates" }>;
    return {
      view,
      buildSection:
        incoming.buildSection === "documents"
          ? "documents"
          : incoming.buildSection === "tasks"
            ? "tasks"
            : "overview",
      task: incoming.task || "",
      templateType: incoming.templateType || "",
      framework: incoming.framework || "",
      format: incoming.format || "",
      environment: incoming.environment || "",
      baseline: incoming.baseline || "",
      controlFamily: incoming.controlFamily || "",
      category: incoming.category || "",
      query: incoming.query || "",
    };
  }

  if (view === "sources") {
    const incoming = state as Extract<ViewState, { view: "sources" }>;
    return {
      view,
      query: incoming.query || "",
      source: incoming.source || "",
      publisher: incoming.publisher || "",
      provenance: incoming.provenance || "",
      eligibility: incoming.eligibility || "",
      lifecycle: incoming.lifecycle || "",
      access: incoming.access || "",
    };
  }

  if (view === "commons") {
    const incoming = state as Extract<ViewState, { view: "commons" }>;
    return {
      view,
      query: incoming.query || "",
      lane: incoming.lane || "all",
      framework: incoming.framework || "",
      lifecycle: incoming.lifecycle || "",
      audience: incoming.audience || "",
      accessType: incoming.accessType || "",
      resourceType: incoming.resourceType || "",
      category: incoming.category || "",
      collection: incoming.collection || "",
      owner: incoming.owner || "",
      costType: incoming.costType || "",
      sort: incoming.sort || "relevance",
      showAll: incoming.showAll === "true" ? "true" : "",
    };
  }

  if (view === "commons-detail") {
    const incoming = state as Extract<ViewState, { view: "commons-detail" }>;
    return {
      view,
      id: incoming.id || "",
    };
  }

  if (view === "start-here") {
    const incoming = state as Extract<ViewState, { view: "start-here" }>;
    return {
      view,
      goal: incoming.goal || "",
      context: incoming.context || "",
    };
  }

  if (view === "about") {
    return { view: "about" };
  }

  if (view === "not-found") {
    return { view: "not-found" };
  }

  if (view === "retired") {
    return {
      view,
      query: (state as Extract<ViewState, { view: "retired" }>).query || "",
    };
  }

  const base = searchState();
  const incoming = state as Extract<ViewState, { view: "search" }>;
  return {
    ...base,
    ...incoming,
    view: "search",
  };
}

function setIfValue(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  }
}

export function serializeViewState(state: ViewState): string {
  const params = new URLSearchParams();

  if (state.view === "home") {
    setIfValue(params, "view", "home");
  } else if (state.view === "atlas-map") {
    params.set("view", "atlas-map");
    setIfValue(params, "node", state.node);
    setIfValue(params, "atlasAxis", state.atlasAxis);
    setIfValue(params, "atlasLimb", state.atlasLimb);
    setIfValue(params, "atlasFramework", state.atlasFramework);
    setIfValue(params, "atlasBaseline", state.atlasBaseline);
    setIfValue(params, "atlasFamily", state.atlasFamily);
    setIfValue(params, "atlasRmfStep", state.atlasRmfStep);
    if (state.relationshipView === "path") {
      params.set("relationshipView", "path");
    } else if (state.relationshipView === "map") {
      params.set("relationshipView", "map");
    } else if (state.relationshipView === "list") {
      params.set("relationshipView", "list");
    } else if (state.relationshipView === "purpose") {
      params.set("relationshipView", "purpose");
    } else if (state.relationshipView === "rmf") {
      params.set("relationshipView", "rmf");
    }
    setIfValue(params, "relationshipType", state.relationshipType);
    setIfValue(params, "provenance", state.provenance);
    setIfValue(params, "confidence", state.confidence);
    setIfValue(params, "type", state.nodeType);
    setIfValue(params, "includeCandidates", state.includeCandidates);
    setIfValue(params, "relationshipSearch", state.relationshipSearch);
    setIfValue(params, "atlasStage", state.atlasStage);
    setIfValue(params, "relationshipGroup", state.relationshipGroup);
    if (state.sourceView === "purpose" || state.sourceView === "rmf") {
      params.set("sourceView", state.sourceView);
    }
    setIfValue(
      params,
      "showSupportingReferences",
      state.showSupportingReferences,
    );
    setIfValue(params, "showDraftOrLegacy", state.showDraftOrLegacy);
    setIfValue(params, "showRegistryOnly", state.showRegistryOnly);
  } else if (state.view === "search") {
    setIfValue(params, "view", "search");
    setIfValue(params, "q", state.query);
    setIfValue(params, "filter", state.filter);
    setIfValue(params, "publisher", state.publisher);
    setIfValue(params, "kind", state.kind);
    setIfValue(params, "objectType", state.objectType);
    setIfValue(params, "sourceClass", state.sourceClass);
    setIfValue(params, "controlFamily", state.controlFamily);
    setIfValue(params, "severity", state.severity);
    setIfValue(params, "connectedOnly", state.connectedOnly);
    if (state.sort !== "relevance") setIfValue(params, "sort", state.sort);
    if (state.viewMode === "map") setIfValue(params, "view", "map");
    setIfValue(params, "collection", state.collection);
  } else if (state.view === "catalog-detail") {
    params.set("view", state.view);
    setIfValue(params, "catalog", state.catalog);
    setIfValue(params, "q", state.query);
    setIfValue(params, "family", state.family);
    setIfValue(params, "browseAll", state.browseAll);
    setIfValue(params, "type", state.type);
    setIfValue(params, "area", state.area);
    setIfValue(params, "publisher", state.publisher);
    setIfValue(params, "lifecycle", state.lifecycle);
    setIfValue(params, "page", state.page);
  } else if (state.view === "library-detail") {
    params.set("view", state.view);
    setIfValue(params, "node", state.node);
    if (state.relationshipView === "map") {
      params.set("relationshipView", "map");
    } else if (
      state.relationshipView === "list" ||
      state.relationshipView === "table"
    ) {
      params.set("relationshipView", "list");
    }
    setIfValue(params, "relationshipType", state.relationshipType || "");
    setIfValue(params, "provenance", state.provenance || "");
    setIfValue(params, "confidence", state.confidence || "");
    setIfValue(params, "nodeType", state.nodeType || "");
    setIfValue(params, "includeCandidates", state.includeCandidates || "");
    setIfValue(params, "relationshipSearch", state.relationshipSearch || "");
  } else if (state.view === "matrix") {
    params.set("view", state.view);
    setIfValue(params, "crosswalk", state.crosswalk);
    setIfValue(params, "workbench", state.crosswalk);
    setIfValue(params, "source", state.source);
    setIfValue(params, "target", state.target);
    setIfValue(params, "items", state.items);
    setIfValue(params, "relationshipType", state.relationshipType);
    setIfValue(params, "provenance", state.provenance);
    setIfValue(params, "confidence", state.confidence);
    setIfValue(params, "includeCandidates", state.includeCandidates);
    setIfValue(params, "chainCatalog", state.chainCatalog);
    setIfValue(params, "chainBenchmark", state.chainBenchmark);
    setIfValue(params, "chainItem", state.chainItem);
    setIfValue(params, "baselineA", state.baselineA);
    setIfValue(params, "baselineB", state.baselineB);
    setIfValue(params, "intent", state.intent);
    setIfValue(params, "mappingSource", state.mappingSource);
    setIfValue(params, "compareRun", state.compareRun);
    if (state.compareView === "map") {
      params.set("compareView", "map");
    }
  } else if (state.view === "patterns") {
    params.set("view", "patterns");
    setIfValue(params, "pattern", state.pattern);
  } else if (state.view === "templates") {
    params.set("view", state.view);
    setIfValue(
      params,
      "buildSection",
      state.buildSection === "overview" ? "" : state.buildSection,
    );
    setIfValue(params, "task", state.task);
    setIfValue(params, "templateType", state.templateType);
    setIfValue(params, "framework", state.framework);
    setIfValue(params, "format", state.format);
    setIfValue(params, "environment", state.environment);
    setIfValue(params, "baseline", state.baseline);
    setIfValue(params, "controlFamily", state.controlFamily);
    setIfValue(params, "category", state.category);
    setIfValue(params, "q", state.query);
  } else if (state.view === "sources") {
    params.set("view", state.view);
    setIfValue(params, "q", state.query);
    setIfValue(params, "source", state.source);
    setIfValue(params, "publisher", state.publisher);
    setIfValue(params, "provenance", state.provenance);
    setIfValue(params, "eligibility", state.eligibility);
    setIfValue(params, "lifecycle", state.lifecycle);
    setIfValue(params, "access", state.access);
  } else if (state.view === "commons") {
    params.set("view", state.view);
    setIfValue(params, "q", state.query);
    if (state.lane && state.lane !== "all") setIfValue(params, "lane", state.lane);
    setIfValue(params, "framework", state.framework);
    setIfValue(params, "lifecycle", state.lifecycle);
    setIfValue(params, "audience", state.audience);
    setIfValue(params, "accessType", state.accessType);
    setIfValue(params, "resourceType", state.resourceType);
    setIfValue(params, "category", state.category);
    setIfValue(params, "collection", state.collection);
    setIfValue(params, "owner", state.owner);
    setIfValue(params, "costType", state.costType);
    if (state.sort && state.sort !== "relevance") setIfValue(params, "sort", state.sort);
    setIfValue(params, "showAll", state.showAll);
  } else if (state.view === "commons-detail") {
    params.set("view", state.view);
    setIfValue(params, "id", state.id);
  } else if (state.view === "start-here") {
    params.set("view", state.view);
    setIfValue(params, "goal", state.goal);
    setIfValue(params, "context", state.context);
  } else if (state.view === "about") {
    params.set("view", state.view);
  } else if (state.view === "retired") {
    params.set("view", state.view);
    setIfValue(params, "q", state.query);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export type AtlasMapUrlOptions = {
  node?: string;
  atlasAxis?: string;
  atlasLimb?: string;
  atlasFramework?: string;
  atlasBaseline?: string;
  atlasFamily?: string;
  atlasRmfStep?: string;
  sourceView?: "default" | "purpose" | "rmf";
  relationshipView?: RelationshipViewMode;
  relationshipType?: string;
  provenance?: string;
  confidence?: string;
  nodeType?: string;
  includeCandidates?: boolean;
  relationshipSearch?: string;
  atlasStage?: string;
  relationshipGroup?: string;
};

export type CompareUrlOptions = Partial<
  Extract<ViewState, { view: "matrix" }>
> & {
  compareView?: CompareViewMode;
};

export function buildCompareUrl(options: CompareUrlOptions = {}): string {
  const state = normalizeViewState("matrix", {
    ...compareState(),
    ...options,
    view: "matrix",
    compareView: options.compareView || "list",
  }) as Extract<ViewState, { view: "matrix" }>;
  return serializeViewState(state);
}

export function buildAtlasMapUrl(options: AtlasMapUrlOptions = {}): string {
  const state = normalizeViewState("atlas-map", {
    view: "atlas-map",
    node: options.node || "",
    atlasAxis: options.atlasAxis || "",
    atlasLimb: options.atlasLimb || "",
    atlasFramework: options.atlasFramework || "",
    atlasBaseline: options.atlasBaseline || "",
    atlasFamily: options.atlasFamily || "",
    atlasRmfStep: options.atlasRmfStep || "",
    sourceView: options.sourceView || "default",
    relationshipView: options.relationshipView || "",
    relationshipType: options.relationshipType || "",
    provenance: options.provenance || "",
    confidence: options.confidence || "",
    nodeType: options.nodeType || "",
    includeCandidates: options.includeCandidates ? "true" : "",
    relationshipSearch: options.relationshipSearch || "",
    atlasStage: options.atlasStage || "",
    relationshipGroup: options.relationshipGroup || "",
  }) as Extract<ViewState, { view: "atlas-map" }>;
  return serializeViewState(state);
}

export function nodeIdFromItemId(
  runtime: { searchLibrary: (query: string) => Array<{ id: string; item_id?: string }> },
  itemId: string,
): string | null {
  const match =
    runtime
      .searchLibrary(itemId)
      .find((entry) => entry.item_id === itemId) ||
    runtime.searchLibrary(itemId)[0];
  return match?.id ?? null;
}
