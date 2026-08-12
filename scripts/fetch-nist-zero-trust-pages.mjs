#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';
import { discoverNistBuilds, parseNistBuildPage, parseSp800207A, parseSp800207Core } from '../tools/importers/nist-zero-trust-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'data', 'curated', 'nist-zt');
const ROOT_URL = 'https://pages.nist.gov/zero-trust-architecture/';
const REPOSITORY = 'usnistgov/zero-trust-architecture';
const REPOSITORY_BRANCH = 'nist-pages';
const BRANCH_API_URL = `https://api.github.com/repos/${REPOSITORY}/branches/${REPOSITORY_BRANCH}`;
const MANIFEST_PATH = join(OUTPUT, 'nist-source-manifest.json');

function readPreviousSources() {
  try {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    return new Map((manifest.sources || []).map((source) => [source.source_key, source]));
  } catch {
    return new Map();
  }
}

function retrievedAtFor(previousSources, sourceKey, sha256, fetchedAt) {
  const previous = previousSources.get(sourceKey);
  return previous?.sha256 === sha256 && previous.retrieved_at
    ? previous.retrieved_at
    : fetchedAt;
}

async function fetchDocument(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Control-Atlas-source-integrity' }, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`NIST ZT page fetch failed: ${response.status} ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    text: bytes.toString('utf8'),
    sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    byte_length: bytes.length,
  };
}

