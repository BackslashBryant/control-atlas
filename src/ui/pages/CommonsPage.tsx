import React, { useMemo, useState, useEffect } from "react";
import {
  IconSearch,
  IconFilter,
  IconX,
  IconShieldCheck,
  IconCode,
  IconUsers,
  IconBuildingStore,
  IconArchive,
  IconSparkles,
  IconRefresh,
  IconPlus,
  IconFlag,
  IconBook2,
  IconChevronRight,
  IconCheck
} from "@tabler/icons-react";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import type {
  CommonsResource,
  CommonsResourceLane,
  CommonsCollection
} from "../lib/commonsTypes";
import { groupResourcesByKind } from "../lib/commonsPresentation.mjs";
import { CommonsResourceCard } from "../components/CommonsResourceCard";
import { OfficialPracticalPairing } from "../components/OfficialPracticalPairing";

type CommonsPageProps = {
  bundle: RuntimeBundle | null;
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

export function CommonsPage({ bundle, viewState, onNavigate }: CommonsPageProps) {
  // Extract initial state from URL viewState
  const initialQuery = viewState.view === "commons" ? viewState.query || "" : "";
  const initialLane = viewState.view === "commons" ? viewState.lane || "all" : "all";
  const initialFramework = viewState.view === "commons" ? viewState.framework || "" : "";
  const initialLifecycle = viewState.view === "commons" ? viewState.lifecycle || "" : "";
  const initialAudience = viewState.view === "commons" ? viewState.audience || "" : "";
  const initialResourceType = viewState.view === "commons" ? viewState.resourceType || "" : "";
  const initialAccessType = viewState.view === "commons" ? viewState.accessType || "" : "";
  const initialCollection = viewState.view === "commons" ? viewState.collection || "" : "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeLane, setActiveLane] = useState<string>(initialLane);
  const [selectedFramework, setSelectedFramework] = useState(initialFramework);
  const [selectedLifecycle, setSelectedLifecycle] = useState(initialLifecycle);
  const [selectedAudience, setSelectedAudience] = useState(initialAudience);
  const [selectedResourceType, setSelectedResourceType] = useState(initialResourceType);
  const [selectedAccessType, setSelectedAccessType] = useState(initialAccessType);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Shallow-to-deep: the full 99-resource grid is a deliberate "deep" view.
  // It opens only after the visitor expresses intent (search, lane, filter,
  // collection) or explicitly asks to browse everything.
  const [showAllResources, setShowAllResources] = useState(false);

  // Load dataset and index from runtime bundle
  const dataset = bundle?.commonsDataset;
  const index = bundle?.commonsSearchIndex;

  const allResources: CommonsResource[] = useMemo(() => {
    return dataset?.resources || [];
  }, [dataset]);

  const allCollections: CommonsCollection[] = useMemo(() => {
    return dataset?.collections || [];
  }, [dataset]);

  const accessTypeOptions = useMemo(
    () =>
      [...new Set(allResources.map((resource) => resource.accessType))]
        .filter(Boolean)
        .sort(),
    [allResources],
  );

  // Derived from the data, never hand-listed: a hardcoded list previously
  // offered "advisory" (which matched nothing) while omitting four real types
  // covering 67 resources, making them unreachable through this filter.
  const RESOURCE_TYPE_LABELS: Record<string, string> = {
    catalog: "Catalog",
    community_forum: "Community forum",
    dataset: "Dataset / feed",
    documentation: "Documentation",
    historical_reference: "Historical reference",
    instruction: "Instruction",
    matrix: "Matrix",
    policy: "Policy",
    specification: "Specification",
    template: "Template",
    tool: "Tool / automation",
    training: "Training / course",
  };

  const resourceTypeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const resource of allResources) {
      if (!resource.resourceType) continue;
      counts.set(
        resource.resourceType,
        (counts.get(resource.resourceType) ?? 0) + 1,
      );
    }
    return [...counts.entries()]
      .map(([value, count]) => ({
        value,
        count,
        label:
          RESOURCE_TYPE_LABELS[value] ??
          value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [allResources]);

  // Sync state changes back to URL
  const updateParams = (patch: Partial<Extract<ViewState, { view: "commons" }>>) => {
    onNavigate("commons", {
      query: searchQuery,
      lane: activeLane,
      framework: selectedFramework,
      lifecycle: selectedLifecycle,
      audience: selectedAudience,
      resourceType: selectedResourceType,
      accessType: selectedAccessType,
      collection: selectedCollection,
      ...patch
    });
  };

  // Filter & Rank Resources deterministically
  const filteredResources = useMemo(() => {
    let result = [...allResources];

    // Filter by Lane
    if (activeLane && activeLane !== "all") {
      result = result.filter((r) => r.resourceLane === activeLane);
    }

    // Filter by Collection
    if (selectedCollection) {
      const col = allCollections.find((c) => c.id === selectedCollection);
      if (col) {
        result = result.filter((r) => col.resourceIds.includes(r.id));
      }
    }

    // Filter by Framework
    if (selectedFramework) {
      result = result.filter((r) =>
        r.frameworks.some((f) => f.toLowerCase().includes(selectedFramework.toLowerCase()))
      );
    }

    // Filter by Lifecycle Stage
    if (selectedLifecycle) {
      result = result.filter((r) =>
        r.lifecycleStages.some((l) => l.toLowerCase() === selectedLifecycle.toLowerCase())
      );
    }

    // Filter by Audience
    if (selectedAudience) {
      result = result.filter((r) =>
        r.audiences.some((a) => a.toLowerCase().includes(selectedAudience.toLowerCase()))
      );
    }

    // Filter by Resource Type
    if (selectedResourceType) {
      result = result.filter((r) => r.resourceType === selectedResourceType);
    }

    // Filter by Access Type
    if (selectedAccessType) {
      result = result.filter((r) => r.accessType === selectedAccessType);
    }

    // Search Query Matching & Deterministic Ranking
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((resource) => {
          let score = 0;

          const nameMatch = resource.name.toLowerCase().includes(q);
          const shortNameMatch = resource.shortName.toLowerCase().includes(q);
          const aliasMatch = (resource.searchAliases || []).some((a) => a.toLowerCase().includes(q));
          const idMatch = resource.id.toLowerCase().includes(q);

          if (idMatch || nameMatch || shortNameMatch || aliasMatch) {
            score += 100;
          }

          const keywordMatch = (resource.searchKeywords || []).some((k) => k.toLowerCase().includes(q));
          if (keywordMatch) score += 50;

          const frameworkMatch = resource.frameworks.some((f) => f.toLowerCase().includes(q));
          if (frameworkMatch) score += 40;

          const summaryMatch = resource.summary.toLowerCase().includes(q);
          const whyMatch = resource.whyIncluded.toLowerCase().includes(q);
          if (summaryMatch || whyMatch) score += 20;

          // Intent-aware boost
          if (q.includes("template") || q.includes("ssp") || q.includes("poam")) {
            if (resource.resourceType === "template") score += 30;
          } else if (q.includes("tool") || q.includes("stig") || q.includes("scan") || q.includes("automate")) {
            if (resource.resourceLane === "open_source" || resource.resourceType === "tool") score += 30;
          } else if (q.includes("require") || q.includes("policy") || q.includes("standard")) {
            if (resource.resourceLane === "official") score += 30;
          }

          if (resource.editorialRecommendation) score += 10;

          return { resource, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.resource);
    }

    return result;
  }, [
    allResources,
    activeLane,
    selectedCollection,
    selectedFramework,
    selectedLifecycle,
    selectedAudience,
    selectedResourceType,
    selectedAccessType,
    searchQuery,
    allCollections
  ]);

  // Pairing module detector for major queries
  const pairing = useMemo(() => {
    if (!allResources.length) return null;
    const q = searchQuery.toLowerCase().trim();

    if (q.includes("ac-2") || q.includes("account management")) {
      const official = allResources.find((r) => r.id === "official-nist-sp800-53-r5");
      const companions = allResources.filter((r) =>
        ["tool-compliance-as-code", "tool-powerstig", "community-reddit-nistcontrols"].includes(r.id)
      );
      if (official) return { official, companions };
    }

    if (q.includes("cmmc") || q.includes("cui") || q.includes("171")) {
      const official = allResources.find((r) => r.id === "official-nist-sp800-171-r2");
      const companions = allResources.filter((r) =>
        ["official-cmmc-32cfr-170", "template-cmmc-ssp-starter", "community-reddit-cmmc"].includes(r.id)
      );
      if (official) return { official, companions };
    }

    if (q.includes("stig") || q.includes("disa") || q.includes("ckl")) {
      const official = allResources.find((r) => r.id === "official-disa-stig-library");
      const companions = allResources.filter((r) =>
        ["tool-disa-stig-viewer", "tool-powerstig", "tool-evaluate-stig", "tool-compliance-as-code"].includes(r.id)
      );
      if (official) return { official, companions };
    }

    if (q.includes("fedramp") || q.includes("cloud")) {
      const official = allResources.find((r) => r.id === "official-fedramp-baselines");
      const companions = allResources.filter((r) =>
        ["official-fedramp-20x", "template-fedramp-ssp-rev5", "tool-compliance-trestle"].includes(r.id)
      );
      if (official) return { official, companions };
    }

    if (q.includes("oscal")) {
      const official = allResources.find((r) => r.id === "official-nist-oscal");
      const companions = allResources.filter((r) =>
        ["tool-compliance-trestle", "tool-gsa-oscal-ssp-word", "tool-awesome-oscal"].includes(r.id)
      );
      if (official) return { official, companions };
    }

    return null;
  }, [searchQuery, allResources]);

  const activeFilterCount =
    (activeLane !== "all" ? 1 : 0) +
    (selectedFramework ? 1 : 0) +
    (selectedLifecycle ? 1 : 0) +
    (selectedAudience ? 1 : 0) +
    (selectedResourceType ? 1 : 0) +
    (selectedAccessType ? 1 : 0) +
    (selectedCollection ? 1 : 0);

  const hasIntent = Boolean(searchQuery.trim()) || activeFilterCount > 0;
  const showResults = hasIntent || showAllResources;

  // Browsing is grouped by kind so the visitor can tell rules from tools from
  // communities at a glance. Searching is NOT: `filteredResources` is already
  // ranked by relevance there, and sectioning would push the best match below
  // whatever section happens to sort first.
  const resourceGroups = useMemo(
    () => groupResourcesByKind(filteredResources),
    [filteredResources],
  );
  // Section headings have to earn their space. Below roughly four rows of cards
  // the headings outnumber the content they organize — a 5-result collection
  // rendered three headings for five cards — so small result sets stay flat.
  const GROUPING_THRESHOLD = 12;
  const groupResults =
    !searchQuery.trim() &&
    resourceGroups.length > 1 &&
    filteredResources.length >= GROUPING_THRESHOLD;

  const clearAllFilters = () => {
    setActiveLane("all");
    setSelectedFramework("");
    setSelectedLifecycle("");
    setSelectedAudience("");
    setSelectedResourceType("");
    setSelectedAccessType("");
    setSelectedCollection("");
    setSearchQuery("");
    setShowAllResources(false);
    updateParams({
      lane: "all",
      framework: "",
      lifecycle: "",
      audience: "",
      resourceType: "",
      accessType: "",
      collection: "",
      query: ""
    });
  };

  const handleSelectDetail = (id: string) => {
    onNavigate("commons-detail", { id, from: "commons" });
  };

  const renderResourceGrid = (resources: CommonsResource[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <CommonsResourceCard
          key={resource.id}
          resource={resource}
          onSelectDetail={handleSelectDetail}
          onNavigateSearch={(q) => {
            setSearchQuery(q);
            updateParams({ query: q });
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--ca-bg)] text-[var(--ca-text)] pb-16">
      {/* Hero Header Section */}
      <header className="border-b border-[var(--ca-border)] bg-gradient-to-b from-[var(--ca-surface)] via-[var(--ca-surface-deep)] to-[var(--ca-surface-deep)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[color-mix(in_srgb,var(--ca-primary)_15%,transparent)] border border-[color-mix(in_srgb,var(--ca-primary)_60%,transparent)] text-[var(--ca-primary)] text-xs font-semibold uppercase tracking-widest mb-3">
                <IconBook2 size={14} />
                Control Commons
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--ca-text)] sm:text-4xl">
                Control Commons
              </h1>
              <p className="text-lg font-medium text-[var(--ca-primary)] mt-1">
                Official sources. Working tools. Practitioner knowledge.
              </p>
              <p className="text-sm text-[var(--ca-secondary)] max-w-2xl mt-2">
                The public shared resource hub for government cybersecurity, compliance, authorization, workforce qualification, hardening benchmarks, and compliance automation.
              </p>
            </div>

            {/* Quick Stats & Action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/BackslashBryant/control-atlas/issues/new?template=submit-resource.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-medium text-sm shadow-sm transition-colors"
              >
                <IconPlus size={16} />
                Submit Resource
              </a>
              <a
                href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-[var(--ca-border-strong)] hover:bg-[var(--ca-surface)] text-[var(--ca-text-muted)] font-medium text-sm transition-colors"
              >
                <IconFlag size={16} />
                Report Problem
              </a>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="mt-8 relative max-w-4xl">
            <div className="relative">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ca-secondary)]" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateParams({ query: e.target.value });
                }}
                placeholder="Search templates, tools, frameworks, communities, datasets, and official guidance..."
                className="w-full rounded-md border border-[var(--ca-border-strong)] bg-[color-mix(in_srgb,var(--ca-surface)_90%,transparent)] py-3.5 pl-12 pr-10 text-[var(--ca-text)] placeholder:text-[var(--ca-text-muted)] shadow-md text-base focus:border-[var(--ca-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ca-primary)_50%,transparent)]"
              />
              {searchQuery ? (
                <button
                  aria-label="Clear Commons search"
                  onClick={() => {
                    setSearchQuery("");
                    updateParams({ query: "" });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ca-secondary)] hover:text-[var(--ca-text)]"
                >
                  <IconX size={18} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Surface */}
      <section
        aria-label="Control Commons resources"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8"
      >
        {/* Parallel Discovery Lanes Tabs */}
        <nav aria-label="Parallel Discovery Lanes" className="mb-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ca-border)] pb-3">
            {[
              { id: "all", label: "All Lanes", icon: IconBook2, count: allResources.length },
              { id: "official", label: "Official", icon: IconShieldCheck, count: allResources.filter(r => r.resourceLane === "official").length },
              { id: "open_source", label: "Open Source", icon: IconCode, count: allResources.filter(r => r.resourceLane === "open_source").length },
              { id: "practitioner", label: "Practitioner", icon: IconUsers, count: allResources.filter(r => r.resourceLane === "practitioner").length },
              { id: "commercial", label: "Commercial", icon: IconBuildingStore, count: allResources.filter(r => r.resourceLane === "commercial").length },
              { id: "legacy", label: "Legacy", icon: IconArchive, count: allResources.filter(r => r.resourceLane === "legacy").length }
            ].map((lane) => {
              const Icon = lane.icon;
              const active = activeLane === lane.id;
              return (
                <button
                  key={lane.id}
                  onClick={() => {
                    setActiveLane(lane.id);
                    updateParams({ lane: lane.id });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--ca-primary)] text-[var(--ca-bg)] shadow-md"
                      : "bg-[var(--ca-surface)] border border-[var(--ca-border)] text-[var(--ca-text-muted)] hover:bg-[var(--ca-surface-raised)] hover:text-[var(--ca-text)]"
                  }`}
                >
                  <Icon size={16} />
                  <span>{lane.label}</span>
                  <span
                    className={`ml-1 rounded px-2 py-0.5 text-xs font-semibold ${
                      active ? "bg-[color-mix(in_srgb,var(--ca-primary)_70%,transparent)] text-[var(--ca-bg)]" : "bg-[var(--ca-surface-raised)] text-[var(--ca-text)]"
                    }`}
                  >
                    {lane.count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Featured Starter Collections Carousel / Grid */}
        {!searchQuery && !selectedCollection && activeLane === "all" ? (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--ca-text)] flex items-center gap-2">
                <IconSparkles size={20} className="text-[var(--ca-primary)]" />
                Featured Starter Collections
              </h2>
              <span className="text-xs text-[var(--ca-secondary)]">Curated practitioner toolkits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCollections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    setSelectedCollection(col.id);
                    updateParams({ collection: col.id });
                  }}
                  className="group cursor-pointer rounded-md border border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface)_60%,transparent)] p-4 hover:border-[color-mix(in_srgb,var(--ca-primary)_50%,transparent)] hover:bg-[var(--ca-surface)] transition-all flex flex-col justify-between text-left"
                  type="button"
                >
                  <div>
                    <h3 className="text-base font-semibold text-[var(--ca-text)] group-hover:text-[var(--ca-primary)] flex items-center justify-between">
                      <span>{col.title}</span>
                      <IconChevronRight size={16} className="text-[var(--ca-secondary)] group-hover:text-[var(--ca-primary)] group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-xs text-[var(--ca-text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                      {col.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[color-mix(in_srgb,var(--ca-border)_80%,transparent)] flex items-center justify-between text-xs text-[var(--ca-secondary)]">
                    <span>{col.resourceIds.length} resources</span>
                    <span className="text-[var(--ca-primary)] font-medium group-hover:underline">Explore kit →</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* Dynamic Official-Plus-Practical Pairing Module */}
        {pairing ? (
          <OfficialPracticalPairing
            officialResource={pairing.official}
            companionResources={pairing.companions}
            onSelectResource={handleSelectDetail}
          />
        ) : null}

        {/* Active Filters & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-surface)] text-[var(--ca-text)] text-xs font-medium hover:bg-[var(--ca-surface-raised)] transition-colors"
            >
              <IconFilter size={15} />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="ml-1 rounded bg-[var(--ca-primary)] text-[var(--ca-bg)] px-1.5 py-0.2 text-[11px] font-bold">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {/* Active Filter Removable Tokens */}
            {selectedCollection ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] border border-[var(--ca-primary)] text-[var(--ca-primary)] text-xs font-medium">
                Collection: {allCollections.find((c) => c.id === selectedCollection)?.title}
                <button aria-label="Remove collection filter" onClick={() => { setSelectedCollection(""); updateParams({ collection: "" }); }}>
                  <IconX size={13} />
                </button>
              </span>
            ) : null}

            {selectedFramework ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--ca-surface-raised)] border border-[var(--ca-border-strong)] text-[var(--ca-text)] text-xs font-medium">
                Framework: {selectedFramework}
                <button aria-label="Remove framework filter" onClick={() => { setSelectedFramework(""); updateParams({ framework: "" }); }}>
                  <IconX size={13} />
                </button>
              </span>
            ) : null}

            {selectedLifecycle ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--ca-surface-raised)] border border-[var(--ca-border-strong)] text-[var(--ca-text)] text-xs font-medium">
                Lifecycle: {selectedLifecycle}
                <button aria-label="Remove lifecycle filter" onClick={() => { setSelectedLifecycle(""); updateParams({ lifecycle: "" }); }}>
                  <IconX size={13} />
                </button>
              </span>
            ) : null}

            {selectedAudience ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--ca-surface-raised)] border border-[var(--ca-border-strong)] text-[var(--ca-text)] text-xs font-medium">
                Audience: {selectedAudience}
                <button aria-label="Remove audience filter" onClick={() => { setSelectedAudience(""); updateParams({ audience: "" }); }}>
                  <IconX size={13} />
                </button>
              </span>
            ) : null}

            {activeFilterCount > 0 ? (
              <button
                onClick={clearAllFilters}
                className="text-xs bg-transparent text-[var(--ca-primary)] hover:text-[var(--ca-primary)] underline font-medium ml-2"
              >
                Clear all filters
              </button>
            ) : null}
          </div>

          {showResults ? (
            <div aria-live="polite" className="text-xs text-[var(--ca-secondary)]">
              Showing <span className="font-semibold text-[var(--ca-text)]">{filteredResources.length}</span> of {allResources.length} resources
            </div>
          ) : null}
        </div>

        {/* Filter Drawer / Facets Panel */}
        {filterDrawerOpen ? (
          <div className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-5 mb-8 shadow-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Framework Filter */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ca-text-muted)] uppercase tracking-wider mb-2" htmlFor="commons-framework-filter">
                Framework / Program
              </label>
              <select
                id="commons-framework-filter"
                value={selectedFramework}
                onChange={(e) => {
                  setSelectedFramework(e.target.value);
                  updateParams({ framework: e.target.value });
                }}
                className="w-full rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] py-2 px-3 text-xs text-[var(--ca-text)] focus:border-[var(--ca-primary)] focus:outline-none"
              >
                <option value="">All Frameworks</option>
                <option value="NIST SP 800-53">NIST SP 800-53</option>
                <option value="NIST SP 800-171">NIST SP 800-171</option>
                <option value="FedRAMP">FedRAMP</option>
                <option value="CMMC">CMMC 2.0</option>
                <option value="DoD RMF">DoD RMF</option>
                <option value="DISA STIG">DISA STIG</option>
                <option value="OSCAL">OSCAL</option>
                <option value="CIS Benchmarks">CIS Benchmarks</option>
              </select>
            </div>

            {/* Lifecycle Stage */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ca-text-muted)] uppercase tracking-wider mb-2" htmlFor="commons-lifecycle-filter">
                Lifecycle Stage
              </label>
              <select
                id="commons-lifecycle-filter"
                value={selectedLifecycle}
                onChange={(e) => {
                  setSelectedLifecycle(e.target.value);
                  updateParams({ lifecycle: e.target.value });
                }}
                className="w-full rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] py-2 px-3 text-xs text-[var(--ca-text)] focus:border-[var(--ca-primary)] focus:outline-none"
              >
                <option value="">All Stages</option>
                <option value="Learn">Learn</option>
                <option value="Govern">Govern</option>
                <option value="Scope">Scope</option>
                <option value="Categorize">Categorize</option>
                <option value="Select">Select</option>
                <option value="Implement">Implement</option>
                <option value="Harden">Harden</option>
                <option value="Assess">Assess</option>
                <option value="Authorize">Authorize</option>
                <option value="Monitor">Monitor</option>
                <option value="Automate">Automate</option>
                <option value="Train">Train</option>
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ca-text-muted)] uppercase tracking-wider mb-2" htmlFor="commons-audience-filter">
                Audience / Role
              </label>
              <select
                id="commons-audience-filter"
                value={selectedAudience}
                onChange={(e) => {
                  setSelectedAudience(e.target.value);
                  updateParams({ audience: e.target.value });
                }}
                className="w-full rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] py-2 px-3 text-xs text-[var(--ca-text)] focus:border-[var(--ca-primary)] focus:outline-none"
              >
                <option value="">All Audiences</option>
                <option value="ISSO">ISSO</option>
                <option value="ISSM">ISSM</option>
                <option value="Authorizing Official">Authorizing Official</option>
                <option value="Security Control Assessor">Security Control Assessor</option>
                <option value="3PAO">3PAO</option>
                <option value="Engineer">Engineer</option>
                <option value="Administrator">Administrator</option>
                <option value="Developer">Developer</option>
                <option value="DevSecOps">DevSecOps</option>
                <option value="Defense Contractor">Defense Contractor</option>
                <option value="Cloud Service Provider">Cloud Service Provider</option>
                <option value="CMMC Practitioner">CMMC Practitioner</option>
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ca-text-muted)] uppercase tracking-wider mb-2" htmlFor="commons-resource-type-filter">
                Resource Type
              </label>
              <select
                id="commons-resource-type-filter"
                value={selectedResourceType}
                onChange={(e) => {
                  setSelectedResourceType(e.target.value);
                  updateParams({ resourceType: e.target.value });
                }}
                className="w-full rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] py-2 px-3 text-xs text-[var(--ca-text)] focus:border-[var(--ca-primary)] focus:outline-none"
              >
                <option value="">All Resource Types</option>
                {resourceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Access Type */}
            {accessTypeOptions.length > 1 ? <div>
              <label className="block text-xs font-semibold text-[var(--ca-text-muted)] uppercase tracking-wider mb-2" htmlFor="commons-access-type-filter">
                Access Type
              </label>
              <select
                id="commons-access-type-filter"
                value={selectedAccessType}
                onChange={(e) => {
                  setSelectedAccessType(e.target.value);
                  updateParams({ accessType: e.target.value });
                }}
                className="w-full rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] py-2 px-3 text-xs text-[var(--ca-text)] focus:border-[var(--ca-primary)] focus:outline-none"
              >
                <option value="">All Access Types</option>
                {accessTypeOptions.map((accessType) => (
                  <option key={accessType} value={accessType}>
                    {accessType.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div> : null}
          </div>
        ) : null}

        {/* Results — the "deep" full grid opens only after intent or an
            explicit request. The shallow default guides toward a starting
            point instead of dropping the whole catalog on the visitor. */}
        {!showResults ? (
          <div className="rounded-md border border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface)_60%,transparent)] p-10 text-center my-8">
            <IconBook2 size={36} className="mx-auto text-[var(--ca-primary)] mb-3" />
            <h3 className="text-lg font-bold text-[var(--ca-text)]">Start with a collection, lane, or search</h3>
            <p className="text-sm text-[var(--ca-secondary)] max-w-md mx-auto mt-1">
              Open a starter collection above, pick a discovery lane, or search to
              find the tools, templates, and official guidance you need.
            </p>
            <button
              onClick={() => setShowAllResources(true)}
              className="mt-5 px-4 py-2 rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-surface)] text-[var(--ca-text)] hover:bg-[var(--ca-surface-raised)] font-medium text-xs transition-colors"
              type="button"
            >
              Or browse all {allResources.length} resources
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-md border border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface)_60%,transparent)] p-12 text-center my-8">
            <IconBook2 size={40} className="mx-auto text-[var(--ca-text-muted)] mb-3" />
            <h3 className="text-lg font-bold text-[var(--ca-text)]">No resources found matching your query</h3>
            <p className="text-sm text-[var(--ca-secondary)] max-w-md mx-auto mt-1">
              Try widening your search terms or clearing selected filters to view available resources.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-medium text-xs shadow"
            >
              Reset All Filters
            </button>
          </div>
        ) : groupResults ? (
          resourceGroups.map((group) => (
            <section
              aria-labelledby={`commons-group-${group.id}`}
              className="commons-group"
              key={group.id}
            >
              <div className="commons-group-header">
                <h2 className="commons-group-title" id={`commons-group-${group.id}`}>
                  <span>{group.label}</span>
                  <span className="commons-group-count">{group.resources.length}</span>
                </h2>
                <p className="commons-group-blurb">{group.blurb}</p>
              </div>
              {renderResourceGrid(group.resources)}
            </section>
          ))
        ) : (
          renderResourceGrid(filteredResources)
        )}
      </section>
    </div>
  );
}
