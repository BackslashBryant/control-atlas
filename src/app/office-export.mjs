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

function sheetXml(rows) {
  let out = `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`;
  rows.forEach((row, rowIndex) => {
    out += `<row r="${rowIndex + 1}">`;
    (row || []).forEach((cell, colIndex) => {
      const ref = `${columnLetter(colIndex)}${rowIndex + 1}`;
      out += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
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

  files["[Content_Types].xml"] = strToU8(
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
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

function docxTable(headers, rows) {
  const borders = ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map(
      (edge) =>
        `<w:${edge} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`,
    )
    .join("");
  const cell = (text, bold) => {
    const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
    return `<w:tc><w:p><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(
      text,
    )}</w:t></w:r></w:p></w:tc>`;
  };
  let out = `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${borders}</w:tblBorders></w:tblPr>`;
  out += `<w:tr>${(headers || []).map((h) => cell(h, true)).join("")}</w:tr>`;
  for (const row of rows || []) {
    out += `<w:tr>${(row || []).map((c) => cell(c, false)).join("")}</w:tr>`;
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
