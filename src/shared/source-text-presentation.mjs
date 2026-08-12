export const STRUCTURED_CONTENT_VERSION = 1;

/**
 * @typedef {{kind: "paragraph", start: number, end: number} |
 *   {kind: "code", start: number, end: number, language: string} |
 *   {kind: "list", ordered: boolean, items: Array<{start: number, end: number}>}}
 *   StructuredContentBlock
 */

const NUMBERED_ITEM = /^\s*(\d+)[.)]\s+/;
const BULLETED_ITEM = /^\s*[-*•]\s+/;
const PROCEDURE_ACTION = /^\s*(?:navigate|open|create|set|run|enter|verify|compare|ensure|restart|configure|add|remove|update|save|select|click|choose)\b/i;
const SHELL_PROMPT = /^\s*[$#]\s+/;
const CODE_CONTINUATION = /^\s*(?:[$#]\s+|[A-Za-z_][\w.-]*\s*(?:\(|=)|[)}\]};]|\S.*(?:[=;{}]|\\)$)/;
const INLINE_COMMAND = /(?:run|execute|enter|use)\b[^.\n]{0,140}?(?:command|following)\s*:\s*([$#]\s+[\s\S]*?)(?=\s+(?:if|when|then|verify|compare|ensure)\b|$)/i;
const INLINE_FILE_PROCEDURE = /Navigate to and open:\s*([\s\S]*?)\s+(Create the file if it does not exist\.)\s+(Set the contents of the file as follows:)\s*/gi;

function lineRanges(text) {
  const ranges = [];
  let start = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const end = start + line.length;
    ranges.push({ start, end, contentEnd: line.endsWith("\n") ? end - 1 : end, text: line.replace(/\n$/, "") });
    start = end;
  }
  return ranges;
}

function isBlank(line) {
  return !line.text.trim();
}

function listKind(line) {
  if (NUMBERED_ITEM.test(line.text)) return "ordered";
  if (BULLETED_ITEM.test(line.text)) return "unordered";
  return null;
}

function itemStart(line, kind) {
  const match = kind === "ordered" ? line.text.match(NUMBERED_ITEM) : line.text.match(BULLETED_ITEM);
  return line.start + (match?.[0].length || 0);
}

function codeLine(line) {
  return SHELL_PROMPT.test(line.text) || CODE_CONTINUATION.test(line.text);
}

function makeParagraph(start, end) {
  return start < end ? { kind: "paragraph", start, end } : null;
}

function inlineCommandPresentation(text) {
  const match = INLINE_COMMAND.exec(text);
  if (!match || match.index === undefined) return null;
  const commandStart = match.index + match[0].lastIndexOf(match[1]);
  const commandEnd = commandStart + match[1].length;
  const blocks = [
    makeParagraph(0, commandStart),
    { kind: "code", start: commandStart, end: commandEnd, language: "shell" },
    makeParagraph(commandEnd, text.length),
  ].filter(Boolean);
  return { version: STRUCTURED_CONTENT_VERSION, blocks };
}

function inlineFileProcedurePresentation(text) {
  const blocks = [];
  let cursor = 0;
  let match;
  INLINE_FILE_PROCEDURE.lastIndex = 0;
  while ((match = INLINE_FILE_PROCEDURE.exec(text)) !== null) {
    const matchStart = match.index;
    const actionStart = matchStart;
    const createStart = matchStart + match[0].indexOf(match[2]);
    const setStart = matchStart + match[0].indexOf(match[3]);
    const codeStart = matchStart + match[0].length;
    if (!text.slice(codeStart).startsWith("# ")) continue;
    const nextProcedure = text.indexOf("Navigate to and open:", codeStart);
    const codeEnd = nextProcedure < 0 ? text.length : nextProcedure;
    const lead = makeParagraph(cursor, actionStart);
    if (lead) blocks.push(lead);
    blocks.push({
      kind: "list",
      ordered: false,
      items: [
        { start: actionStart, end: createStart - 1 },
        { start: createStart, end: setStart - 1 },
        { start: setStart, end: codeStart - 1 },
      ],
    });
    blocks.push({ kind: "code", start: codeStart, end: codeEnd, language: "shell" });
    cursor = codeEnd;
    if (nextProcedure < 0) break;
    INLINE_FILE_PROCEDURE.lastIndex = nextProcedure;
  }
  INLINE_FILE_PROCEDURE.lastIndex = 0;
  const tail = makeParagraph(cursor, text.length);
  if (tail) blocks.push(tail);
  return blocks.some((block) => block.kind === "code")
    ? { version: STRUCTURED_CONTENT_VERSION, blocks }
    : null;
}

/**
 * Builds presentation-only offsets over publisher text. The text remains the
 * canonical source field; the offsets allow a renderer to add structure
 * without duplicating or rewriting the corpus.
 */
export function buildSourceTextPresentation(value) {
  const text = String(value || "");
  if (!text.trim()) return { version: STRUCTURED_CONTENT_VERSION, blocks: [] };

  // Publisher importers may preserve paragraph breaks around paths and
  // configuration bodies. Detect the semantic file procedure before the
  // line-oriented fallback so equivalent one-line and multiline source text
  // receive the same list + exact-code presentation.
  const fileProcedure = inlineFileProcedurePresentation(text);
  if (fileProcedure) return fileProcedure;

  const lines = lineRanges(text);
  if (lines.length === 1) return inlineCommandPresentation(text) || {
    version: STRUCTURED_CONTENT_VERSION,
    blocks: [{ kind: "paragraph", start: 0, end: text.length }],
  };

  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    if (isBlank(lines[index])) {
      index += 1;
      continue;
    }

    const kind = listKind(lines[index]);
    if (kind) {
      const items = [];
      let cursor = index;
      while (cursor < lines.length && listKind(lines[cursor]) === kind) {
        items.push({ start: itemStart(lines[cursor], kind), end: lines[cursor].contentEnd });
        cursor += 1;
      }
      if (items.length >= 2) {
        blocks.push({ kind: "list", ordered: kind === "ordered", items });
        index = cursor;
        continue;
      }
    }

    if (SHELL_PROMPT.test(lines[index].text)) {
      let cursor = index + 1;
      while (cursor < lines.length && (isBlank(lines[cursor]) || codeLine(lines[cursor]))) cursor += 1;
      blocks.push({ kind: "code", start: lines[index].start, end: lines[cursor - 1].contentEnd, language: "shell" });
      index = cursor;
      continue;
    }

    if (PROCEDURE_ACTION.test(lines[index].text)) {
      const items = [];
      let cursor = index;
      while (cursor < lines.length && PROCEDURE_ACTION.test(lines[cursor].text)) {
        items.push({ start: lines[cursor].start, end: lines[cursor].contentEnd });
        cursor += 1;
      }
      if (items.length >= 2) {
        blocks.push({ kind: "list", ordered: false, items });
        index = cursor;
        continue;
      }
    }

    const start = lines[index].start;
    let cursor = index + 1;
    while (cursor < lines.length && !isBlank(lines[cursor]) && !listKind(lines[cursor]) && !SHELL_PROMPT.test(lines[cursor].text)) cursor += 1;
    blocks.push({ kind: "paragraph", start, end: lines[cursor - 1].contentEnd });
    index = cursor;
  }

  return { version: STRUCTURED_CONTENT_VERSION, blocks };
}

export function isValidSourceTextPresentation(value, presentation) {
  const text = String(value || "");
  if (!presentation || presentation.version !== STRUCTURED_CONTENT_VERSION || !Array.isArray(presentation.blocks)) return false;
  const validRange = (range) => Number.isInteger(range?.start)
    && Number.isInteger(range?.end)
    && range.start >= 0
    && range.end > range.start
    && range.end <= text.length;
  return presentation.blocks.every((block) => {
    if (block.kind === "list") return Array.isArray(block.items) && block.items.every(validRange);
    return (block.kind === "paragraph" || block.kind === "code") && validRange(block);
  });
}
