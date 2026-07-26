#!/usr/bin/env node
/**
 * Builds the NIST SP 800-53 Revision 4 -> Revision 5 control correspondence, and
 * uses it to give the CCI records that DISA never re-mapped a real Rev 5 parent.
 *
 * Why this exists: 1,301 of the 5,137 records in the official DISA CCI List cite
 * only SP 800-53 Revision 3/4 — DISA's own list was never re-issued against
 * Revision 5 for those items. Measured before this script existed, they were the
 * single largest block of isolated nodes in the graph
 * (docs/audits/grc-hierarchy-audit-2026-07-25.md). The gap is closed with
 * published federal documents only; nothing here is inferred or scored:
 *
 *   1. Carried forward — the Rev 4 control id still exists in the Rev 5 catalog
 *      this repo already ingests (data/controls-800-53.json). NIST kept the
 *      numbering and documented the per-control deltas in the comparison
 *      workbook, so the correspondence is identity.
 *   2. Withdrawn — the Rev 4 control was withdrawn in Rev 5 and NIST's comparison
 *      workbook names the absorbing control ("Incorporated into MP-4 and SC-28").
 *   3. Appendix J — the Rev 4 privacy controls (AP/AR/DI/DM/IP/SE/TR/UL) were
 *      folded into the integrated Rev 5 catalog, and NIST publishes a dedicated
 *      Appendix J crosswalk for them.
 *
 * A Rev 4 control that none of the three resolve is left unmapped and counted in
 * the `unresolved` block of the crosswalk file. Leaving a record honestly
 * unparented is correct; guessing a parent for it is not.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readXlsxFile from "read-excel-file/node";
import { normalizeNistControlId } from "../tools/importers/cci-adapter.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const COMPARISON_URL =
  "https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r4-to-r5-comparison-workbook.xlsx";
const COMPARISON_SHEET = "Rev4 Rev5 Compared";
const APPENDIX_J_URL =
  "https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r4-appj-to-r5-comparison.xlsx";
const APPENDIX_J_SHEET = "SP 800-53 Rev 4 App J to Rev 5";

const CONTROL_ID = /^([A-Z]{2,3}-\d+)(?:\s*\((\d+)\))?/;
const CONTROL_ID_SCAN = /([A-Z]{2,3}-\d+)(?:\s*\((\d+)\))?/g;

function checksum(buffer) {
  return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}

/** "AC-2(10)" -> "AC-2.10", matching the id shape in data/controls-800-53.json. */
function toControlId(value) {
  const match = CONTROL_ID.exec(String(value ?? "").trim());
  if (!match) return null;
  return match[2] ? `${match[1]}.${Number.parseInt(match[2], 10)}` : match[1];
}

/** Every control id inside a free-text phrase, e.g. "MP-4 and SC-28". */
function scanControlIds(text) {
  const ids = [];
  for (const match of String(text ?? "").matchAll(CONTROL_ID_SCAN)) {
    ids.push(
      match[2] ? `${match[1]}.${Number.parseInt(match[2], 10)}` : match[1],
    );
  }
  return [...new Set(ids)];
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed for ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) throw new Error(`Download for ${url} was empty`);
  return buffer;
}

async function readSheet(buffer, sheetName, url) {
  const workbook = await readXlsxFile(buffer);
  const sheet = workbook.find((entry) => entry.sheet === sheetName);
  if (!sheet) {
    const found = workbook.map((entry) => entry.sheet).join(", ");
    throw new Error(`${url} has no "${sheetName}" sheet (found: ${found})`);
  }
  return sheet.data;
}

/**
 * Withdrawn Rev 4 controls -> the Rev 5 controls that absorbed them.
 * Column 0 is the control id, column 8 the change note NIST writes as
 * "Incorporated into X" or "Previously withdrawn in Rev4; Incorporated into X and Y".
 */
export function parseWithdrawnMap(rows) {
  const withdrawn = {};
  for (const row of rows) {
    const controlId = toControlId(row?.[0]);
    if (!controlId) continue;
    const note = String(row?.[8] ?? "");
    const incorporated = /incorporated into (.+)$/is.exec(note);
    if (!incorporated) continue;
    const targets = scanControlIds(incorporated[1]);
    if (targets.length === 0) continue;
    withdrawn[controlId] = { targets, note: note.replace(/\s+/g, " ").trim() };
  }
  return withdrawn;
}

