/**
 * Client-side Office Open XML (OOXML) serializers for generated templates.
 *
 * Renders the structured template document from {@link buildTemplateDocument}
 * into real `.xlsx` (spreadsheet) and `.docx` (word-processing) files, entirely
 * in the browser — no upload, no server round-trip, matching the tool's
 * browser-only posture (CATL-73).
 *
 * We hand-write the minimal OOXML parts and zip them with `fflate` (a single
 * zero-dependency MIT library) rather than pulling in a heavy office toolkit
 * with a large transitive dependency/licence surface. The same code runs in
 * Node (tests) and the browser.
 */

import { strToU8, zipSync } from "fflate";
import { PRODUCT_DISCLAIMER as DISCLAIMER } from "../shared/disclaimer.mjs";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/** Escape a value for XML text/attribute content, dropping XML-1.0-illegal control chars. */
function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Strip characters illegal in XML 1.0 (tab/newline/CR are kept).
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

/** Zero-based column index → spreadsheet column letter (0 → A, 26 → AA). */
function columnLetter(index) {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/** Excel sheet names: ≤31 chars, no \ / ? * [ ] :, and unique (case-insensitive). */
function sanitizeSheetName(name, used) {
  const base =
    String(name || "Sheet")
      .replace(/[\\/?*[\]:]/g, " ")
      .trim()
      .slice(0, 31) || "Sheet";
  let candidate = base;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${counter++}`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Map the typed document sections to worksheets (one per table + a Notes sheet). */
function docToSheets(doc) {
  const used = new Set();
  const sheets = [];
  for (const section of doc.sections || []) {
    if (section.type === "table") {
      sheets.push({
        name: sanitizeSheetName(section.heading, used),
        rows: [section.headers || [], ...(section.rows || [])],
      });
    }
  }
  const notesRows = [
    ["Field", "Value"],
    ["Title", doc.title],
    ["Description", doc.description],
    ["Disclaimer", DISCLAIMER],
  ];
  for (const section of doc.sections || []) {
    if (section.type === "text") {
      notesRows.push([section.heading, section.content]);
    }
  }
  sheets.push({ name: sanitizeSheetName("Notes", used), rows: notesRows });
  return sheets;
}

/**
 * Approximate per-column widths (Excel character units) from the widest cell
 * in each column, clamped so ID columns stay readable (~12) and prompt-length
 * text wraps inside a bounded column (~60) instead of stretching the sheet.
 */
function columnWidths(rows) {
  const widths = [];
  for (const row of rows || []) {
    (row || []).forEach((cell, i) => {
      const len = String(cell ?? "").length;
      if (widths[i] === undefined || len > widths[i]) widths[i] = len;
    });
  }
  return widths.map((len) => Math.min(60, Math.max(12, len + 2)));
}

/** Minimal styles part: cellXf 0 = default, cellXf 1 = bold wrapped header. */
const XLSX_STYLES_XML =
  `${XML_DECL}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>" +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  "</cellXfs>" +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  "</styleSheet>";

function sheetXml(rows) {
  let out = `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;
  // Freeze the header row so it stays visible while scrolling the data rows.
  out +=
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    "</sheetView></sheetViews>";
  const widths = columnWidths(rows);
  if (widths.length > 0) {
    out += `<cols>${widths
      .map(
        (w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
      )
      .join("")}</cols>`;
  }
  out += "<sheetData>";
  rows.forEach((row, rowIndex) => {
    out += `<row r="${rowIndex + 1}">`;
    // Row 1 is always the header row; style it bold + wrapped (cellXf 1).
    const style = rowIndex === 0 ? ' s="1"' : "";
    (row || []).forEach((cell, colIndex) => {
      const ref = `${columnLetter(colIndex)}${rowIndex + 1}`;
      out += `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
        cell,
      )}</t></is></c>`;
    });
    out += "</row>";
  });
  out += "</sheetData></worksheet>";
  return out;
}

/**
 * Serialize the document to a `.xlsx` workbook.
 * @param {any} doc
 * @returns {Uint8Array}
 */
export function docToXlsx(doc) {
  const sheets = docToSheets(doc);
  /** @type {import("fflate").Zippable} */
  const files = {};

  let overrides = "";
  let workbookSheets = "";
  let workbookRels = "";
  sheets.forEach((sheet, i) => {
    const index = i + 1;
    const rid = `rId${index}`;
    overrides += `<Override PartName="/xl/worksheets/sheet${index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    workbookSheets += `<sheet name="${escapeXml(sheet.name)}" sheetId="${index}" r:id="${rid}"/>`;
    workbookRels += `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index}.xml"/>`;
    files[`xl/worksheets/sheet${index}.xml`] = strToU8(sheetXml(sheet.rows));
  });

  const stylesRid = `rId${sheets.length + 1}`;
  workbookRels += `<Relationship Id="${stylesRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
  files["xl/styles.xml"] = strToU8(XLSX_STYLES_XML);

  files["[Content_Types].xml"] = strToU8(
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      `${overrides}</Types>`,
  );
  files["_rels/.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>",
  );
  files["xl/workbook.xml"] = strToU8(
    `${XML_DECL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>${workbookSheets}</sheets></workbook>`,
  );
  files["xl/_rels/workbook.xml.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}</Relationships>`,
  );

  return zipSync(files);
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