async function resolveOfficialSnapshot() {
  const response = await fetch(BRANCH_API_URL, {
    headers: { 'User-Agent': 'Control-Atlas-source-integrity', Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`NIST ZT repository discovery failed: ${response.status}`);
  const branch = await response.json();
  const commit = branch?.commit?.sha;
  if (!/^[a-f0-9]{40}$/i.test(commit || '')) throw new Error('NIST ZT repository branch did not return a valid commit SHA');
  return commit;
}

function stableArtifactUrl(pagesUrl, commit) {
  const path = new URL(pagesUrl).pathname
    .replace(/^\/zero-trust-architecture\/?/, '') || 'index.html';
  return `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/${path}`;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const previousSources = readPreviousSources();
  const repositoryCommit = await resolveOfficialSnapshot();
  const sp800207Fragments = JSON.parse(readFileSync(join(OUTPUT, 'source-fragments', 'sp800-207.json'), 'utf8'));
  const sp800207AFragments = JSON.parse(readFileSync(join(OUTPUT, 'source-fragments', 'sp800-207a.json'), 'utf8'));
  const core = parseSp800207Core(sp800207Fragments);
  const cloudNative = parseSp800207A(sp800207AFragments);
  const rootArtifactUrl = stableArtifactUrl(ROOT_URL, repositoryCommit);
  const rootDocument = await fetchDocument(rootArtifactUrl);
  const sp180035Overview = {
    ...parseNistBuildPage(rootDocument.text, 'nist-sp-1800-35', ROOT_URL),
    sha256: rootDocument.sha256,
    byte_length: rootDocument.byte_length,
    artifact_url: rootArtifactUrl,
  };
  const discovered = discoverNistBuilds(rootDocument.text, ROOT_URL);
  const builds = [];
  for (const build of discovered) {
    const architectureArtifactUrl = stableArtifactUrl(build.url, repositoryCommit);
    const guideArtifactUrl = stableArtifactUrl(build.guide_url, repositoryCommit);
    const [architectureDocument, guideDocument] = await Promise.all([
      fetchDocument(architectureArtifactUrl),
      fetchDocument(guideArtifactUrl),
    ]);
    const architecture = parseNistBuildPage(architectureDocument.text, `nist-sp-1800-35-${build.code.toLowerCase()}-architecture`, build.url);
    const guide = parseNistBuildPage(guideDocument.text, `nist-sp-1800-35-${build.code.toLowerCase()}-guide`, build.guide_url);
    builds.push({
      id: `SP180035-${build.code}`,
      code: build.code,
      title: build.title,
      architecture_url: build.url,
      implementation_guide_url: build.guide_url,
      architecture_sections: architecture.sections,
      implementation_sections: guide.sections,
      media: [...architecture.sections, ...guide.sections].flatMap((section) => section.media),
      related_build_codes: [...new Set([...architecture.related_build_codes, ...guide.related_build_codes])]
        .filter((code) => code !== build.code),
      source_pages: [
        { role: 'architecture', url: build.url, artifact_url: architectureArtifactUrl, sha256: architectureDocument.sha256, byte_length: architectureDocument.byte_length, sections: architecture.sections.length },
        { role: 'implementation_guide', url: build.guide_url, artifact_url: guideArtifactUrl, sha256: guideDocument.sha256, byte_length: guideDocument.byte_length, sections: guide.sections.length },
      ],
    });
  }
  writeJsonAtomically(join(OUTPUT, 'sp800-207-core.json'), { schema_version: '1.0', ...core });
  writeJsonAtomically(join(OUTPUT, 'sp800-207a-core.json'), { schema_version: '1.0', ...cloudNative });
  writeJsonAtomically(join(OUTPUT, 'sp1800-35-overview.json'), { schema_version: '1.0', ...sp180035Overview });
  writeJsonAtomically(join(OUTPUT, 'sp1800-35-builds.json'), { schema_version: '1.0', records: builds });
  const sources = [
    {
      source_key: sp800207Fragments.document_key,
      url: sp800207Fragments.source.url,
      sha256: sp800207Fragments.source.sha256,
      byte_length: sp800207Fragments.source.byte_length,
      pages: sp800207Fragments.source.pages,
      parsed_tenets: core.tenets.length,
      parsed_components: core.components.length,
    },
    {
      source_key: sp800207AFragments.document_key,
      url: sp800207AFragments.source.url,
      sha256: sp800207AFragments.source.sha256,
      byte_length: sp800207AFragments.source.byte_length,
      pages: sp800207AFragments.source.pages,
      parsed_requirements: cloudNative.requirements.length,
    },
    {
      source_key: 'nist-sp-1800-35',
      url: ROOT_URL,
      artifact_url: rootArtifactUrl,
      sha256: sp180035Overview.sha256,
      byte_length: sp180035Overview.byte_length,
      sections: sp180035Overview.sections.length,
    },
    ...builds.flatMap((build) => build.source_pages.map((page) => ({ source_key: `${build.id}-${page.role}`, ...page }))),
  ].map((source) => ({
    ...source,
    retrieved_at: retrievedAtFor(previousSources, source.source_key, source.sha256, fetchedAt),
  }));

  writeJsonAtomically(MANIFEST_PATH, {
    schema_version: '1.0',
    repository: {
      url: `https://github.com/${REPOSITORY}`,
      branch: REPOSITORY_BRANCH,
      commit: repositoryCommit,
    },
    sources,
    reconciliation: {
      sp800_207_tenets: core.tenets.length,
      sp800_207_logical_components: core.components.length,
      sp800_207a_requirements: cloudNative.requirements.length,
      sp1800_35_builds_discovered: discovered.length,
      sp1800_35_builds_ingested: builds.length,
      sp1800_35_architecture_pages: builds.length,
      sp1800_35_implementation_guides: builds.length,
      parsed_sections: builds.reduce((total, build) => total + build.architecture_sections.length + build.implementation_sections.length, 0),
      media_references: builds.reduce((total, build) => total + build.media.length, 0),
      failed_pages: 0,
      synthetic_records: 0,
    },
  });
  console.log(JSON.stringify({ tenets: core.tenets.length, components: core.components.length, cloud_native_requirements: cloudNative.requirements.length, builds: builds.length, sections: builds.reduce((total, build) => total + build.architecture_sections.length + build.implementation_sections.length, 0) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
