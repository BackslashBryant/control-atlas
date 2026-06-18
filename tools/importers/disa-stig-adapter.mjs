import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { unzipSync, strFromU8 } from 'fflate';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  isArray: (name) => ['Group', 'Rule', 'ident', 'reference', 'check-content', 'plain-text'].includes(name),
});

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function textValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return textValue(value[0]);
  if (typeof value === 'object') {
    if (value['#text'] !== undefined) return String(value['#text']).trim();
    return '';
  }
  return String(value).trim();
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function stripMarkup(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSection(value, tagName) {
  const match = String(value).match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? stripMarkup(match[1]) : '';
}

function cciIds(rule) {
  return asArray(rule.ident)
    .map((ident) => (typeof ident === 'object' ? textValue(ident['#text']) : textValue(ident)))
    .map((value) => value.match(/CCI-\d{6}/)?.[0] || '')
    .filter(Boolean);
}

function parseReferences(rule) {
  return asArray(rule.reference)
    .map((reference) => {
      if (typeof reference === 'string') {
        return { href: '', label: textValue(reference) };
      }
      return {
        href: reference.href || '',
        label: textValue(reference),
      };
    })
    .filter((reference) => reference.href || reference.label);
}

function getCheckText(rule) {
  const content = asArray(rule.check)
    .flatMap((entry) => asArray(entry?.['check-content']))
    .map(textValue)
    .find(Boolean);
  return stripMarkup(content);
}

function detectCatalogKind(benchmark) {
  const probe = `${benchmark.id || ''} ${textValue(benchmark.title)}`.toLowerCase();
  if (probe.includes('srg')) return 'srg';
  if (probe.includes('stig')) return 'stig';
  return null;
}

export function parseDisaXccdf(xml, { sourceKey, artifactUrl, entryPath }) {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Invalid DISA XCCDF structure: ${validation.err?.msg || 'malformed XML'}`);
  }

  const parsed = parser.parse(xml);
  const benchmark = parsed.Benchmark || parsed['cdf:Benchmark'];
  const catalogKind = benchmark ? detectCatalogKind(benchmark) : null;
  const snapshotDate = benchmark?.status?.date || '';
  const version = textValue(benchmark?.version);
  const benchmarkTitle = textValue(benchmark?.title);

  if (!benchmark || !catalogKind || !benchmark.id || !snapshotDate || !version || !benchmarkTitle) {
    throw new Error('DISA XCCDF missing benchmark metadata');
  }

  const benchmarkDescription = stripMarkup(textValue(benchmark.description));
  const records = [];

  for (const group of asArray(benchmark.Group)) {
    const vulnId = group.id || '';
    for (const rule of asArray(group.Rule)) {
      const description = textValue(rule.description) || textValue(group.description);
      const cciReferences = [...new Set(cciIds(rule))];
      const titleVal = textValue(rule.title);
      const discussionVal = extractSection(description, 'VulnDiscussion') || stripMarkup(description);
      let plSummary = `STIG Rule: ${titleVal}`;
      if (!plSummary.endsWith('.')) plSummary += '.';
      if (discussionVal) {
        let cleanDisc = discussionVal.split('. ')[0].replace(/^The\s+/i, '');
        if (cleanDisc.endsWith('.')) {
          cleanDisc = cleanDisc.slice(0, -1);
        }
        plSummary = `STIG Rule: Ensure ${cleanDisc.charAt(0).toLowerCase() + cleanDisc.slice(1)}.`;
      }
      if (plSummary.length > 200) {
        plSummary = plSummary.slice(0, 197) + '...';
      }

      records.push({
        id: vulnId,
        type: catalogKind === 'stig' ? 'stig_rule' : 'srg_requirement',
        title: titleVal,
        description: discussionVal,
        plain_language_summary: plSummary,
        severity: rule.severity || '',
        rule_id: rule.id || '',
        vuln_id: vulnId,
        stig_id: textValue(rule.version) || textValue(group.title),
        check_text: getCheckText(rule),
        fix_text: stripMarkup(textValue(rule.fixtext)),
        references: parseReferences(rule),
        source: {
          key: sourceKey,
          snapshot_date: snapshotDate,
          version,
          locator: `${entryPath}#${vulnId}`,
        },
        metadata: {
          benchmark_id: benchmark.id,
          benchmark_title: benchmarkTitle,
          benchmark_description: benchmarkDescription,
          relationship_catalog: 'disa-cci',
          relationships: cciReferences.map((targetId) => ({
            target_catalog: 'disa-cci',
            target_id: targetId,
            relationship_type: 'references',
          })),
        },
      });
    }
  }

  return {
    catalogKind,
    source_key: sourceKey,
    source_artifact: artifactUrl,
    source_version: version,
    snapshot_date: snapshotDate,
    records,
  };
}

