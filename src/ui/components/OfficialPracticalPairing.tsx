import React from "react";
import { IconShieldCheck, IconTools, IconExternalLink, IconSparkles } from "@tabler/icons-react";
import type { CommonsResource } from "../lib/commonsTypes";

type OfficialPracticalPairingProps = {
  officialResource: CommonsResource;
  companionResources: CommonsResource[];
  onSelectResource: (id: string) => void;
};

export function OfficialPracticalPairing({
  officialResource,
  companionResources,
  onSelectResource
}: OfficialPracticalPairingProps) {
  return (
    <section className="rounded-xl border border-cyan-900/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 p-6 shadow-xl my-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
          <IconSparkles size={18} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
            Official-Plus-Practical Pairing
          </h3>
          <p className="text-xs text-slate-400">
            Official governing requirement paired with maintained practical implementation tools and templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Governing Official Source */}
        <div className="rounded-lg border border-blue-900/50 bg-slate-950/80 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50 flex items-center gap-1">
                <IconShieldCheck size={13} />
                Governing Source
              </span>
              <span className="text-xs text-slate-400">{officialResource.publisher}</span>
            </div>

            <h4 className="text-base font-semibold text-slate-100 mb-2">
              <button
                onClick={() => onSelectResource(officialResource.id)}
                className="text-left hover:text-cyan-400 transition-colors"
              >
                {officialResource.name}
              </button>
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {officialResource.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {officialResource.currentVersion || "Current standard"}
            </span>
            <a
              href={officialResource.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Open official source <IconExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Use It With (Practical Companions) */}
        <div className="commons-practical-panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="commons-practical-badge">
              <IconTools size={13} />
              Use It With
            </span>
            <span className="text-xs text-slate-400">Practical Tools & Community</span>
          </div>

          {companionResources.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No companion tools indexed yet.</p>
          ) : (
            <div className="space-y-3">
              {companionResources.map((comp) => (
                <div
                  key={comp.id}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-200 hover:text-cyan-400"
                        onClick={() => onSelectResource(comp.id)}
                      >
                        {comp.shortName || comp.name}
                      </button>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 capitalize">
                        {comp.resourceLane.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {comp.whyIncluded}
                    </p>
                  </div>
                  <a
                    href={comp.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-cyan-400 shrink-0 p-1"
                    title="Open link"
                  >
                    <IconExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
