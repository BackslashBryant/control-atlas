/**
 * @param {string} relationshipType
 * @returns {string}
 */
function relationshipLabel(relationshipType) {
  return String(relationshipType || 'connects to').replaceAll('_', ' ');
}

/**
 * @param {{ metadata?: { title?: string, item_id?: string, description?: string }, label?: string, id?: string, plain_language_summary?: string | null }} node
 * @returns {string}
 */
export function generatePlainLanguageSummary(node) {
  if (node.plain_language_summary) return node.plain_language_summary;
  const title = node.metadata?.title || node.label || node.id || 'this item';
  const itemId = node.metadata?.item_id || '';
  const desc = String(node.metadata?.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!desc) {
    return `Review ${itemId ? `${itemId} (${title})` : title} before applying it in your environment.`;
  }

  let summary = desc
    .replace(/organization-defined\s+([\w\s/-]+)/gi, 'limits your organization defines for $1')
    .replace(/\bthe organization\s+(?:shall|must)\s+/gi, 'Your organization should ')
    .replace(/\bthe information system\s+(?:shall|must)\s+/gi, 'The system should ')
    .replace(/\s+to\s+\./g, ' (your organization sets the specific value).')
    .replace(/\s+for each\s+to\s+/g, ' for each account up to ')
    .replace(/\s+after\s+\./g, ' after a timeout your organization defines.')
    .trim();

  summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  const firstSentenceEnd = summary.search(/[.!?]\s/);
  if (firstSentenceEnd !== -1) {
    summary = summary.slice(0, firstSentenceEnd + 1);
  } else if (!/[.!?]$/.test(summary)) {
    summary = `${summary}.`;
  }
  if (summary.length > 220) {
    const cut = summary.lastIndexOf(' ', 217);
    summary = `${summary.slice(0, cut > 80 ? cut : 217).trim()}...`;
  }
  if (/^Ensure we\s+an\b/i.test(summary)) {
    summary = summary.replace(/^Ensure we\s+an\b/i, 'Ensure an');
  }
  if (summary.length < 20) {
    summary = `Review ${itemId ? `${itemId} — ` : ''}${title}: ${summary}`;
  }
  return summary || `Review requirements for ${itemId || title}.`;
}

/**
 * @param {{
 *   plainLanguageRationale?: string,
 *   relationshipType?: string,
 *   sourceNodeId?: string,
 *   targetNodeId?: string,
 *   displayLabel?: string,
 * }} payload
 * @param {{ name?: string }} source
 * @param {string} rationaleVal
 * @returns {string}
 */
export function generatePlainLanguageRationale(payload, source, rationaleVal) {
  if (payload.plainLanguageRationale) return payload.plainLanguageRationale;
  const fromLabel = payload.sourceNodeId?.split(':').pop() || 'one item';
  const toLabel = payload.targetNodeId?.split(':').pop() || 'another item';
  const rel = relationshipLabel(payload.relationshipType);
  const sourceName = source?.name || 'a public source';

  if (rationaleVal && !/^NIST OLIR concept crosswalk associates/i.test(rationaleVal)) {
    return `${rationaleVal} Review both sides of this ${rel} link in ${sourceName} before assuming coverage transfers.`;
  }

  return `This ${rel} link connects ${fromLabel} to ${toLabel} using ${sourceName}. Compare both items before you rely on the mapping in an assessment or authorization package.`;
}
