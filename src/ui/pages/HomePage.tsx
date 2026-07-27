import {
  IconBinaryTree,
  IconRoute,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { BrandFlourish, BrandMark } from "../components/BrandLockup";
import { Button, Input } from "../components/lsm";
import { PRIMARY_NAV_ITEMS } from "../lib/navigation";
import { NIST_FRAMEWORK_ID } from "../lib/atlasDrilldown";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

export function HomePage(props: HomePageProps) {
  const { onNavigate } = props;
  const [searchDraft, setSearchDraft] = useState("");

  return (
    <section className="landing-hero max-w-[1280px] mx-auto px-[24px]">
      <div>
        <div className="flex items-center gap-[16px] mb-[8px]">
          <BrandMark />
          <h1 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] tracking-[-0.04em] leading-tight m-0 text-[var(--ca-text)]">
            Control Atlas
          </h1>
        </div>
        <div className="mb-[12px]">
          <BrandFlourish />
        </div>
        <p className="text-[clamp(1rem,1.6vw,1.15rem)] text-[var(--ca-text-muted)] leading-relaxed max-w-[640px]">
          The public map for federal cyber compliance. Search controls and trace how frameworks connect.
        </p>
      </div>

      <div className="landing-ancestry-intro">
        <p className="eyebrow">Choose how you want to trace the system</p>
        <h2>Follow one branch at a time</h2>
        <p>
          Like a family tree, the Atlas shows what each item belongs to and
          where its related branches lead.
        </p>
      </div>

      <div className="landing-ancestry-grid">
        <button
          className="landing-ancestry-card"
          onClick={() =>
            onNavigate("atlas-map", {
              atlasAxis: "framework",
              atlasFramework: NIST_FRAMEWORK_ID,
            })
          }
          type="button"
        >
          <IconBinaryTree aria-hidden="true" size={24} stroke={1.7} />
          <span>
            <strong>Trace a framework</strong>
            <small>NIST SP 800-53 → baseline → family → control</small>
          </span>
        </button>
        <button
          className="landing-ancestry-card"
          onClick={() =>
            onNavigate("atlas-map", {
              atlasAxis: "process",
              atlasRmfStep: "",
            })
          }
          type="button"
        >
          <IconRoute aria-hidden="true" size={24} stroke={1.7} />
          <span>
            <strong>Follow the RMF process</strong>
            <small>Choose a lifecycle step, then see its published results</small>
          </span>
        </button>
        <button
          className="landing-ancestry-card"
          onClick={() => onNavigate("start-here")}
          type="button"
        >
          <IconSparkles aria-hidden="true" size={24} stroke={1.7} />
          <span>
            <strong>Start with my situation</strong>
            <small>Answer three questions for a practical starting point</small>
          </span>
        </button>
      </div>

      <div className="max-w-[640px]">
        <form
          className="relative flex items-center w-full"
          onSubmit={(event) => {
            event.preventDefault();
            const query = searchDraft.trim();
            if (!query) return;
            onNavigate("search", { query });
          }}
          role="search"
        >
          <div className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none text-[var(--ca-text-muted)]">
            <IconSearch aria-hidden="true" size={18} stroke={2} />
          </div>
          <Input
            aria-label="Search controls, baselines, CCIs, STIGs, and terms"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Or search directly — try AC-2, encryption, passwords…"
            type="search"
            value={searchDraft}
            className="pl-[44px] pr-[100px] rounded-full min-h-[48px] text-[15px] bg-[var(--ca-surface-raised)]"
          />
          <div className="absolute inset-y-0 right-[4px] flex items-center">
            <Button variant="primary" className="rounded-full min-h-[40px] px-[20px]" type="submit">
              Search
            </Button>
          </div>
        </form>
      </div>

      <div className="landing-shortcuts">
        <p className="eyebrow">More ways to explore</p>
        <div className="landing-shortcut-grid">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="landing-shortcut"
                key={item.view}
                onClick={() => onNavigate(item.view, item.patch)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} stroke={1.6} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-[16px] max-w-[1000px] pt-[16px] border-t border-[var(--ca-border)]">
        <p className="text-[var(--ca-text-muted)] text-[12px] m-0">
          Public reference data, sourced directly from NIST, DISA, and MITRE. No login, no uploads.
        </p>
        <div className="flex gap-[12px]">
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
    </section>
  );
}
