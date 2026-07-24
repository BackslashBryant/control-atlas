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
    <section className="rounded-md border border-[color-mix(in_srgb,var(--ca-primary)_30%,transparent)] bg-gradient-to-br from-[var(--ca-surface)] via-[var(--ca-surface)] to-[color-mix(in_srgb,var(--ca-primary)_10%,transparent)] p-6 shadow-md my-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 rounded-sm bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] border border-[color-mix(in_srgb,var(--ca-primary)_60%,transparent)] text-[var(--ca-primary)]">
          <IconSparkles size={18} />
        </span>
        <div>
          <h3 className="text-base font-bold text-[var(--ca-text)] uppercase tracking-wide">
            Official-Plus-Practical Pairing
          </h3>
          <p className="text-xs text-[var(--ca-secondary)]">
            Official governing requirement paired with maintained practical implementation tools and templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Governing Official Source */}
        <div className="rounded-sm border border-[color-mix(in_srgb,var(--ca-info)_40%,transparent)] bg-[color-mix(in_srgb,var(--ca-bg)_80%,transparent)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] text-[var(--ca-primary)] border border-[color-mix(in_srgb,var(--ca-primary)_50%,transparent)] flex items-center gap-1">
                <IconShieldCheck size={13} />
                Governing Source
              </span>
              <span className="text-xs text-[var(--ca-secondary)]">{officialResource.publisher}</span>
            </div>

            <h4 className="text-base font-semibold text-[var(--ca-text)] mb-2">
              <button
                onClick={() => onSelectResource(officialResource.id)}
                className="text-left bg-transparent hover:text-[var(--ca-primary)] transition-colors"
              >
                {officialResource.name}
              </button>
            </h4>

            <p className="text-xs text-[var(--ca-text)] leading-relaxed mb-3">
              {officialResource.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--ca-border)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--ca-secondary)]">
              {officialResource.currentVersion || "Current standard"}
            </span>
            <a
              href={officialResource.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[var(--ca-primary)] hover:brightness-110 inline-flex items-center gap-1"
            >
              Open official source <IconExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Use It With (Practical Companions) */}
        <div className="commons-practical-panel rounded-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="commons-practical-badge">
              <IconTools size={13} />
              Use It With
            </span>
            <span className="text-xs text-[var(--ca-secondary)]">Practical Tools & Community</span>
          </div>

          {companionResources.length === 0 ? (
            <p className="text-xs text-[var(--ca-secondary)] italic">No companion tools indexed yet.</p>
          ) : (
            <div className="space-y-3">
              {companionResources.map((comp) => (
                <div
                  key={comp.id}
                  className="p-2.5 rounded-sm border border-[var(--ca-border)] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)] transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium bg-transparent text-[var(--ca-text)] hover:text-[var(--ca-primary)]"
                        onClick={() => onSelectResource(comp.id)}
                      >
                        {comp.shortName || comp.name}
                      </button>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--ca-surface-raised)] text-[var(--ca-text)] capitalize">
                        {comp.resourceLane.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ca-secondary)] line-clamp-1 mt-0.5">
                      {comp.whyIncluded}
                    </p>
                  </div>
                  <a
                    href={comp.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--ca-secondary)] hover:text-[var(--ca-primary)] shrink-0 p-1"
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
