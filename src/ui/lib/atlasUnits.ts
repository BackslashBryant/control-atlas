/**
 * What a cell's number actually counts, in the words practitioners use.
 *
 * The map used to count everything in "publications" and "records". Both are
 * this repository's vocabulary, not the reader's: nobody working an
 * authorization says they have 1,216 records to satisfy. Every catalog already
 * carries the right word — catalogProfiles' `recordLabel` gives "Controls" for
 * SP 800-53, "Techniques" for ATT&CK, "STIG rules" for DISA, "Baselines" for
 * FedRAMP — so the map says that instead, per framework, rather than flattening
 * twenty-eight different things into one database noun.
 */

/** A label naming several kinds of thing at once ("Rules and definitions"). */
function isCompound(label: string): boolean {
  return /,| and /i.test(label);
}

/** Acronyms keep their case; ordinary words are lowercased mid-sentence. */
function cased(word: string): string {
  return word === word.toUpperCase() && /[A-Z]/.test(word)
    ? word
    : word.toLocaleLowerCase();
}

function singularise(word: string): string {
  if (/ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/(ch|sh|ss|x|z)es$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word) && !/(ss|us|is)$/i.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * "Controls" + 148 → "controls"; "Controls" + 1 → "control";
 * "STIG rules" + 1 → "STIG rule"; "Rules and definitions" stays plural because
 * singularising only its last word would invent a phrase nobody writes.
 */
export function unitNounFor(recordLabel: string, count: number): string {
  const label = String(recordLabel || "").trim();
  if (!label) return "";
  const words = label.split(/\s+/).map(cased);
  if (count === 1 && !isCompound(label)) {
    words[words.length - 1] = singularise(words[words.length - 1]);
  }
  return words.join(" ");
}

/** "1,216 controls" — the count decides the form, never the caller. */
export function withUnitNoun(count: number, recordLabel?: string): string {
  const formatted = count.toLocaleString("en-US");
  const noun = recordLabel ? unitNounFor(recordLabel, count) : "";
  return noun ? `${formatted} ${noun}` : formatted;
}
