function withoutHtmlComments(value) {
  const text = String(value || '');
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('<!--', cursor);
    if (start < 0) {
      chunks.push(text.slice(cursor));
      break;
    }
    chunks.push(text.slice(cursor, start));
    const end = text.indexOf('-->', start + 4);
    if (end < 0) break;
    cursor = end + 3;
  }
  return chunks.join(' ');
}

function withoutHtmlTags(value) {
  const text = String(value || '');
  let output = '';
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '<' || !/[A-Za-z/!]/.test(text[index + 1] || '')) {
      output += text[index];
      continue;
    }
    let quote = '';
    let end = index + 1;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (quote) {
        if (char === quote) quote = '';
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        break;
      }
    }
    if (end >= text.length) {
      output += text[index];
      continue;
    }
    output += ' ';
    index = end;
  }
  return output;
}

/**
 * Convert publisher README Markdown to plain text for a JSON-backed React text
 * surface. HTML comments and tags are parsed as bounded structures rather than
 * "sanitized" with multi-character replacement expressions.
 */
export function markdownToPlainText(value) {
  return withoutHtmlTags(withoutHtmlComments(value))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