function shouldIgnoreEntry(entryPath) {
  return /(^|\/)(CUI_|CUI\/|Sunset|Draft)/i.test(entryPath);
}

function createDocument(sourceKey, artifactUrl, checksumValue, parsedDocuments) {
  const first = parsedDocuments[0];
  return {
    schema_version: '2.0',
    source_key: sourceKey,
    source_artifact: artifactUrl,
    source_version: first?.source_version || '',
    snapshot_date: first?.snapshot_date || '',
    checksum: checksumValue,
    records: parsedDocuments.flatMap((entry) => entry.records).map((record) => ({
      ...record,
      metadata: {
        ...record.metadata,
        relationships: [],
      },
    })),
  };
}

function createRelationshipDocument(artifactUrl, checksumValue, records) {
  const relationships = records.flatMap((record) =>
    asArray(record.metadata?.relationships).map((relationship) => ({
      source_catalog: record.type === 'stig_rule' ? 'disa-stig' : 'disa-srg',
      source_id: record.id,
      target_catalog: relationship.target_catalog,
      target_id: relationship.target_id,
      relationship_type: relationship.relationship_type,
      why: `The official DISA ${record.type === 'stig_rule' ? 'STIG' : 'SRG'} content references ${relationship.target_id}.`,
      source_locator: record.source.locator,
      evidence_source: 'disa-stig-srg-cci-references',
    })),
  );

  return {
    schema_version: '2.0',
    source_key: 'disa-stig-srg-cci-references',
    source_artifact: artifactUrl,
    source_version: records[0]?.source?.version || '',
    snapshot_date: records[0]?.source?.snapshot_date || '',
    checksum: checksumValue,
    provenance: 'Official DISA public STIG/SRG references to CCIs',
    relationships,
  };
}

function walkArchiveEntries(archive, parentPath = '') {
  const results = [];
  for (const [entryName, entryValue] of Object.entries(archive)) {
    const entryPath = parentPath ? `${parentPath}/${entryName}` : entryName;
    if (/\.zip$/i.test(entryName)) {
      results.push(...walkArchiveEntries(unzipSync(entryValue), entryPath));
      continue;
    }
    results.push({ entryPath, value: entryValue });
  }
  return results;
}

export function parseDisaCompilationArchive(buffer, { artifactUrl, sourceKeys }) {
  const archive = unzipSync(buffer);
  const parsed = { stig: [], srg: [] };

  for (const entry of walkArchiveEntries(archive)) {
    if (shouldIgnoreEntry(entry.entryPath) || !/\.(xml|xccdf)$/i.test(entry.entryPath)) continue;
    const xml = strFromU8(entry.value);
    const document = parseDisaXccdf(xml, {
      sourceKey: entry.entryPath.toLowerCase().includes('srg') ? sourceKeys.srg : sourceKeys.stig,
      artifactUrl,
      entryPath: entry.entryPath,
    });
    parsed[document.catalogKind].push(document);
  }

  const checksumValue = checksum(buffer);
  const stig = createDocument(sourceKeys.stig, artifactUrl, checksumValue, parsed.stig);
  const srg = createDocument(sourceKeys.srg, artifactUrl, checksumValue, parsed.srg);
  const relationships = createRelationshipDocument(
    artifactUrl,
    checksumValue,
    [...parsed.stig, ...parsed.srg].flatMap((entry) => entry.records),
  );

  return { stig, srg, relationships, checksum: checksumValue };
}
