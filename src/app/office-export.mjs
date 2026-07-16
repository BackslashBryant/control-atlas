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
export function officeDocumentToSheets(doc) {
  const used = new Set();
  const sheets = [];
  const fieldGuideRows = [["Table", "Field", "Starter value or expected entry"]];
  for (const section of doc.sections || []) {
    if (section.type === "table") {
      const headers = section.headers || [];
      const rows = section.rows || [];
      const representative = rows.find((row) =>
        (row || []).some((cell) => String(cell ?? "").trim()),
      ) || [];
      headers.forEach((header, index) => {
        fieldGuideRows.push([
          section.heading,
          header,
          representative[index] || "Enter the value named by this field.",
        ]);
      });
      const preserveSingleSheet = section.heading === "STIG Viewer CSV Import Rows";
      const maxColumns = preserveSingleSheet ? Number.POSITIVE_INFINITY : 8;
      if (headers.length <= maxColumns) {
        sheets.push({
          name: sanitizeSheetName(section.heading, used),
          kind: "data",
          headers,
          rows: [headers, ...rows],
        });
        continue;
      }

      // Wide operational registers remain convenient on screen but become
      // illegible when printed at one page wide. Split them into keyed views:
      // the first identity column repeats on every sheet, followed by at most
      // seven related fields. CSV/JSON exports retain the complete flat schema.
      const detailCount = headers.length - 1;
      const partCount = Math.ceil(detailCount / 7);
      const baseSize = Math.floor(detailCount / partCount);
      const largerParts = detailCount % partCount;
      let start = 1;
      for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
        const size = baseSize + (partIndex < largerParts ? 1 : 0);
        const indexes = [0];
        for (let index = start; index < start + size; index += 1) {
          indexes.push(index);
        }
        const splitHeaders = indexes.map((index) => headers[index]);
        const splitRows = rows.map((row) => indexes.map((index) => row[index] ?? ""));
        sheets.push({
          name: sanitizeSheetName(`${section.heading} ${partIndex + 1}`, used),
          kind: "data",
          headers: splitHeaders,
          rows: [splitHeaders, ...splitRows],
        });
        start += size;
      }
    }
  }
  sheets.push({
    name: sanitizeSheetName("Field Guide", used),
    kind: "guide",
    headers: fieldGuideRows[0],
    rows: fieldGuideRows,
  });
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
  sheets.push({
    name: sanitizeSheetName("Read Me", used),
    kind: "notes",
    headers: notesRows[0],
    rows: notesRows,
  });
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
  return widths.map((len) => Math.min(52, Math.max(12, len + 2)));
}

/**
 * A restrained federal-workbook palette. CellXfs:
 * 0 body, 1 table header, 2 notes label, 3 notes value.
 */
