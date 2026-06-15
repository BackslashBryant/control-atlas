function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function stripTags(value = '') {
  return normalizeWhitespace(String(value).replace(/<[^>]+>/g, ' '));
}

function matchTitle(html) {
  const match = String(html).match(/<title>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(match?.[1] || '');
}

function matchFirst(html, pattern) {
  const match = String(html).match(pattern);
  return normalizeWhitespace(match?.[1] || '');
}

function collectMatches(html, pattern) {
  return [...String(html).matchAll(pattern)].map((match) => normalizeWhitespace(match[1])).filter(Boolean);
}

function officialCyberMilLabel(url) {
  if (/\/compilations\/?$/i.test(url)) return 'SRG and STIG Library Compilations';
  if (/\/downloads\/?$/i.test(url)) return 'STIG Downloads';
  if (/\/gpo\/?$/i.test(url)) return 'STIG GPO Downloads';
  return 'DISA STIG entrypoint';
}

export function parseCyberMilLanding(html, url) {
  const shell = /<webruntime-app>/i.test(html) || /Welcome to LWC Communities!/i.test(html) || /globalThis\.LWR/i.test(html);
  const title = shell
    ? officialCyberMilLabel(url)
    : (matchTitle(html) || matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || officialCyberMilLabel(url));
  const summary = stripTags(
    matchFirst(html, /<p[^>]*>([\s\S]*?)<\/p>/i)
    || 'Official DISA public entrypoint for STIG acquisition resources.',
  );
  const signals = ['official-disa', 'stigs-entrypoint'];

  if (shell) {
    signals.push('salesforce-lwc-shell', 'static-html-withheld');
  }

  return {
    url,
    title,
    kind: 'official_entrypoint',
    signals,
    summary: shell
      ? 'Official DISA STIG entrypoint delivered through a Salesforce LWC shell; direct artifact links are not exposed in static HTML.'
      : summary,
  };
}

export function parseStigViewerCatalog(html, url) {
  const title = matchTitle(html) || matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || 'STIG Viewer';
  const sampleSlugs = collectMatches(html, /href="\/stigs\/([^"/?#]+)"/gi).slice(0, 12);
  const exposesApi = /api/i.test(html);

  return {
    url,
    title,
    kind: 'supplemental_catalog',
    exposes_api: exposesApi,
    sample_slugs: sampleSlugs,
    sample_count: sampleSlugs.length,
  };
}

export function parseStigViewerPressRelease(html, url) {
  const title = matchTitle(html) || matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || 'STIG Viewer press release';
  const normalized = normalizeWhitespace(stripTags(html)).toLowerCase();

  return {
    url,
    title,
    kind: 'supplemental_api_announcement',
    exposes_structured_json: normalized.includes('structured json') || normalized.includes('normalized to json'),
    claims_quarterly_updates: normalized.includes('quarterly'),
  };
}

export function parseGithubRepoSignals(html, url) {
  const title = matchTitle(html) || 'Repository';
  const normalized = normalizeWhitespace(stripTags(html)).toLowerCase();

  return {
    url,
    title,
    kind: 'supplemental_tooling',
    supports_xccdf: normalized.includes('xccdf'),
    supports_ckl: normalized.includes('ckl'),
    supports_revision_management: normalized.includes('revision management'),
    supports_stigs_and_srgs:
      normalized.includes('stigs') && (normalized.includes('srgs') || normalized.includes('security requirements guides')),
  };
}

export function parseGithubOrganizationSignals(html, url) {
  const title = matchTitle(html) || 'GitHub organization';
  const normalized = normalizeWhitespace(stripTags(html)).toLowerCase();

  return {
    url,
    title,
    kind: 'supplemental_tooling_org',
    highlights_stig_tooling:
      normalized.includes('stig') || normalized.includes('security technical implementation guide'),
  };
}
