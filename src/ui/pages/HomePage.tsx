import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { BrandFlourish, BrandMark } from "../components/BrandLockup";
import { Button, Input, Panel, StatusChip } from "../components/lsm";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

export function HomePage(props: HomePageProps) {
  const { onNavigate } = props;
  const [searchDraft, setSearchDraft] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <section className="landing-hero max-w-[1280px] mx-auto px-[24px]">
      <div
        aria-hidden="true"
        className="font-mono text-[10px] text-[var(--ca-text-muted)] uppercase tracking-[0.1em] mb-[48px] pt-[24px]"
      >
        CATL / PUBLIC REFERENCE / 01
      </div>

      <div className="landing-signal-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[48px] items-start mb-[64px]">
        <div>
          <p className="font-mono text-[11px] text-[var(--ca-secondary)] uppercase tracking-[0.14em] font-bold mb-[12px]">
            Depth 0 · Signal
          </p>
          <div className="flex items-center gap-[16px] mb-[16px]">
            <BrandMark />
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] tracking-[-0.04em] leading-tight m-0 text-[var(--ca-text)]">
              Control Atlas
            </h1>
          </div>
          <div className="mb-[24px]">
            <BrandFlourish />
          </div>
          <p className="text-[clamp(1.1rem,2vw,1.25rem)] text-[var(--ca-text-muted)] leading-relaxed max-w-[640px]">
            The public map for federal cyber compliance. Search controls, trace
            framework connections, and create starter documents.
          </p>
        </div>

        <Panel
          aria-label="Current product state"
          title="Archive reference"
          className="mt-[32px] lg:mt-0"
        >
          <div className="mb-[16px]">
            <StatusChip status="success">Public reference workspace</StatusChip>
          </div>
          <dl className="grid gap-[12px] mb-[24px] text-[13px]">
            <div className="flex justify-between border-b border-[var(--ca-border)] pb-[8px]">
              <dt className="text-[var(--ca-text-muted)]">Access</dt>
              <dd className="text-[var(--ca-text)] font-medium">No login or uploads</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--ca-border)] pb-[8px]">
              <dt className="text-[var(--ca-text-muted)]">Sources</dt>
              <dd className="text-[var(--ca-text)] font-medium">Traceable to publishers</dd>
            </div>
            <div className="flex justify-between pb-[8px]">
              <dt className="text-[var(--ca-text-muted)]">Output</dt>
              <dd className="text-[var(--ca-text)] font-medium">Created in your browser</dd>
            </div>
          </dl>
          <Button
            variant="editorial"
            className="primary landing-primary-action"
            aria-describedby="landing-primary-hint"
            onClick={() => onNavigate("start-here")}
          >
            Start here
          </Button>
          <p id="landing-primary-hint" className="text-[11px] text-[var(--ca-text-muted)] mt-[12px] text-center">
            Answer three questions to find a practical starting path.
          </p>
        </Panel>
      </div>

      <div className="mb-[64px] max-w-[800px] mx-auto text-center">
        <div className="mb-[32px]">
          <p className="font-mono text-[11px] text-[var(--ca-secondary)] uppercase tracking-[0.14em] font-bold mb-[8px]">
            Already know what you need?
          </p>
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] m-0">
            Find a control, topic, or identifier.
          </h2>
        </div>
        <div
          className={`transition-all duration-200 ${searchFocused ? "scale-[1.02]" : "scale-100"}`}
        >
          <form
            className="relative flex items-center w-full max-w-[640px] mx-auto"
            onSubmit={(event) => {
              event.preventDefault();
              const query = searchDraft.trim();
              if (!query) return;
              onNavigate("search", { query });
            }}
            role="search"
          >
            <div className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none text-[var(--ca-text-muted)]">
              <IconSearch aria-hidden="true" size={20} stroke={2} />
            </div>
            <Input
              aria-label="Search controls, baselines, CCIs, STIGs, and terms"
              onBlur={() => setSearchFocused(false)}
              onChange={(event) => setSearchDraft(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Try AC-2, encryption, passwords…"
              type="search"
              value={searchDraft}
              className="pl-[48px] pr-[120px] rounded-full min-h-[56px] text-[16px] shadow-lg bg-[var(--ca-surface-raised)]"
            />
            <div className="absolute inset-y-0 right-[4px] flex items-center">
              <Button variant="primary" className="rounded-full min-h-[48px] px-[24px]" type="submit">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <details className="landing-more-paths mb-[64px] border border-[var(--ca-border-strong)] rounded-[8px] overflow-hidden group max-w-[1000px] mx-auto">
        <summary className="p-[16px] bg-[var(--ca-surface-raised)] cursor-pointer hover:bg-[color-mix(in_srgb,var(--ca-surface-raised),white_5%)] list-none font-mono uppercase tracking-wider text-[12px] font-bold text-center">
          Open another workspace
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--ca-border-strong)] border-t border-[var(--ca-border-strong)]">
          <button
            className="flex flex-col items-center justify-center text-center p-[32px] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)] transition-colors cursor-pointer border-none"
            onClick={() => onNavigate("patterns")}
            type="button"
          >
            <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[8px]">Plan the work</strong>
            <span className="text-[var(--ca-text-muted)] text-[13px]">Choose a common compliance job and see what to do.</span>
          </button>
          <button
            className="flex flex-col items-center justify-center text-center p-[32px] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)] transition-colors cursor-pointer border-none"
            onClick={() => onNavigate("templates")}
            type="button"
          >
            <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[8px]">Create a document</strong>
            <span className="text-[var(--ca-text-muted)] text-[13px]">Open a starter file for the work in front of you.</span>
          </button>
          <button
            className="flex flex-col items-center justify-center text-center p-[32px] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)] transition-colors cursor-pointer border-none"
            onClick={() => onNavigate("atlas-map")}
            type="button"
          >
            <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[8px]">Trace connections</strong>
            <span className="text-[var(--ca-text-muted)] text-[13px]">See how controls, requirements, and evidence relate.</span>
          </button>
        </div>
      </details>

      <div className="flex flex-col md:flex-row items-center justify-between gap-[24px] max-w-[1000px] mx-auto mb-[64px] py-[32px] border-t border-[var(--ca-border)]">
        <p className="text-[var(--ca-text-muted)] text-[13px] m-0">
          Review the product boundary and source record before relying on a
          match.
        </p>
        <div className="flex gap-[16px]">
          <Button
            variant="secondary"
            className="border-transparent!"
            onClick={() => onNavigate("about")}
          >
            About this tool
          </Button>
          <Button
            variant="secondary"
            className="border-transparent!"
            onClick={() => onNavigate("sources")}
          >
            Review sources
          </Button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="font-mono text-[10px] text-[var(--ca-text-muted)] uppercase tracking-[0.1em] text-right pb-[24px]"
      >
        ORIENT / WORK / VERIFY
      </div>
    </section>
  );
}