function docxParagraph(text, opts = {}) {
  const runProps = [];
  if (opts.bold) runProps.push("<w:b/>");
  if (opts.size) {
    runProps.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  }
  if (opts.color) runProps.push(`<w:color w:val="${opts.color}"/>`);
  const rPr = runProps.length ? `<w:rPr>${runProps.join("")}</w:rPr>` : "";
  const pPr = opts.spacingBefore
    ? `<w:pPr><w:spacing w:before="${opts.spacingBefore}"/></w:pPr>`
    : "";
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(
    text,
  )}</w:t></w:r></w:p>`;
}

/** Usable page width in twips — keep in sync with the <w:sectPr> page size and margins below. */
const DOCX_CONTENT_WIDTH_TWIPS = 12240 - 1440 - 1440;

/**
 * Distribute the usable page width across columns, weighting each column by
 * its widest cell (clamped) so ID columns stay narrow and prompt columns get
 * room. The rounding remainder lands on the last column so the grid always
 * sums to the full content width.
 */
function docxColumnWidths(headers, rows) {
  const weights = (headers || []).map((h) => String(h ?? "").length);
  for (const row of rows || []) {
    (row || []).forEach((cell, i) => {
      const len = String(cell ?? "").length;
      if (weights[i] === undefined || len > weights[i]) weights[i] = len;
    });
  }
  const clamped = weights.map((len) => Math.min(50, Math.max(10, len)));
  const total = clamped.reduce((a, b) => a + b, 0) || 1;
  let widths = clamped.map((w) =>
    Math.floor((DOCX_CONTENT_WIDTH_TWIPS * w) / total),
  );
  if (widths.length > 0) {
    // Guarantee every column a readable floor (~0.5", capped at an equal
    // share) so ID columns never collapse to slivers next to prompt columns;
    // shrink the above-floor columns proportionally to pay for it.
    const floor = Math.min(
      720,
      Math.floor(DOCX_CONTENT_WIDTH_TWIPS / widths.length),
    );
    let deficit = 0;
    let pool = 0;
    for (const w of widths) {
      if (w < floor) deficit += floor - w;
      else pool += w - floor;
    }
    if (deficit > 0 && pool > 0) {
      widths = widths.map((w) =>
        w < floor
          ? floor
          : floor + Math.floor(((w - floor) * (pool - deficit)) / pool),
      );
    }
    const used = widths.reduce((a, b) => a + b, 0);
    widths[widths.length - 1] += DOCX_CONTENT_WIDTH_TWIPS - used;
  }
  return widths;
}

function docxTable(headers, rows) {
  const borders = ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map(
      (edge) =>
        `<w:${edge} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`,
    )
    .join("");
  const widths = docxColumnWidths(headers, rows);
  const cell = (text, colIndex, isHeader) => {
    const rPr = isHeader ? "<w:rPr><w:b/></w:rPr>" : "";
    const shd = isHeader
      ? '<w:shd w:val="clear" w:color="auto" w:fill="EFEFEF"/>'
      : "";
    const tcPr = `<w:tcPr><w:tcW w:w="${widths[colIndex] ?? 0}" w:type="dxa"/>${shd}</w:tcPr>`;
    return `<w:tc>${tcPr}<w:p><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(
      text,
    )}</w:t></w:r></w:p></w:tc>`;
  };
  // Fixed layout + explicit grid: Word renders the table at page width instead
  // of auto-sizing ~1,000-row tables (which collapses/clips columns).
  let out = `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>`;
  out += `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  // <w:tblHeader/> repeats the header row at the top of every page.
  out += `<w:tr><w:trPr><w:tblHeader/></w:trPr>${(headers || [])
    .map((h, i) => cell(h, i, true))
    .join("")}</w:tr>`;
  for (const row of rows || []) {
    out += `<w:tr>${(row || []).map((c, i) => cell(c, i, false)).join("")}</w:tr>`;
  }
  out += "</w:tbl>";
  return out;
}

/**
 * Serialize the document to a `.docx` word-processing file.
 * @param {any} doc
 * @returns {Uint8Array}
 */
export function docToDocx(doc) {
  let body = "";
  body += docxParagraph(doc.title, { bold: true, size: 36 });
  if (doc.description) body += docxParagraph(doc.description);
  body += docxParagraph(`Disclaimer: ${DISCLAIMER}`, {
    size: 18,
    color: "666666",
  });
  for (const section of doc.sections || []) {
    body += docxParagraph(section.heading, {
      bold: true,
      size: 28,
      spacingBefore: 200,
    });
    if (section.type === "text") {
      body += docxParagraph(section.content);
    } else if (section.type === "table") {
      body += docxTable(section.headers, section.rows);
      // Word requires a paragraph between/after tables.
      body += "<w:p/>";
    }
  }

  const documentXml =
    `${XML_DECL}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
    body +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>';

  /** @type {import("fflate").Zippable} */
  const files = {};
  files["[Content_Types].xml"] = strToU8(
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>",
  );
  files["_rels/.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>",
  );
  files["word/document.xml"] = strToU8(documentXml);

  return zipSync(files);
}

/**
 * Render a document to the requested office format.
 * @param {any} doc
 * @param {"xlsx" | "docx"} format
 * @returns {{ bytes: Uint8Array, mimeType: string, extension: string }}
 */
export function renderOfficeDocument(doc, format) {
  if (format === "xlsx") {
    return { bytes: docToXlsx(doc), mimeType: XLSX_MIME, extension: "xlsx" };
  }
  if (format === "docx") {
    return { bytes: docToDocx(doc), mimeType: DOCX_MIME, extension: "docx" };
  }
  throw new Error(`Unsupported office format: ${format}`);
}

export const OFFICE_MIME_TYPES = { xlsx: XLSX_MIME, docx: DOCX_MIME };
