/**
 * The names people arrive already thinking in.
 *
 * Nobody starts a search for "SP 800-53 Rev. 5 Catalog" — they start from
 * "RMF", or "Zero Trust", or "we're getting CMMC certified". Those are not
 * catalog titles, and a map labelled only with catalog titles makes the reader
 * translate before they can begin. Each entry here is a way in named the way
 * it is spoken, pointing at the publication that actually holds it.
 *
 * Deliberately short. This is the set of doors people walk up to, not an index
 * of everything published — the landscape itself is the index, and it is one
 * click away on the same screen.
 */
export type AtlasLensEntry = {
  id: string;
  /** What the reader calls it. */
  label: string;
  /** What they get, in their words, not the publisher's. */
  blurb: string;
  ecosystemId: string;
  publicationId: string;
};

export const ATLAS_LENS_ENTRIES: readonly AtlasLensEntry[] = Object.freeze([
  {
    id: "rmf",
    label: "RMF",
    blurb: "The 800-53 control catalog",
    ecosystemId: "ecosystem:nist",
    publicationId: "nist-800-53",
  },
  {
    id: "csf",
    label: "CSF",
    blurb: "Outcomes by function",
    ecosystemId: "ecosystem:nist",
    publicationId: "csf-2",
  },
  {
    id: "zero-trust",
    label: "Zero Trust",
    blurb: "DoD pillars and activities",
    ecosystemId: "ecosystem:dod-cio",
    publicationId: "dod-zt",
  },
  {
    id: "cmmc",
    label: "CMMC",
    blurb: "Contractor certification levels",
    ecosystemId: "ecosystem:dod",
    publicationId: "cmmc-2",
  },
  {
    id: "cui",
    label: "CUI",
    blurb: "800-171 protection requirements",
    ecosystemId: "ecosystem:nist",
    publicationId: "nist-800-171",
  },
  {
    id: "attack",
    label: "ATT&CK",
    blurb: "Adversary techniques",
    ecosystemId: "ecosystem:mitre",
    publicationId: "mitre-attack",
  },
  {
    id: "stigs",
    label: "STIGs",
    blurb: "Configuration rules",
    ecosystemId: "ecosystem:disa",
    publicationId: "disa-stig",
  },
]);
