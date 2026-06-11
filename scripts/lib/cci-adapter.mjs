import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  isArray: (name) => ['cci_item', 'reference'].includes(name),
});

export function normalizeNistControlId(index = '') {
  const match = String(index).trim().match(/^([A-Z]{2,3}-\d+)(?:\s*\((\d+)\))?/);
  if (!match) return null;
  return match[2] ? `${match[1]}.${Number.parseInt(match[2], 10)}` : match[1];
}

function textValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' && value['#text'] !== undefined) return String(value['#text']).trim();
  return String(value).trim();
}

export function parseCciXml(xml) {
  const parsed = parser.parse(xml);
  const root = parsed.cci_list || parsed;
  const metadata = root.metadata || {};
  const version = textValue(metadata.version);
  const publishDate = textValue(metadata.publishdate);
  const records = [];
  const relationships = [];

  const items = root.cci_items?.cci_item || [];
  for (const item of items) {
    const id = item.id;
    const references = (item.references?.reference || []).map((reference) => ({
      creator: reference.creator || '',
      title: reference.title || '',
      version: reference.version || '',
      location: reference.location || '',
      index: reference.index || '',
    }));
    const revision5References = references.filter((reference) => reference.title === 'NIST SP 800-53 Revision 5');

    records.push({
      id,
      type: textValue(item.type),
      title: id,
      description: textValue(item.definition),
      status: textValue(item.status),
      publish_date: textValue(item.publishdate),
      contributor: textValue(item.contributor),
      references,
      source: {
        key: 'disa-cci-list',
        snapshot_date: publishDate,
        version,
        locator: `U_CCI_List.xml#${id}`,
      },
    });

    for (const reference of revision5References) {
      const targetId = normalizeNistControlId(reference.index);
      if (!targetId) continue;
      relationships.push({
        source_id: id,
        target_id: targetId,
        why: `The official CCI List references NIST SP 800-53 Revision 5 ${reference.index}.`,
        source_locator: `U_CCI_List.xml#${id}`,
        evidence_source: 'disa-cci-nist-references',
      });
    }
  }

  return { version, publish_date: publishDate, records, relationships };
}