/**
 * Rev 4 Appendix J privacy controls -> their Rev 5 homes. The Rev 5 column lists
 * one "ID: Title" per line; rows whose Rev 5 cell is prose ("No specific control
 * reflects AR-7...") carry no mapping and are recorded with an empty target list
 * rather than dropped, so the honest gap stays visible.
 */
export function parseAppendixJMap(rows) {
  const appendixJ = {};
  for (const row of rows) {
    const source = String(row?.[0] ?? "").trim();
    if (!/^[A-Z]{2,3}-\d+(?:\(\d+\))?\s*:/.test(source)) continue;
    const controlId = toControlId(source);
    if (!controlId) continue;
    const targets = [];
    for (const line of String(row?.[1] ?? "").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!/^[A-Z]{2,3}-\d+(?:\(\d+\))?\s*:/.test(trimmed)) continue;
      const target = toControlId(trimmed);
      if (target) targets.push(target);
    }
    appendixJ[controlId] = {
      targets: [...new Set(targets)],
      note: String(row?.[1] ?? "").replace(/\s+/g, " ").trim(),
    };
  }
  return appendixJ;
}

/**
 * CCI records with no Revision 5 reference, resolved through the crosswalk.
 * Revision 4 references are preferred; Revision 3 is the fallback for the older
 * CCIs that never got a Rev 4 line either.
 */
export function deriveCciRelationships({ ccis, controlIds, crosswalk }) {
  const relationships = [];
  const unresolved = new Map();
  const stats = { records: 0, carried_forward: 0, withdrawn: 0, appendix_j: 0, unresolved: 0 };

  for (const record of ccis.records || []) {
    const references = record.references || [];
    if (references.some((reference) => reference.title === "NIST SP 800-53 Revision 5")) continue;
    stats.records += 1;

    const revision4 = references.filter((r) => r.title === "NIST SP 800-53 Revision 4");
    const revision3 = references.filter((r) => r.title === "NIST SP 800-53");
    const chosen = revision4.length > 0 ? revision4 : revision3;
    const revisionLabel = revision4.length > 0 ? "Revision 4" : "Revision 3";

    const seen = new Set();
    let resolvedAny = false;

    for (const reference of chosen) {
      const legacyId = normalizeNistControlId(reference.index);
      if (!legacyId) continue;

      let targets = [];
      let why = "";
      let basis = "";

      if (controlIds.has(legacyId)) {
        targets = [legacyId];
        basis = "carried_forward";
        why =
          `The official DISA CCI List references NIST SP 800-53 ${revisionLabel} ${reference.index}. ` +
          `${legacyId} is carried forward into Revision 5 under the same identifier, per NIST's ` +
          `SP 800-53 Rev 4 to Rev 5 comparison workbook.`;
      } else if (crosswalk.appendix_j[legacyId]?.targets.length) {
        targets = crosswalk.appendix_j[legacyId].targets;
        basis = "appendix_j";
        why =
          `The official DISA CCI List references NIST SP 800-53 ${revisionLabel} ${reference.index}. ` +
          `${legacyId} is an Appendix J privacy control; NIST's Appendix J to Revision 5 comparison ` +
          `maps it to ${crosswalk.appendix_j[legacyId].targets.join(", ")}.`;
      } else if (crosswalk.withdrawn[legacyId]?.targets.length) {
        targets = crosswalk.withdrawn[legacyId].targets;
        basis = "withdrawn";
        why =
          `The official DISA CCI List references NIST SP 800-53 ${revisionLabel} ${reference.index}. ` +
          `${legacyId} was withdrawn in Revision 5; NIST's comparison workbook records it as ` +
          `"${crosswalk.withdrawn[legacyId].note}".`;
      } else {
        unresolved.set(legacyId, (unresolved.get(legacyId) || 0) + 1);
        continue;
      }

      for (const target of targets) {
        // A withdrawn control can be absorbed by something outside this catalog;
        // an edge to a node that does not exist is a finding, not a mapping.
        if (!controlIds.has(target)) {
          unresolved.set(target, (unresolved.get(target) || 0) + 1);
          continue;
        }
        const key = `${record.id}->${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        resolvedAny = true;
        stats[basis] += 1;
        relationships.push({
          source_id: record.id,
          target_id: target,
          relationship_type: "maps_to",
          confidence: "derived",
          basis,
          why,
          source_locator: `U_CCI_List.xml#${record.id}`,
          evidence_source: "nist-800-53-rev4-rev5-crosswalk",
        });
      }
    }

    if (!resolvedAny) stats.unresolved += 1;
  }

  return {
    relationships,
    stats,
    unresolved: Object.fromEntries([...unresolved.entries()].sort((a, b) => b[1] - a[1])),
  };
}

