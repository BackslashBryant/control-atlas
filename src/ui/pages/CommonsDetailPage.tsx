import React, { useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconExternalLink,
  IconShieldCheck,
  IconCode,
  IconUsers,
  IconBuildingStore,
  IconArchive,
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
import type { CommonsResource, CommonsResourceLane } from "../lib/commonsTypes";

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
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <IconAlertTriangle size={48} className="mx-auto text-amber-400 mb-3" />
          <h2 className="text-xl font-bold">Resource Not Found</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            The resource ID "{resourceId}" could not be found in Control Commons.
          </p>
          <button
            onClick={() => onNavigate("commons")}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow"
          >
            Return to Commons Hub
          </button>
        </div>
      </div>
    );
  }

  const laneBadgeConfig: Record<
    CommonsResourceLane,
    { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number }> }
  > = {
    official: { label: "Official Government Source", bg: "bg-blue-900/40 border-blue-500/40", text: "text-blue-300", icon: IconShieldCheck },
    open_source: { label: "Open Source Tool / Project", bg: "bg-emerald-900/40 border-emerald-500/40", text: "text-emerald-300", icon: IconCode },
    practitioner: { label: "Practitioner Knowledge / Template", bg: "bg-purple-900/40 border-purple-500/40", text: "text-purple-300", icon: IconUsers },
    commercial: { label: "Commercial / Proprietary Resource", bg: "bg-amber-900/40 border-amber-500/40", text: "text-amber-300", icon: IconBuildingStore },
    legacy: { label: "Legacy / Historical Record", bg: "bg-zinc-800 border-zinc-600", text: "text-zinc-400", icon: IconArchive }
  };

  const lane = laneBadgeConfig[resource.resourceLane] || laneBadgeConfig.official;
  const LaneIcon = lane.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Back Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            onClick={() => onNavigate("commons")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to Commons Hub
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {copied ? <IconCheck size={14} className="text-emerald-400" /> : <IconCopy size={14} />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
            <a
              href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <IconFlag size={14} />
              <span>Report Issue</span>
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Header Block */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${lane.bg} ${lane.text}`}>
              <LaneIcon size={14} />
              {lane.label}
            </span>

            {resource.editorialRecommendation ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-700 text-amber-300">
                <IconSparkles size={13} />
                Editorially Recommended
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              Status: {resource.maintenanceStatus}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {resource.name}
          </h1>

          <p className="text-xs text-slate-400 mt-2 mb-4">
            Published by <span className="font-semibold text-slate-200">{resource.publisher}</span>
            {resource.maintainer ? ` · Maintained by ${resource.maintainer}` : ""}
            {resource.currentVersion ? ` · Version: ${resource.currentVersion}` : ""}
            {resource.lastCheckedAt ? ` · Last checked: ${resource.lastCheckedAt}` : ""}
          </p>

          <p className="text-base text-slate-200 leading-relaxed mb-6">
            {resource.summary}
          </p>

          {/* Primary Action Button */}
          <div className="flex flex-wrap gap-3">
            <a
              href={resource.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg transition-colors"
            >
              <span>Open Canonical Resource</span>
              <IconExternalLink size={16} />
            </a>

            {resource.repositoryUrl ? (
              <a
                href={resource.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-colors"
              >
                <IconCode size={16} />
                <span>Source Repository</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Supersession Warning Callout */}
        {resource.resourceLane === "legacy" || supersedingResource ? (
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-5 mb-8 flex items-start gap-3">
            <IconAlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                Legacy / Superseded Resource Notice
              </h3>
              <p className="text-xs text-rose-200 mt-1">
                {resource.legacyReason || "This resource has been superseded by a newer official standard or tool."}
              </p>
              {supersedingResource ? (
                <button
                  onClick={() => onNavigate("commons-detail", { id: supersedingResource.id })}
                  className="mt-2 text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
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
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-3">
                <IconInfoCircle size={18} />
                Why This Resource Is Included
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                {resource.whyIncluded}
              </p>
              {resource.editorialNotes ? (
                <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-cyan-400 block mb-1">Editorial Note:</span>
                  {resource.editorialNotes}
                </div>
              ) : null}
            </section>

            {/* Practical Companion Resources */}
            {companionResources.length > 0 ? (
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
                  <IconSparkles size={18} className="text-cyan-400" />
                  Recommended Companion Tools & Templates
                </h2>
                <div className="space-y-4">
                  {companionResources.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-lg border border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <button
                          onClick={() => onNavigate("commons-detail", { id: comp.id })}
                          className="text-sm font-semibold text-slate-100 hover:text-cyan-400 text-left"
                        >
                          {comp.name}
                        </button>
                        <p className="text-xs text-slate-400 mt-1">{comp.summary}</p>
                      </div>
                      <a
                        href={comp.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 shrink-0 inline-flex items-center gap-1"
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
              <section className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Warnings & Usage Guidance
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-200">
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
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                Metadata & Access
              </h3>

              <div>
                <span className="text-slate-400 block mb-0.5">Resource Lane</span>
                <span className="font-semibold text-slate-200 capitalize">{resource.resourceLane.replace("_", " ")}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Access Type</span>
                <span className="font-semibold text-slate-200 capitalize">{resource.accessType.replace("_", " ")}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">License & Copyright</span>
                <span className="font-semibold text-slate-200">{resource.license || "Not specified"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Formats Available</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(resource.formats || ["HTML"]).map((fmt) => (
                    <span key={fmt} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Frameworks & Programs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.frameworks.map((fw) => (
                    <span key={fw} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-medium">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Target Audiences</span>
                <p className="text-slate-300">{resource.audiences.join(", ")}</p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Lifecycle Stages</span>
                <p className="text-slate-300">{resource.lifecycleStages.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
