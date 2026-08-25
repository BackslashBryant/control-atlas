export type AtlasBrandSignal = {
  id: string;
  label: string;
  category: "source" | "content" | "topic" | "action";
  count: number;
  priority: number;
  splashEligible: boolean;
};

export type AtlasScopeMetrics = {
  records: number;
  connections: number;
  publications: number;
  compact: {
    records: string;
    connections: string;
    publications: string;
  };
};

declare global {
  // Vite replaces these properties with build-time values derived from the
  // generated corpus. The fallback only keeps non-Vite module tests importable.
  var __ATLAS_BRAND_SIGNALS__: AtlasBrandSignal[] | undefined;
  var __ATLAS_SCOPE_METRICS__: AtlasScopeMetrics | undefined;
}

const FALLBACK_SIGNAL: AtlasBrandSignal = Object.freeze({
  id: "action-find",
  label: "Find",
  category: "action",
  count: 1,
  priority: 1,
  splashEligible: true,
});

export const ATLAS_BRAND_SIGNALS = Object.freeze(
  globalThis.__ATLAS_BRAND_SIGNALS__?.length
    ? globalThis.__ATLAS_BRAND_SIGNALS__
    : [FALLBACK_SIGNAL],
);

export const ATLAS_SCOPE_METRICS = globalThis.__ATLAS_SCOPE_METRICS__;
