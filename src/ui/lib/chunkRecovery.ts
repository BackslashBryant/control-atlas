/**
 * A deploy replaces every hashed chunk. A tab opened before that deploy still
 * holds the previous entry bundle, so the first route it lazy-loads afterwards
 * 404s and the workspace reports that its data is unavailable — the random
 * error on assorted pages that a manual retry fixes, because the retry fetches
 * the current index.html. Reloading on that specific failure does the retry
 * automatically.
 *
 * Rate-limited rather than once-per-session: a second deploy during a long
 * session deserves the same recovery, but a chunk that is genuinely gone must
 * surface as an error instead of reloading in a loop.
 */

export const CHUNK_RELOAD_KEY = "control-atlas:chunk-reload-at";
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

/**
 * Matches how browsers word a failed dynamic import. Deliberately narrow: a
 * data-fetch failure inside a route must still reach the error surface, which
 * offers a retry that does not throw the page away.
 */
const CHUNK_FAILURE_PATTERN =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

export function isChunkLoadFailure(error: unknown): boolean {
  if (error && typeof error === "object" && (error as { name?: string }).name === "ChunkLoadError") {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error || "");
  return CHUNK_FAILURE_PATTERN.test(message);
}

export type ReloadClock = { now: () => number; storage: Pick<Storage, "getItem" | "setItem"> | null };

/** Returns true at most once per cooldown, and records the attempt. */
export function claimChunkReload(clock: ReloadClock): boolean {
  const { now, storage } = clock;
  // Storage blocked (private mode, embedded frame). Without a loop guard the
  // page could reload forever, so show the error instead.
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_KEY) || 0);
    const at = now();
    if (Number.isFinite(last) && last > 0 && at - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
    storage.setItem(CHUNK_RELOAD_KEY, String(at));
    return true;
  } catch {
    return false;
  }
}

export function browserReloadClock(): ReloadClock {
  let storage: ReloadClock["storage"];
  try {
    storage = globalThis.sessionStorage ?? null;
  } catch {
    // Reading sessionStorage throws outright when storage is blocked.
    storage = null;
  }
  return { now: () => Date.now(), storage };
}