const XLSX_STYLES_XML =
  `${XML_DECL}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  '<fonts count="2"><font><sz val="10"/><name val="Aptos"/><family val="2"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos Display"/><family val="2"/></font></fonts>' +
  '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17365D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF5"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD6DEE8"/></left><right style="thin"><color rgb="FFD6DEE8"/></right><top style="thin"><color rgb="FFD6DEE8"/></top><bottom style="thin"><color rgb="FFD6DEE8"/></bottom><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  "</cellXfs>" +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  "</styleSheet>";

const VALIDATION_VALUES = {
  status: ["Not Started", "Draft", "Planned", "Ready", "In Progress", "Implemented", "Inherited", "Open", "Ongoing", "Blocked", "Complete", "Completed", "Closed", "Risk Accepted", "Not Applicable"],
  severity: ["Very High", "Critical", "High", "Moderate", "Low", "Very Low"],
  priority: ["Critical", "High", "Moderate", "Low"],
  confidence: ["High", "Medium", "Low"],
  "assessment method": ["Examine", "Interview", "Test", "Combination"],
  "inheritance type": ["Fully inherited", "Hybrid", "Not inherited"],
  publicfacing: ["true", "false"],
  virtualasset: ["true", "false"],
  criticalasset: ["true", "false"],
};

function validationXml(headers, rowCount) {
  const validations = [];
  for (const [index, header] of (headers || []).entries()) {
    const values = VALIDATION_VALUES[String(header).trim().toLowerCase()];
    if (!values) continue;
    const col = columnLetter(index);
    const lastRow = Math.max(250, rowCount + 50);
    validations.push(
      `<dataValidation type="list" allowBlank="1" showErrorMessage="1" showInputMessage="1" errorTitle="Choose a listed value" error="Use one of the values in the dropdown." promptTitle="Controlled value" prompt="Choose a value from the list." sqref="${col}2:${col}${lastRow}"><formula1>&quot;${values.join(",")}&quot;</formula1></dataValidation>`,
    );
  }
  return validations.length
    ? `<dataValidations count="${validations.length}">${validations.join("")}</dataValidations>`
    : "";
}

function sheetXml(sheet) {
  const rows = sheet.rows || [];
  let out = `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;
  // Excel only honors fitToWidth consistently when fit-to-page is enabled in
  // sheet properties. This keeps every keyed view on one landscape page wide
  // while allowing as many vertical pages as its records require.
  out += '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>';
  // Freeze the header row so it stays visible while scrolling the data rows.
  out +=
    '<sheetViews><sheetView workbookViewId="0">' +
    '<showGridLines val="0"/>' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    "</sheetView></sheetViews>";
  out += '<sheetFormatPr defaultRowHeight="18"/>';
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
    const height = rowIndex === 0 ? ' ht="30" customHeight="1"' : "";
    out += `<row r="${rowIndex + 1}"${height}>`;
    // Row 1 is always the header row; style it bold + wrapped (cellXf 1).
    const style = rowIndex === 0 ? ' s="1"' : "";
    (row || []).forEach((cell, colIndex) => {
      const ref = `${columnLetter(colIndex)}${rowIndex + 1}`;
      const notesStyle = sheet.kind !== "data" && rowIndex > 0
        ? ` s="${colIndex === 0 ? 2 : 3}"`
        : style;
      out += `<c r="${ref}"${notesStyle} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
        cell,
      )}</t></is></c>`;
    });
    out += "</row>";
  });
  out += "</sheetData>";
  if (sheet.kind === "data" && rows.length > 0 && (sheet.headers || []).length > 0) {
    const lastColumn = columnLetter(sheet.headers.length - 1);
    out += `<autoFilter ref="A1:${lastColumn}${Math.max(1, rows.length)}"/>`;
    out += validationXml(sheet.headers, rows.length);
  }
  out += '<printOptions horizontalCentered="0" verticalCentered="0"/>';
  out += '<pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>';
  out += '<pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="0"/>';
  out += '<headerFooter><oddFooter>&amp;LControl Atlas reference aid&amp;RPage &amp;P of &amp;N</oddFooter></headerFooter>';
  out += "</worksheet>";
  return out;
}

/**
 * Serialize the document to a `.xlsx` workbook.
 * @param {any} doc
 * @returns {Uint8Array}
 */