function readJson(path) {
  if (!existsSync(path)) throw new Error(`Required input is missing: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

export async function buildCrosswalk(options = {}) {
  const comparisonBuffer = options.comparisonBuffer || (await download(COMPARISON_URL));
  const appendixJBuffer = options.appendixJBuffer || (await download(APPENDIX_J_URL));

  const withdrawn = parseWithdrawnMap(
    await readSheet(comparisonBuffer, COMPARISON_SHEET, COMPARISON_URL),
  );
  const appendixJ = parseAppendixJMap(
    await readSheet(appendixJBuffer, APPENDIX_J_SHEET, APPENDIX_J_URL),
  );

  if (Object.keys(withdrawn).length === 0) {
    throw new Error("Comparison workbook produced no withdrawn-control mappings");
  }
  if (Object.keys(appendixJ).length === 0) {
    throw new Error("Appendix J workbook produced no privacy-control mappings");
  }

  return {
    schema_version: "1.0",
    source_key: "nist-800-53-rev4-rev5-crosswalk",
    provenance:
      "NIST-published SP 800-53 Revision 4 to Revision 5 control correspondences. " +
      "Withdrawn-control targets come from the comparison workbook; privacy-control " +
      "targets come from the Appendix J comparison. No mapping here is inferred.",
    artifacts: [
      { url: COMPARISON_URL, sheet: COMPARISON_SHEET, checksum: checksum(comparisonBuffer) },
      { url: APPENDIX_J_URL, sheet: APPENDIX_J_SHEET, checksum: checksum(appendixJBuffer) },
    ],
    withdrawn,
    appendix_j: appendixJ,
  };
}

async function main() {
  const crosswalk = await buildCrosswalk();
  const crosswalkPath = join(ROOT, "data", "800-53-rev4-to-rev5-crosswalk.json");
  writeFileSync(crosswalkPath, `${JSON.stringify(crosswalk, null, 2)}\n`, "utf8");

  const ccis = readJson(join(ROOT, "data", "ccis.json"));
  const controls = readJson(join(ROOT, "data", "controls-800-53.json"));
  const controlIds = new Set((controls.records || []).map((record) => record.id));

  const derived = deriveCciRelationships({ ccis, controlIds, crosswalk });
  const mapPath = join(ROOT, "maps", "cci-to-800-53-rev4.json");
  writeFileSync(
    mapPath,
    `${JSON.stringify(
      {
        schema_version: "2.0",
        source_key: "nist-800-53-rev4-rev5-crosswalk",
        source_artifact: COMPARISON_URL,
        source_version: crosswalk.artifacts[0].checksum,
        snapshot_date: new Date().toISOString().slice(0, 10),
        checksum: crosswalk.artifacts[0].checksum,
        provenance: crosswalk.provenance,
        coverage: derived.stats,
        unresolved_legacy_controls: derived.unresolved,
        relationships: derived.relationships,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `Crosswalk: ${Object.keys(crosswalk.withdrawn).length} withdrawn, ` +
      `${Object.keys(crosswalk.appendix_j).length} Appendix J mappings`,
  );
  console.log(
    `CCI: ${derived.stats.records} records without a Rev 5 reference -> ` +
      `${derived.relationships.length} relationships ` +
      `(${derived.stats.carried_forward} carried forward, ${derived.stats.appendix_j} Appendix J, ` +
      `${derived.stats.withdrawn} withdrawn); ${derived.stats.unresolved} still unmapped`,
  );
}

if (process.argv[1]?.includes("fetch-800-53-rev4-rev5-crosswalk.mjs")) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
