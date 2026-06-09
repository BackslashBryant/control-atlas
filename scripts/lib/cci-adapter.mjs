const ENTITY_MAP = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

function decodeXml(value = '') {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (_, entity) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return ENTITY_MAP[entity.toLowerCase()];
  });
}

function elementText(xml, name) {
  return decodeXml(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] || '').trim();
}

function attributes(xml) {
  return Object.fromEntries([...xml.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeXml(match[2])]));
}

export function normalizeNistControlId(index = '') {
  const match = index.trim().match(/^([A-Z]{2,3}-\d+)(?:\s*\((\d+)\))?/);
  if (!match) return null;
  return match[2] ? `${match[1]}.${Number.parseInt(match[2], 10)}` : match[1];
}

export function parseCciXml(xml) {
  const version = elementText(xml, 'version');
  const publishDate = elementText(xml, 'publishdate');
  const records = [];
  const relationships = [];

  for (const match of xml.matchAll(/<cci_item id="([^"]+)">([\s\S]*?)<\/cci_item>/g)) {
    const [, id, body] = match;
    const references = [...body.matchAll(/<reference ([^>]+)\/>/g)].map((reference) => attributes(reference[1]));
    const revision5References = references.filter((reference) => reference.title === 'NIST SP 800-53 Revision 5');

    records.push({
      id,
      type: elementText(body, 'type'),
      title: id,
      description: elementText(body, 'definition'),
      status: elementText(body, 'status'),
      publish_date: elementText(body, 'publishdate'),
      contributor: elementText(body, 'contributor'),
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
        evidence_source: 'disa-cci-list',
      });
    }
  }

  return { version, publish_date: publishDate, records, relationships };
}