export function docToXlsx(doc) {
  const sheets = officeDocumentToSheets(doc);
  /** @type {import("fflate").Zippable} */
  const files = {};

  let overrides = "";
  let workbookSheets = "";
  let workbookRels = "";
  let definedNames = "";
  sheets.forEach((sheet, i) => {
    const index = i + 1;
    const rid = `rId${index}`;
    overrides += `<Override PartName="/xl/worksheets/sheet${index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    workbookSheets += `<sheet name="${escapeXml(sheet.name)}" sheetId="${index}" r:id="${rid}"/>`;
    const formulaSheetName = String(sheet.name).replaceAll("'", "''");
    definedNames += `<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${escapeXml(`'${formulaSheetName}'!$1:$1`)}</definedName>`;
    workbookRels += `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index}.xml"/>`;
    files[`xl/worksheets/sheet${index}.xml`] = strToU8(sheetXml(sheet));
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
      `<sheets>${workbookSheets}</sheets><definedNames>${definedNames}</definedNames></workbook>`,
  );
  files["xl/_rels/workbook.xml.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}</Relationships>`,
  );

  return zipSync(files);
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

function cleanInlineMarkdown(text) {
  return String(text ?? "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function docxParagraph(text, opts = {}) {
  const runProps = ['<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'];
  if (opts.bold) runProps.push("<w:b/>");
  if (opts.italic) runProps.push("<w:i/>");
  if (opts.size) {
    runProps.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  }
  if (opts.color) runProps.push(`<w:color w:val="${opts.color}"/>`);
  const pProps = [];
  if (opts.style) pProps.push(`<w:pStyle w:val="${opts.style}"/>`);
  const before = opts.spacingBefore ?? 0;
  const after = opts.spacingAfter ?? 100;
  pProps.push(`<w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>`);
  if (opts.keepNext) pProps.push("<w:keepNext/>");
  if (opts.pageBreakBefore) pProps.push("<w:pageBreakBefore/>");
  if (opts.indentLeft) pProps.push(`<w:ind w:left="${opts.indentLeft}" w:hanging="${opts.hanging || 0}"/>`);
  if (opts.bullet) pProps.push('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
  return `<w:p><w:pPr>${pProps.join("")}</w:pPr><w:r><w:rPr>${runProps.join("")}</w:rPr><w:t xml:space="preserve">${escapeXml(
    cleanInlineMarkdown(text),
  )}</w:t></w:r></w:p>`;
}

function docxTextBlock(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return docxParagraph("", { spacingAfter: 40 });
      if (/^[-*]\s+/.test(trimmed)) {
        return docxParagraph(trimmed.replace(/^[-*]\s+/, ""), {
          bullet: true,
          spacingAfter: 60,
        });
      }
      return docxParagraph(trimmed);
    })
    .join("");
}

function docxPromptBlock(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.includes(" | ") || /\r|\n/.test(trimmed)) {
    return null;
  }
  const content = trimmed.startsWith("[") && trimmed.endsWith("]")
    ? trimmed.slice(1, -1)
    : trimmed;
  const rows = content
    .split(" | ")
    .map((rawField) => {
      const field = rawField.trim();
      const separator = field.indexOf(":");
      return separator > 0
        ? [field.slice(0, separator).trim(), field.slice(separator + 1).trim()]
        : [field, ""];
    });
  return docxTable(["Field", "Response"], rows);
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
        `<w:${edge} w:val="single" w:sz="4" w:space="0" w:color="C7D1DE"/>`,
    )
    .join("");
  const widths = docxColumnWidths(headers, rows);
  const cell = (text, colIndex, isHeader) => {
    const rPr = isHeader
      ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>'
      : '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>';
    const shd = isHeader
      ? '<w:shd w:val="clear" w:color="auto" w:fill="17365D"/>'
      : "";
    const tcPr = `<w:tcPr><w:tcW w:w="${widths[colIndex] ?? 0}" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/>${shd}</w:tcPr>`;
    return `<w:tc>${tcPr}<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(
      cleanInlineMarkdown(text),
    )}</w:t></w:r></w:p></w:tc>`;
  };
  // Fixed layout + explicit grid: Word renders the table at page width instead
  // of auto-sizing ~1,000-row tables (which collapses/clips columns).
  let out = `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblInd w:w="120" w:type="dxa"/><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>`;
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

