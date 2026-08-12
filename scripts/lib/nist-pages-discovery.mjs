import { parse } from 'node-html-parser';

const TOPIC_RULES = [
  ['zero-trust', /\bzero[ -]trust\b/i],
  ['security-controls', /\boscal\b|\bsecurity content\b|\b800-\d+\b|\bfips\s*\d+/i],
  ['cybersecurity', /\bcyber(?:security| physical)?\b|\bsecurity\b/i],
  ['identity', /\bidentity\b|\bauthenticat|\bpiv\b|\bbiometric/i],
  ['privacy', /\bprivacy\b/i],
  ['vulnerability', /\bvuln|\bthreat\b|\bcpe\b|\bswid\b/i],
  ['cryptography', /\bcrypto|\btls\b|\bpqc\b/i],
  ['secure-software', /\bdevsecops\b|\bsecure software\b|\bsoftware identification\b/i],
  ['iot', /\biot\b|internet of things/i],
];

export function classifyNistPagesEntry(entry) {
  const probe = `${entry.repo_name} ${entry.description}`;
  const topics = TOPIC_RULES.filter(([, pattern]) => pattern.test(probe)).map(([topic]) => topic);
  return topics.length
    ? { disposition: 'candidate', topics, reason: 'cybersecurity-or-governance-title-signal' }
    : { disposition: 'excluded', topics: [], reason: 'no-cybersecurity-or-governance-title-signal' };
}

export function extractNistPagesInventory(html, sourceUrl = 'https://pages.nist.gov/pages-root/') {
  const root = parse(html);
  const entries = [];
  for (const row of root.querySelectorAll('table tr')) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;
    const link = cells[0].querySelector('a');
    const repoName = link?.text.trim() || '';
    const href = link?.getAttribute('href') || '';
    if (!repoName || !href) continue;
    const entry = {
      repo_name: repoName,
      url: new URL(href, sourceUrl).href,
      description: cells[1].text.trim(),
    };
    entries.push({ ...entry, ...classifyNistPagesEntry(entry) });
  }
  return entries.sort((a, b) => a.repo_name.localeCompare(b.repo_name, 'en'));
}

const STRUCTURED_EXTENSIONS = new Map([
  ['.csv', 'csv'], ['.xlsx', 'xlsx'], ['.xls', 'xls'], ['.json', 'json'],
  ['.xml', 'xml'], ['.yaml', 'yaml'], ['.yml', 'yaml'], ['.zip', 'zip'],
]);

export function extractStructuredAssets(html, pageUrl) {
  const root = parse(html);
  const assets = [];
  for (const link of root.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    if (!href || /^(?:mailto|javascript|data):/i.test(href)) continue;
    let url;
    try { url = new URL(href, pageUrl); } catch { continue; }
    const pathname = url.pathname.toLowerCase();
    const extension = [...STRUCTURED_EXTENSIONS.keys()].find((suffix) => pathname.endsWith(suffix));
    if (!extension) continue;
    url.hash = '';
    assets.push({
      url: url.href,
      format: STRUCTURED_EXTENSIONS.get(extension),
      label: link.text.trim(),
      source_page: pageUrl,
    });
  }
  return [...new Map(assets.map((asset) => [asset.url, asset])).values()]
    .sort((a, b) => a.url.localeCompare(b.url, 'en'));
}

export function selectStructuredAssetCandidatePages(html, projectUrl, limit = 25) {
  const root = parse(html);
  const base = new URL(projectUrl);
  const candidates = [];
  for (const link of root.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    const label = link.text.trim();
    if (!href || !/(?:mapping|download|data|resource|supplement|control|catalog|schema|artifact)/i.test(`${href} ${label}`)) continue;
    let url;
    try { url = new URL(href, projectUrl); } catch { continue; }
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) continue;
    if (/\.(?:csv|xlsx?|json|xml|ya?ml|zip)$/i.test(url.pathname)) continue;
    url.hash = '';
    candidates.push(url.href);
  }
  return [...new Set(candidates)].sort((a, b) => a.localeCompare(b, 'en')).slice(0, limit);
}
