#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INGESTION_STAGES } from './lib/ingestion-pipeline.mjs';
import { preserveGeneratedAt } from './lib/stable-generated-at.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
const dataset = readJson('data/commons-resource-dataset.json');
const candidates = readJson('data/commons-candidate-manifest.json');
const searchIndex = readJson('data/generated/commons-search-index.json');
const outputPath = join(ROOT, 'data/generated/resource-ingestion-ledger.json');
const errors = [];

const acceptedByUrl = new Map((candidates.acceptedCandidates || []).map((entry) => [entry.url, entry]));
const publishedIds = new Set((searchIndex.documents || []).map((entry) => entry.id));
const collectionIds = new Set((dataset.collections || []).map((entry) => entry.id));
const complete = (evidence) => ({ status: 'complete', evidence });
const notApplicable = (reason) => ({ status: 'not_applicable', reason });
const failed = (reason) => ({ status: 'failed', reason });

function presentationStage(resource) {
  const overview = resource.overview;
  const compatibility = resource.compatibility;
  const media = resource.media;
  if (!overview?.text || !overview?.sourceUrl || !overview?.sourceType) {
    return failed('source-backed overview is incomplete');
  }
  if (!['documented', 'not_stated', 'not_applicable'].includes(compatibility?.status)) {
    return failed('compatibility disposition is missing');
  }
  if (!compatibility.sourceUrl || (!compatibility.note && compatibility.status !== 'not_applicable')) {
    return failed('compatibility evidence or explicit limitation is missing');
  }
  if (!['available', 'not_available'].includes(media?.status)) {
    return failed('media disposition is missing');
  }
  if (media.status === 'available' && !(media.items || []).length) {
    return failed('media is marked available without an attributable item');
  }
  if (media.status === 'not_available' && !media.reason) {
    return failed('unavailable media lacks an explicit reason');
  }
  if (resource.presentationProfile?.profileType !== resource.resourceType
    || !resource.presentationProfile?.template
    || !resource.presentationProfile?.whatItDoes?.sourceUrl
    || !resource.presentationProfile?.whoItIsFor?.sourceUrl
    || !resource.presentationProfile?.limitations?.sourceUrl) {
    return failed('type-specific presentation profile is incomplete');
  }
  if (resource.resourceType === 'tool') {
    const requiredToolSections = ['inputs', 'outputs', 'formats', 'integrations', 'installation', 'usage'];
    if (!resource.toolProfile
      || requiredToolSections.some((field) => !resource.toolProfile[field]?.status || !resource.toolProfile[field]?.sourceUrl)
      || !resource.toolProfile.release?.status
      || !resource.toolProfile.maintenance?.status) {
      return failed('tool presentation profile is incomplete');
    }
  }
  if ((media.items || []).some((item) => !/^sha256:[a-f0-9]{64}$/.test(item.sha256 || '')
    || !item.byteLength || !item.width || !item.height || !item.license || !item.commitSha)) {
    return failed('published media lacks byte, dimension, license, or commit evidence');
  }
  return complete('type-specific profile, compatibility, and media carry source evidence or an explicit unavailable disposition');
}

const resources = (dataset.resources || []).map((resource) => {
  const accepted = acceptedByUrl.get(resource.canonicalUrl);
  const repositoryEvidence = resource.repositoryEvidence;
  const featuredCollections = resource.featuredCollections || [];
  const unresolvedCollections = featuredCollections.filter((id) => !collectionIds.has(id));
  const relationshipCount = (resource.companionResources || []).length
    + (resource.childResourceIds || []).length
    + (resource.parentEcosystemId ? 1 : 0);
  const presentation = presentationStage(resource);
  const stages = {
    discover: accepted
      ? complete('accepted candidate manifest contains the canonical URL')
      : failed('resource is absent from the accepted candidate manifest'),
    acquire: repositoryEvidence?.capturedAt && repositoryEvidence?.readmeUrl
      ? complete('repository API facts and README evidence were captured')
      : notApplicable('external locator is curated; upstream bytes are not copied into Control Atlas'),
    attest: resource.sourceEvidence && resource.lastCheckedAt && resource.verificationMethod
      ? complete('source locator, review date, and verification method are recorded')
      : failed('source attestation fields are incomplete'),
    parse: repositoryEvidence?.overviewExcerpt
      ? complete('README-derived fields were extracted by the resource enrichment adapter')
      : notApplicable('publisher locator is represented by reviewed metadata rather than parsed publisher content'),
    normalize: resource.id && resource.slug && resource.resourceType && resource.resourceLane
      ? complete('resource conforms to the normalized Commons record contract')
      : failed('normalized resource identity or classification is incomplete'),
    structure: unresolvedCollections.length
      ? failed(`unresolved collection membership(s): ${unresolvedCollections.join(', ')}`)
      : complete('resource lane, type, and collection memberships use the Commons directory taxonomy'),
    relationships: relationshipCount
      ? complete(`${relationshipCount} explicit ecosystem or companion relationship(s)`)
      : notApplicable('publisher resource declares no directory relationships'),
    presentation,
    reconcile: accepted
      && accepted.candidateName === resource.name
      && accepted.lane === resource.resourceLane
      ? complete('accepted candidate name, URL, and lane reconcile to the published resource')
      : failed('accepted candidate disposition does not reconcile to the published resource'),
    publish: publishedIds.has(resource.id)
      ? complete('resource is present in the generated Commons search index')
      : failed('resource is missing from the generated Commons search index'),
  };

  for (const [stage, result] of Object.entries(stages)) {
    if (result.status === 'failed') errors.push(`${resource.id} ${stage}: ${result.reason}`);
  }
  return { resource_id: resource.id, source_url: resource.canonicalUrl, stages };
});

const ledger = preserveGeneratedAt(outputPath, {
  schema_version: '1.0',
  generated_at: new Date().toISOString(),
  status: errors.length ? 'FAILED' : 'COMPLETE',
  stage_contract: INGESTION_STAGES,
  resources,
  findings: errors,
});
writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');

if (errors.length) {
  console.error(`FAIL: resource ingestion contract has ${errors.length} finding(s):`);
  console.error(errors.slice(0, 80).map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`PASS: resource ingestion contract covers ${resources.length} resources and all ${INGESTION_STAGES.length} stages.`);