function docxRecordCards(section) {
  const headers = section.headers || [];
  const rows = section.rows || [];
  let out = "";
  for (const [index, row] of rows.entries()) {
    const titleBits = [row[0], row[1]].filter(Boolean);
    out += docxParagraph(titleBits.join(" — ") || `Record ${index + 1}`, {
      bold: true,
      color: "17365D",
      size: 20,
      spacingBefore: index === 0 ? 40 : 160,
      spacingAfter: 60,
      keepNext: true,
    });
    const detailHeaders = ["Field", "Response or guidance"];
    const detailRows = headers.slice(2).map((header, detailIndex) => [
      header,
      row[detailIndex + 2] ?? "",
    ]);
    out += docxTable(detailHeaders, detailRows);
  }
  return out;
}

const DOCX_STYLES_XML =
  `${XML_DECL}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="20242C"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="100"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="17365D"/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="140"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="17365D"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>' +
  '</w:styles>';

const DOCX_NUMBERING_XML =
  `${XML_DECL}<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
  '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="180"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum>' +
  '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

const DOCX_HEADER_XML =
  `${XML_DECL}<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="667085"/><w:sz w:val="16"/></w:rPr><w:t>CONTROL ATLAS  |  REFERENCE AID</w:t></w:r></w:p></w:hdr>`;

const DOCX_FOOTER_XML =
  `${XML_DECL}<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="667085"/><w:sz w:val="16"/></w:rPr><w:t>Page </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;

/**
 * Serialize the document to a `.docx` word-processing file.
 * @param {any} doc
 * @returns {Uint8Array}
 */
export function docToDocx(doc) {
  let body = "";
  body += docxParagraph(doc.title, {
    style: "Title",
    bold: true,
    size: 44,
    color: "17365D",
    spacingBefore: 120,
    spacingAfter: 100,
  });
  if (doc.description) {
    body += docxParagraph(doc.description, {
      size: 22,
      color: "475467",
      spacingAfter: 220,
    });
  }
  body += `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblInd w:w="120" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="D6DEE8"/><w:left w:val="single" w:sz="6" w:color="D6DEE8"/><w:bottom w:val="single" w:sz="6" w:color="D6DEE8"/><w:right w:val="single" w:sz="6" w:color="D6DEE8"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:val="clear" w:fill="F4F6F9"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar></w:tcPr>${docxParagraph(`Important: ${DISCLAIMER}`, { size: 17, color: "475467", spacingAfter: 0 })}</w:tc></w:tr></w:tbl><w:p/>`;
  for (const section of doc.sections || []) {
    body += docxParagraph(section.heading, {
      style: "Heading1",
      bold: true,
      size: 30,
      color: "17365D",
      spacingBefore: 320,
      spacingAfter: 140,
      keepNext: true,
    });
    if (section.type === "text") {
      const promptBlock = docxPromptBlock(section.content);
      body += promptBlock || docxTextBlock(section.content);
      if (promptBlock) body += "<w:p/>";
    } else if (section.type === "table") {
      body += section.heading === "Control Baseline"
        ? docxRecordCards(section)
        : docxTable(section.headers, section.rows);
      // Word requires a paragraph between/after tables.
      body += "<w:p/>";
    }
  }

  const documentXml =
    `${XML_DECL}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
    body +
    '<w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="500" w:footer="500"/></w:sectPr></w:body></w:document>';

  const documentXmlWithRelationships = documentXml.replace(
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
  );

  /** @type {import("fflate").Zippable} */
  const files = {};
  files["[Content_Types].xml"] = strToU8(
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
      '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
      "</Types>",
  );
  files["_rels/.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>",
  );
  files["word/_rels/document.xml.rels"] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
      '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
      "</Relationships>",
  );
  files["word/document.xml"] = strToU8(documentXmlWithRelationships);
  files["word/styles.xml"] = strToU8(DOCX_STYLES_XML);
  files["word/numbering.xml"] = strToU8(DOCX_NUMBERING_XML);
  files["word/header1.xml"] = strToU8(DOCX_HEADER_XML);
  files["word/footer1.xml"] = strToU8(DOCX_FOOTER_XML);

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
