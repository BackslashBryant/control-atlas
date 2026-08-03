import { useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconExternalLink,
  IconCode,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconBook2,
  IconCalendar,
  IconLock,
  IconKey,
  IconFlag,
  IconSparkles
} from "@tabler/icons-react";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import type { CommonsResource } from "../lib/commonsTypes";
import { CommonsLaneBadge } from "../components/CommonsLaneBadge";
import { serializeHashLocation } from "../lib/hashRoutes";
import { PRIMARY_BROWSE_CATEGORIES, primaryBrowseCategory } from "../lib/resourcesDirectory.mjs";

type CommonsDetailPageProps = {
  bundle: RuntimeBundle | null;
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

export function CommonsDetailPage({ bundle, viewState, onNavigate }: CommonsDetailPageProps) {
  const resourceId = viewState.view === "commons-detail" ? viewState.id : "";
  const [copied, setCopied] = useState(false);

  const dataset = bundle?.commonsDataset;

  const resource: CommonsResource | undefined = useMemo(() => {
    return dataset?.resources.find((r) => r.id === resourceId);
  }, [dataset, resourceId]);

  const companionResources = useMemo(() => {
    if (!resource?.companionResources || !dataset) return [];
    return dataset.resources.filter((r) => resource.companionResources?.includes(r.id));
  }, [resource, dataset]);

  const supersedingResource = useMemo(() => {
    if (!resource?.supersededBy || !dataset) return null;
    return dataset.resources.find((r) => r.id === resource.supersededBy);
  }, [resource, dataset]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}${window.location.pathname}#${serializeHashLocation({ view: "commons-detail", id: resourceId })}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-[var(--ca-bg)] text-[var(--ca-text)] p-8">
        <div className="mx-auto max-w-3xl rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-8 text-center">
          <IconAlertTriangle size={48} className="mx-auto text-[var(--ca-warning)] mb-3" />
          <h2 className="text-xl font-bold">Resource Not Found</h2>
          <p className="text-sm text-[var(--ca-secondary)] mt-2 mb-6">
            The resource ID "{resourceId}" could not be found in Resources.
          </p>
          <button
            onClick={() => onNavigate("commons")}
            className="px-4 py-2 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-medium text-xs shadow"
          >
            Return to Resources
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ca-bg)] text-[var(--ca-text)] pb-16">
      {/* Back Navigation */}
      <div className="border-b border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface)_50%,transparent)] px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            onClick={() => onNavigate("commons")}
            className="inline-flex items-center gap-2 bg-transparent text-xs font-semibold text-[var(--ca-primary)] hover:text-[var(--ca-primary)] transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to Resources
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-surface)] text-xs font-medium text-[var(--ca-text-muted)] hover:bg-[var(--ca-surface-raised)] transition-colors"
            >
              {copied ? <IconCheck size={14} className="text-[var(--ca-success)]" /> : <IconCopy size={14} />}
              <span>{copied ? "Link copied" : "Copy link"}</span>
            </button>
            <a
              href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-surface)] text-xs font-medium text-[var(--ca-text-muted)] hover:bg-[var(--ca-surface-raised)] transition-colors"
            >
              <IconFlag size={14} />
              <span>Report a problem</span>
            </a>
          </div>
        </div>
      </div>

      <section
        aria-label="Resource detail"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8"
      >
        {/* Header Block */}
        <div className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-6 shadow-md mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CommonsLaneBadge full lane={resource.resourceLane} />

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[var(--ca-surface-raised)] text-[var(--ca-text)] border border-[var(--ca-border-strong)] capitalize">
              Status: {resource.maintenanceStatus}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ca-text)]">
            {resource.name}
          </h1>

          <p className="text-xs text-[var(--ca-secondary)] mt-2 mb-4">
            Published by <span className="font-semibold text-[var(--ca-text)]">{resource.publisher}</span>
            {resource.maintainer ? ` · Maintained by ${resource.maintainer}` : ""}
            {resource.currentVersion ? ` · Version: ${resource.currentVersion}` : ""}
            {resource.lastCheckedAt ? ` · Last checked: ${resource.lastCheckedAt}` : ""}
          </p>

          <p className="text-base text-[var(--ca-text)] leading-relaxed mb-6">
            {resource.summary}
          </p>

          {/* Primary Action Button */}
          <div className="flex flex-wrap gap-3">
            <a
              href={resource.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-semibold text-sm shadow-sm transition-colors"
            >
              <span>Open Canonical Resource</span>
              <IconExternalLink size={16} />
            </a>

            {resource.repositoryUrl ? (
              <a
                href={resource.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-[var(--ca-border-strong)] bg-[var(--ca-bg)] hover:bg-[var(--ca-surface-raised)] text-[var(--ca-text)] font-medium text-sm transition-colors"
              >
                <IconCode size={16} />
                <span>Source Repository</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Supersession Warning Callout */}
        {resource.resourceLane === "legacy" || supersedingResource ? (
          <div className="commons-warning-panel rounded-md p-5 mb-8 flex items-start gap-3">
            <IconAlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Legacy / Superseded Resource Notice
              </h3>
              <p className="text-xs mt-1">
                {resource.legacyReason || "This resource has been superseded by a newer official standard or tool."}
              </p>
              {supersedingResource ? (
                <button
                  onClick={() => onNavigate("commons-detail", { id: supersedingResource.id })}
                  className="mt-2 text-xs font-semibold text-[var(--ca-primary)] hover:underline inline-flex items-center gap-1"
                >
                  View current replacement: {supersedingResource.name} →
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 2-Column Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Main Details Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Why Included */}
            <section className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-6 shadow-md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ca-primary)] flex items-center gap-2 mb-3">
                <IconInfoCircle size={18} />
                Why Control Atlas lists this
              </h2>
              <p className="text-sm text-[var(--ca-text)] leading-relaxed">
                {resource.whyIncluded}
              </p>
              {resource.editorialNotes ? (
                <div className="mt-4 p-3 rounded-sm bg-[var(--ca-bg)] border border-[var(--ca-border)] text-xs text-[var(--ca-text-muted)]">
                  <span className="font-semibold text-[var(--ca-primary)] block mb-1">Control Atlas note:</span>
                  {resource.editorialNotes}
                </div>
              ) : null}
            </section>

            {/* Practical Companion Resources */}
            {companionResources.length > 0 ? (
              <section className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-6 shadow-md">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ca-text)] flex items-center gap-2 mb-4">
                  <IconSparkles size={18} className="text-[var(--ca-primary)]" />
                  Related tools and templates
                </h2>
                <div className="space-y-4">
                  {companionResources.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-sm border border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface-deep)_80%,transparent)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <button
                          onClick={() => onNavigate("commons-detail", { id: comp.id })}
                          className="text-sm font-semibold text-[var(--ca-text)] hover:text-[var(--ca-primary)] text-left"
                        >
                          {comp.name}
                        </button>
                        <p className="text-xs text-[var(--ca-secondary)] mt-1">{comp.summary}</p>
                      </div>
                      <a
                        href={comp.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-[var(--ca-surface-raised)] hover:brightness-110 text-xs font-medium text-[var(--ca-text)] shrink-0 inline-flex items-center gap-1"
                      >
                        Open <IconExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Warnings & OPSEC Notes */}
            {resource.warnings && resource.warnings.length > 0 ? (
              <section className="commons-warning-panel rounded-md p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
                  Warnings & Usage Guidance
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {resource.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Right Metadata Sidebar */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-5 space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ca-text-muted)] border-b border-[var(--ca-border)] pb-2">
                Metadata & Access
              </h3>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Browse Category</span>
                <span className="font-semibold text-[var(--ca-text)]">{PRIMARY_BROWSE_CATEGORIES.find((category) => category.id === primaryBrowseCategory(resource))?.label}</span>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Resource Lane</span>
                <span className="font-semibold text-[var(--ca-text)] capitalize">{resource.resourceLane.replace("_", " ")}</span>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Access Type</span>
                <span className="font-semibold text-[var(--ca-text)] capitalize">{resource.accessType.replace("_", " ")}</span>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">License & Copyright</span>
                <span className="font-semibold text-[var(--ca-text)]">{resource.license || "Not specified"}</span>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Formats Available</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(resource.formats || ["HTML"]).map((fmt) => (
                    <span key={fmt} className="px-2 py-0.5 rounded bg-[var(--ca-surface-raised)] text-[var(--ca-text)] font-mono">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Frameworks & Programs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.frameworks.map((fw) => (
                    <button
                      key={fw}
                      className="px-2 py-0.5 rounded bg-[var(--ca-surface-raised)] text-[var(--ca-text)] font-medium hover:text-[var(--ca-primary)]"
                      onClick={() => onNavigate("search", { query: fw })}
                      type="button"
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Target Audiences</span>
                <p className="text-[var(--ca-text-muted)]">{resource.audiences.join(", ")}</p>
              </div>

              <div>
                <span className="text-[var(--ca-secondary)] block mb-0.5">Lifecycle Stages</span>
                <p className="text-[var(--ca-text-muted)]">{resource.lifecycleStages.join(", ")}</p>
              </div>
            </div>

            {/* Explicitly related Atlas records: frameworks above are a
                curated, source-backed link into Search — never a fabricated
                graph edge. No Resource has an implementation relationship to
                a record unless it is asserted here, by name. */}
            {resource.frameworks.length ? (
              <div className="rounded-md border border-[var(--ca-border)] bg-[var(--ca-surface)] p-5 space-y-2 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ca-text-muted)] border-b border-[var(--ca-border)] pb-2">
                  Explicitly related Atlas records
                </h3>
                <p className="text-[var(--ca-text-muted)]">
                  Search Control Atlas for records connected to{" "}
                  {resource.frameworks.join(", ")}.
                </p>
                <button
                  className="text-[var(--ca-primary)] font-semibold hover:underline"
                  onClick={() => onNavigate("search", { query: resource.frameworks[0] })}
                  type="button"
                >
                  Search Atlas records →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
