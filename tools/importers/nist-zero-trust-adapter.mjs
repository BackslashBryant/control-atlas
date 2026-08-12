import { createHash } from 'node:crypto';
import { parse } from 'node-html-parser';

function normalizedText(value) {
  return String(value || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function sourceFragment(sourceKey, locator, text, method) {
  return { source_key: sourceKey, locator, text, checksum: sha256(text), extraction_method: method };
}

function sourceLines(document, pageNumbers) {
  return pageNumbers.flatMap((pageNumber) => {
    const page = document.pages.find((entry) => entry.page === pageNumber);
    if (!page) throw new Error(`${document.document_key} is missing page ${pageNumber}`);
    return page.lines.slice(11).map((line) => ({ page: pageNumber, ...line }));
  });
}

function pdfFragments(document, lines) {
  return lines.map((line) => ({
    document_key: document.document_key,
    page: line.page,
    bbox: line.bbox,
    text: line.text,
    checksum: sha256(line.text),
    extraction_method: `pdfplumber-${document.extractor.version}-line`,
  }));
}

function joinPdfLines(lines) {
  return lines.map((line) => line.text).join(' ').replace(/([A-Za-z])- ([a-z])/g, '$1$2').replace(/\s+/g, ' ').trim();
}

export function parseSp800207Core(document) {
  const overviewLines = sourceLines(document, [13]);
  const overviewStart = overviewLines.findIndex((line) => /^Zero trust is a cybersecurity paradigm/.test(line.text));
  const overviewEnd = overviewLines.findIndex((line) => /^An operative definition/.test(line.text));
  if (overviewStart < 0 || overviewEnd < 0) throw new Error('SP 800-207 overview boundaries were not found');
  const overviewSource = overviewLines.slice(overviewStart, overviewEnd);
  const overview = {
    title: 'NIST SP 800-207 Zero Trust Architecture',
    description: joinPdfLines(overviewSource),
    source_key: document.document_key,
    locator: `${document.source.filename}#page=13`,
    source_fragments: pdfFragments(document, overviewSource),
  };
  const tenetLines = sourceLines(document, [15, 16]);
  const tenetStart = tenetLines.findIndex((line) => /^1\. /.test(line.text));
  const tenetEnd = tenetLines.findIndex((line) => /^The above tenets/.test(line.text));
  if (tenetStart < 0 || tenetEnd < 0) throw new Error('SP 800-207 tenet boundaries were not found');
  const tenets = [];
  for (let number = 1; number <= 7; number += 1) {
    const start = tenetLines.findIndex((line, index) => index >= tenetStart && new RegExp(`^${number}\\. `).test(line.text));
    const end = number === 7
      ? tenetEnd
      : tenetLines.findIndex((line, index) => index > start && new RegExp(`^${number + 1}\\. `).test(line.text));
    if (start < 0 || end < 0) throw new Error(`SP 800-207 tenet ${number} was not bounded`);
    const lines = tenetLines.slice(start, end);
    const body = joinPdfLines(lines).replace(new RegExp(`^${number}\\.\\s*`), '');
    const titleEnd = body.indexOf('. ');
    if (titleEnd < 0) throw new Error(`SP 800-207 tenet ${number} has no title boundary`);
    tenets.push({
      id: `SP800207-TENET-${number}`,
      number,
      title: body.slice(0, titleEnd),
      description: body,
      source_key: document.document_key,
      locator: `${document.source.filename}#page=${lines[0].page}`,
      source_fragments: pdfFragments(document, lines),
    });
  }

  const componentLines = sourceLines(document, [18, 19, 20]);
  const start = componentLines.findIndex((line) => /^• Policy engine/.test(line.text));
  const end = componentLines.findIndex((line) => /^3\.1 Variations/.test(line.text));
  if (start < 0 || end < 0) throw new Error('SP 800-207 logical component boundaries were not found');
  const relevant = componentLines.slice(start, end);
  const indexes = relevant.map((line, index) => line.text.startsWith('• ') ? index : -1).filter((index) => index >= 0);
  const components = indexes.map((componentStart, index) => {
    const lines = relevant.slice(componentStart, indexes[index + 1] ?? relevant.length);
    const body = joinPdfLines(lines).replace(/^•\s*/, '');
    const colon = body.indexOf(':');
    if (colon < 0) throw new Error(`SP 800-207 component on page ${lines[0].page} has no title boundary`);
    const title = body.slice(0, colon);
    return {
      id: `SP800207-COMPONENT-${title.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      title,
      description: body.slice(colon + 1).trim(),
      component_class: index < 3 ? 'core' : 'supporting',
      source_key: document.document_key,
      locator: `${document.source.filename}#page=${lines[0].page}`,
      source_fragments: pdfFragments(document, lines),
    };
  });
  if (tenets.length !== 7 || components.length !== 11) {
    throw new Error(`SP 800-207 reconciliation failed: ${tenets.length} tenets, ${components.length} components`);
  }
  return { overview, tenets, components };
}

function sp800207APageLines(document, pageNumbers) {
  return pageNumbers.flatMap((pageNumber) => {
    const page = document.pages.find((entry) => entry.page === pageNumber);
    if (!page) throw new Error(`${document.document_key} is missing page ${pageNumber}`);
    return page.lines
      .filter((line) => !/^NIST SP 800-207A /.test(line.text))
      .filter((line) => !/^September 2023 /.test(line.text))
      .filter((line) => !/^\d+$/.test(line.text.trim()))
      .map((line) => ({ page: pageNumber, ...line }));
  });
}

function parseLabeledRecommendations(document, pageNumbers, stopPattern) {
  const lines = sp800207APageLines(document, pageNumbers);
  const marker = /^[^A-Z0-9]*(ID-SEG-REC-\d+|MON-CNA-REQ-\d+|MON-DATA-USE-\d+):\s*/;
  const indexes = lines
    .map((line, index) => marker.test(line.text) ? index : -1)
    .filter((index) => index >= 0);
  return indexes.map((start, index) => {
    const next = indexes[index + 1] ?? lines.length;
    const stop = lines.findIndex((line, lineIndex) => lineIndex > start && lineIndex < next && stopPattern?.test(line.text));
    const recordLines = lines.slice(start, stop >= 0 ? stop : next);
    const first = recordLines[0].text.match(marker);
    const id = first?.[1];
    if (!id) throw new Error(`SP 800-207A recommendation on page ${recordLines[0].page} has no identifier`);
    const body = joinPdfLines(recordLines).replace(marker, '');
    const divider = body.indexOf('—');
    const title = divider >= 0
      ? body.slice(0, divider).trim()
      : id.startsWith('MON-CNA')
        ? `Cloud-native monitoring requirement ${id.at(-1)}`
        : `Monitoring data use ${id.at(-1)}`;
    return {
      id,
      title,
      description: divider >= 0 ? body.slice(divider + 1).trim() : body,
      locator: `${document.source.filename}#page=${recordLines[0].page}`,
      source_fragments: pdfFragments(document, recordLines),
    };
  });
}

export function parseSp800207A(document) {
  const abstractLines = sp800207APageLines(document, [5]);
  const abstractStart = abstractLines.findIndex((line) => line.text === 'Abstract');
  const abstractEnd = abstractLines.findIndex((line) => line.text === 'Keywords');
  if (abstractStart < 0 || abstractEnd <= abstractStart) throw new Error('SP 800-207A abstract boundaries were not found');
  const abstractSource = abstractLines.slice(abstractStart + 1, abstractEnd);
  const requirements = [
    ...parseLabeledRecommendations(document, [16, 17], /^Context for the application/),
    ...parseLabeledRecommendations(document, [28, 29]),
  ];
  const expectedIds = [
    'ID-SEG-REC-1', 'ID-SEG-REC-2', 'ID-SEG-REC-3', 'ID-SEG-REC-4', 'ID-SEG-REC-5',
    'MON-CNA-REQ-1', 'MON-CNA-REQ-2', 'MON-CNA-REQ-3', 'MON-CNA-REQ-4',
    'MON-DATA-USE-1', 'MON-DATA-USE-2',
  ];
  if (requirements.length !== expectedIds.length || expectedIds.some((id) => !requirements.some((entry) => entry.id === id))) {
    throw new Error(`SP 800-207A reconciliation failed: expected ${expectedIds.length} requirements, parsed ${requirements.length}`);
  }
  return {
    overview: {
      title: 'NIST SP 800-207A A Zero Trust Architecture Model for Access Control in Cloud-Native Applications in Multi-Location Environments',
      description: joinPdfLines(abstractSource),
      locator: `${document.source.filename}#page=5`,
      source_fragments: pdfFragments(document, abstractSource),
    },
    requirements,
  };
}

function closestSection(node) {
  let cursor = node;
  while (cursor) {
    if (cursor.tagName === 'SECTION') return cursor;
    cursor = cursor.parentNode;
  }
  return null;
}

function blockForElement(element) {
  const value = normalizedText(element.text);
  if (!value) return null;
  if (element.tagName === 'PRE') return { type: 'code', text: value };
  if (element.tagName === 'OL' || element.tagName === 'UL') {
    const items = element.childNodes
      .filter((child) => child.tagName === 'LI')
      .map((child) => normalizedText(child.text))
      .filter(Boolean);
    return items.length ? { type: element.tagName === 'OL' ? 'ordered_list' : 'unordered_list', items } : null;
  }
  return { type: 'paragraph', text: value };
}

export function parseNistBuildPage(html, sourceKey, url) {
  const root = parse(html);
  const article = root.querySelector('article');
  if (!article) throw new Error(`${sourceKey} has no article element`);
  const sections = article.querySelectorAll('section').map((section, index) => {
    const heading = section.querySelector('h1,h2,h3,h4,h5,h6');
    const title = normalizedText(heading?.text).replace(/#$/, '').trim();
    const id = section.id || `section-${index + 1}`;
    const elements = section.querySelectorAll('p,ol,ul,pre').filter((element) => closestSection(element) === section);
    const structuredContent = elements.map(blockForElement).filter(Boolean);
    const media = section.querySelectorAll('img')
      .filter((image) => closestSection(image) === section)
      .map((image) => ({
        url: new URL(image.getAttribute('src'), url).href,
        alt: normalizedText(image.getAttribute('alt')) || null,
        source_locator: `${url}#${id}`,
      }));
    return {
      id,
      title: title || id,
      structured_content: structuredContent,
      media,
      locator: `${url}#${id}`,
      source_fragments: structuredContent.map((block, blockIndex) => {
        const value = block.text || block.items.join('\n');
        return sourceFragment(sourceKey, `${url}#${id}:block-${blockIndex + 1}`, value, 'explicit-html-markup');
      }),
    };
  }).filter((section) => section.structured_content.length || section.media.length);
  if (!sections.length) throw new Error(`${sourceKey} has no substantive sections`);
  const relatedBuildCodes = [...new Set(article.querySelectorAll('a').flatMap((anchor) => {
    const match = `${anchor.text} ${anchor.getAttribute('href') || ''}`.match(/E\d+B\d+/g);
    return match || [];
  }))];
  return {
    title: normalizedText(article.querySelector('h1')?.text).replace(/#$/, '').trim(),
    sections,
    sha256: sha256(html),
    byte_length: Buffer.byteLength(html),
    related_build_codes: relatedBuildCodes,
  };
}

export function discoverNistBuilds(html, rootUrl) {
  const root = parse(html);
  const architecture = new Map();
  const guides = new Map();
  for (const anchor of root.querySelectorAll('a')) {
    const title = normalizedText(anchor.text).replace(/ Product Guides$/, '');
    const code = title.match(/\((E\d+B\d+)\)/)?.[1];
    if (!code) continue;
    const href = anchor.getAttribute('href');
    if (/VolumeB\/appendices\/Appendix-/.test(href || '')) architecture.set(code, { title, url: new URL(href, rootUrl).href });
    if (/VolumeC\/HowTo-/.test(href || '')) guides.set(code, new URL(href, rootUrl).href);
  }
  const builds = [...architecture.entries()].map(([code, entry]) => ({ code, ...entry, guide_url: guides.get(code) || null }));
  if (builds.length !== 19 || builds.some((build) => !build.guide_url)) {
    throw new Error(`SP 1800-35 build discovery expected 19 architecture and guide pairs; found ${builds.length}`);
  }
  return builds;
}
